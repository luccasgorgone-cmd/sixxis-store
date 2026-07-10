import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { recalcularTotalGasto } from '@/lib/cashback'
import { isStatusPago } from '@/lib/pedido-status'

export const dynamic = 'force-dynamic'

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  // preview=true calcula o que seria excluído/revertido/bloqueado SEM apagar nada
  // (alimenta o modal de confirmação). Mesma lógica de trava, zero duplicação.
  preview: z.boolean().optional(),
})

const round2 = (v: number) => parseFloat(v.toFixed(2))

// TRAVA (decisão do dono): não excluir pedido PAGO (pago/enviado/entregue) que
// tenha saldo vinculado (cashback ou pontos), a menos que esteja CANCELADO.
// isStatusPago já é false para 'cancelado', então o "exceto se cancelado" é
// automático. Cancelados/pendentes excluem normal.
const MOTIVO_TRAVA =
  'Pedido pago com cashback/pontos vinculados. Cancele o pedido antes de excluir (a exclusão reverte o saldo).'

/**
 * Hard delete de pedidos (admin). Remove o pedido DE VERDADE, com a cascata
 * completa — inclusive o que o banco não cascateia sozinho.
 *
 * ItemPedido, Pagamento e GarantiaEstendida têm FK com onDelete: Cascade e somem
 * junto com o pedido. Já CashbackTransacao, HistoricoPontos e CupomUso guardam
 * `pedidoId` como coluna solta, SEM foreign key: o delete não falharia, apenas
 * deixaria linhas apontando para um pedido inexistente. Pior: essas três linhas
 * sustentam saldos ARMAZENADOS (Cliente.cashbackSaldo/cashbackPendente,
 * PontosCliente.pontos, Cupom.totalUsos), que não se recalculam sozinhos.
 *
 * Então, além de apagar as linhas, revertemos a contribuição de cada uma ao seu
 * saldo — tudo numa transação, com piso em zero (o cliente pode já ter gastado
 * um crédito vindo do pedido que está sendo excluído).
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const ids = [...new Set(parsed.data.ids)]
  const preview = parsed.data.preview === true

  const pedidos = await prisma.pedido.findMany({
    where:  { id: { in: ids } },
    select: { id: true, status: true, clienteId: true, total: true },
  })
  if (pedidos.length === 0) {
    return NextResponse.json({ error: 'Nenhum pedido encontrado' }, { status: 404 })
  }

  // Só os que existem de fato — nunca agimos sobre ids que o front mandou a mais.
  const idsReais = pedidos.map((p) => p.id)

  // Carrega TODAS as linhas de saldo dos ids pedidos — com pedidoId, pra saber
  // POR pedido quem tem saldo vinculado (a trava) e pra restringir a reversão só
  // aos pedidos realmente excluídos.
  const [transacoesTodas, pontosTodos, usosCupomTodos] = await Promise.all([
    prisma.cashbackTransacao.findMany({
      where:  { pedidoId: { in: idsReais } },
      select: { pedidoId: true, clienteId: true, tipo: true, status: true, valor: true },
    }),
    prisma.historicoPontos.findMany({
      where:  { pedidoId: { in: idsReais } },
      select: { pedidoId: true, clienteId: true, pontos: true },
    }),
    prisma.cupomUso.findMany({
      where:  { pedidoId: { in: idsReais } },
      select: { pedidoId: true, cupomId: true },
    }),
  ])

  // Pedidos que têm saldo vinculado (cashback OU pontos). Cupom NÃO conta pra
  // trava (é contador de uso, não saldo do cliente).
  const cashbackPorPedido = new Map<string, number>() // total de crédito não-cancelado
  const pontosPorPedido = new Map<string, number>()
  for (const t of transacoesTodas) {
    if (!t.pedidoId) continue
    if (t.tipo === 'credito' && t.status !== 'cancelado') {
      cashbackPorPedido.set(t.pedidoId, (cashbackPorPedido.get(t.pedidoId) ?? 0) + Number(t.valor))
    }
  }
  for (const h of pontosTodos) {
    if (!h.pedidoId) continue
    pontosPorPedido.set(h.pedidoId, (pontosPorPedido.get(h.pedidoId) ?? 0) + h.pontos)
  }
  const temSaldoVinculado = (pid: string) =>
    transacoesTodas.some((t) => t.pedidoId === pid) || pontosTodos.some((h) => h.pedidoId === pid)

  // ── TRAVA: separa permitidos × bloqueados ──────────────────────────────────
  const bloqueados = pedidos
    .filter((p) => isStatusPago(p.status) && temSaldoVinculado(p.id))
    .map((p) => ({
      id:       p.id,
      status:   p.status,
      motivo:   MOTIVO_TRAVA,
      cashback: round2(cashbackPorPedido.get(p.id) ?? 0),
      pontos:   pontosPorPedido.get(p.id) ?? 0,
    }))
  const idsBloqueados = new Set(bloqueados.map((b) => b.id))

  const pedidosPermitidos = pedidos.filter((p) => !idsBloqueados.has(p.id))
  const idsPermitidos = pedidosPermitidos.map((p) => p.id)
  const setPermitidos = new Set(idsPermitidos)
  const clientesAfetados = [...new Set(pedidosPermitidos.map((p) => p.clienteId))]
  const pagosExcluidos = pedidosPermitidos.filter((p) => isStatusPago(p.status))

  // Só as linhas dos pedidos PERMITIDOS entram na reversão.
  const transacoes = transacoesTodas.filter((t) => t.pedidoId && setPermitidos.has(t.pedidoId))
  const pontos = pontosTodos.filter((h) => h.pedidoId && setPermitidos.has(h.pedidoId))
  const usosCupom = usosCupomTodos.filter((u) => u.pedidoId && setPermitidos.has(u.pedidoId))

  // Totais a reverter (para o modal e a resposta).
  const reverter = {
    cashback: round2(
      transacoes
        .filter((t) => t.tipo === 'credito' && t.status !== 'cancelado')
        .reduce((s, t) => s + Number(t.valor), 0),
    ),
    pontos:    pontos.reduce((s, h) => s + h.pontos, 0),
    cupomUsos: usosCupom.length,
  }

  // ── PREVIEW: não apaga nada, só devolve o que aconteceria ──────────────────
  if (preview) {
    return NextResponse.json({
      preview: true,
      aExcluir: idsPermitidos.length,
      bloqueados,
      reverter,
    })
  }

  // Todos os selecionados caíram na trava → nada a excluir.
  if (idsPermitidos.length === 0) {
    console.info('[excluir-pedidos] todos bloqueados pela trava', { bloqueados: bloqueados.map((b) => b.id) })
    return NextResponse.json({ ok: true, excluidos: 0, pagosExcluidos: 0, bloqueados })
  }

  // ── Delta de cashback por cliente ──────────────────────────────────────────
  // Espelha o que cada lançamento somou ao saldo quando foi criado:
  //   credito/pendente   → entrou em cashbackPendente
  //   credito/disponivel → entrou em cashbackSaldo
  //   credito/cancelado  → já foi revertido no clawback, não mexe
  //   debito             → saiu de cashbackSaldo (devolvemos)
  const deltaCashback = new Map<string, { saldo: number; pendente: number }>()
  for (const t of transacoes) {
    const d = deltaCashback.get(t.clienteId) ?? { saldo: 0, pendente: 0 }
    const valor = Number(t.valor)
    if (t.tipo === 'credito') {
      if (t.status === 'pendente') d.pendente -= valor
      else if (t.status !== 'cancelado') d.saldo -= valor
    } else {
      d.saldo += valor
    }
    deltaCashback.set(t.clienteId, d)
  }

  const deltaPontos = new Map<string, number>()
  for (const h of pontos) {
    deltaPontos.set(h.clienteId, (deltaPontos.get(h.clienteId) ?? 0) + h.pontos)
  }

  const usosPorCupom = new Map<string, number>()
  for (const u of usosCupom) {
    usosPorCupom.set(u.cupomId, (usosPorCupom.get(u.cupomId) ?? 0) + 1)
  }

  await prisma.$transaction(async (tx) => {
    // Linhas sem FK: apagadas explicitamente, senão viram órfãs. Só dos permitidos.
    await tx.cupomUso.deleteMany({ where: { pedidoId: { in: idsPermitidos } } })
    await tx.historicoPontos.deleteMany({ where: { pedidoId: { in: idsPermitidos } } })
    await tx.cashbackTransacao.deleteMany({ where: { pedidoId: { in: idsPermitidos } } })

    // Saldos ajustados com UPDATE relativo + GREATEST, nunca lendo antes para
    // escrever um valor absoluto: um read-modify-write perderia o resgate de
    // cashback que o cliente fizesse no checkout entre a leitura e a escrita.
    // O GREATEST aplica o piso em zero dentro do próprio banco.
    for (const [clienteId, d] of deltaCashback) {
      await tx.$executeRaw`
        UPDATE \`Cliente\`
           SET \`cashbackSaldo\`    = ROUND(GREATEST(0, \`cashbackSaldo\`    + ${round2(d.saldo)}), 2),
               \`cashbackPendente\` = ROUND(GREATEST(0, \`cashbackPendente\` + ${round2(d.pendente)}), 2)
         WHERE \`id\` = ${clienteId}
      `
    }

    for (const [clienteId, delta] of deltaPontos) {
      await tx.$executeRaw`
        UPDATE \`PontosCliente\`
           SET \`pontos\` = GREATEST(0, \`pontos\` - ${delta})
         WHERE \`clienteId\` = ${clienteId}
      `
    }

    for (const [cupomId, usos] of usosPorCupom) {
      await tx.$executeRaw`
        UPDATE \`Cupom\`
           SET \`totalUsos\` = GREATEST(0, \`totalUsos\` - ${usos})
         WHERE \`id\` = ${cupomId}
      `
    }

    // ItemPedido / Pagamento / GarantiaEstendida caem por cascata no banco.
    await tx.pedido.deleteMany({ where: { id: { in: idsPermitidos } } })
  })

  // Fora da transação, de propósito: o agregado tem que ler o estado JÁ sem os
  // pedidos excluídos. Falha aqui não desfaz a exclusão (best-effort).
  for (const clienteId of clientesAfetados) {
    await recalcularTotalGasto(clienteId).catch((e) =>
      console.error('[excluir-pedidos] recalcular totalGasto:', (e as Error).message),
    )
  }

  console.info('[excluir-pedidos]', {
    quantidade:  idsPermitidos.length,
    ids:         idsPermitidos,
    pagos:       pagosExcluidos.map((p) => p.id),
    bloqueados:  bloqueados.map((b) => b.id),
    cashback:    transacoes.length,
    pontos:      pontos.length,
    usosCupom:   usosCupom.length,
    clientes:    clientesAfetados.length,
  })

  await auditLog({
    req: request,
    action: 'pedido.excluir',
    target: idsPermitidos.join(','),
    metadata: {
      quantidade: idsPermitidos.length,
      pagos: pagosExcluidos.map((p) => ({ id: p.id, status: p.status, total: Number(p.total) })),
      bloqueados: bloqueados.map((b) => ({ id: b.id, status: b.status })),
      revertido: reverter,
      relacionadosRemovidos: {
        cashbackTransacao: transacoes.length,
        historicoPontos:   pontos.length,
        cupomUso:          usosCupom.length,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    excluidos: idsPermitidos.length,
    pagosExcluidos: pagosExcluidos.length,
    bloqueados,
    reverter,
  })
}
