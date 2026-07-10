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
})

const round2 = (v: number) => parseFloat(v.toFixed(2))

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

  const pedidos = await prisma.pedido.findMany({
    where:  { id: { in: ids } },
    select: { id: true, status: true, clienteId: true, total: true },
  })
  if (pedidos.length === 0) {
    return NextResponse.json({ error: 'Nenhum pedido encontrado' }, { status: 404 })
  }

  // Só os que existem de fato — nunca agimos sobre ids que o front mandou a mais.
  const idsReais = pedidos.map((p) => p.id)
  const clientesAfetados = [...new Set(pedidos.map((p) => p.clienteId))]
  const pagosExcluidos = pedidos.filter((p) => isStatusPago(p.status))

  const [transacoes, pontos, usosCupom] = await Promise.all([
    prisma.cashbackTransacao.findMany({
      where:  { pedidoId: { in: idsReais } },
      select: { clienteId: true, tipo: true, status: true, valor: true },
    }),
    prisma.historicoPontos.findMany({
      where:  { pedidoId: { in: idsReais } },
      select: { clienteId: true, pontos: true },
    }),
    prisma.cupomUso.findMany({
      where:  { pedidoId: { in: idsReais } },
      select: { cupomId: true },
    }),
  ])

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
    // Linhas sem FK: apagadas explicitamente, senão viram órfãs.
    await tx.cupomUso.deleteMany({ where: { pedidoId: { in: idsReais } } })
    await tx.historicoPontos.deleteMany({ where: { pedidoId: { in: idsReais } } })
    await tx.cashbackTransacao.deleteMany({ where: { pedidoId: { in: idsReais } } })

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
    await tx.pedido.deleteMany({ where: { id: { in: idsReais } } })
  })

  // Fora da transação, de propósito: o agregado tem que ler o estado JÁ sem os
  // pedidos excluídos. Falha aqui não desfaz a exclusão (best-effort).
  for (const clienteId of clientesAfetados) {
    await recalcularTotalGasto(clienteId).catch((e) =>
      console.error('[excluir-pedidos] recalcular totalGasto:', (e as Error).message),
    )
  }

  console.info('[excluir-pedidos]', {
    quantidade:  idsReais.length,
    ids:         idsReais,
    pagos:       pagosExcluidos.map((p) => p.id),
    cashback:    transacoes.length,
    pontos:      pontos.length,
    usosCupom:   usosCupom.length,
    clientes:    clientesAfetados.length,
  })

  await auditLog({
    req: request,
    action: 'pedido.excluir',
    target: idsReais.join(','),
    metadata: {
      quantidade: idsReais.length,
      pagos: pagosExcluidos.map((p) => ({ id: p.id, status: p.status, total: Number(p.total) })),
      relacionadosRemovidos: {
        cashbackTransacao: transacoes.length,
        historicoPontos:   pontos.length,
        cupomUso:          usosCupom.length,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    excluidos: idsReais.length,
    pagosExcluidos: pagosExcluidos.length,
  })
}
