import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { enviarEmailRastreio } from '@/lib/email'
import { liberarCashbackPedido, estornarCashbackPedido } from '@/lib/cashback'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Decimal | null a partir de '', null ou número.
const custoField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().nonnegative().nullable(),
)

const patchSchema = z.object({
  // 'despachar' = 1ª inserção de rastreio (pago → enviado + email)
  // 'entregue'  = marca como entregue
  // ausente     = edição genérica (sem troca de status, sem email)
  acao:           z.enum(['despachar', 'entregue']).optional(),
  status:         z.string().optional(),
  codigoRastreio: z.string().nullable().optional(),
  transportadora: z.string().nullable().optional(),
  linkRastreio:   z.string().nullable().optional(),
  custoFreteReal: custoField.optional(),
})

function limpar(v: string | null | undefined): string | null {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const dados = parsed.data

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: {
      status: true, codigoRastreio: true, transportadora: true,
      linkRastreio: true, custoFreteReal: true, enviadoEm: true, entregueEm: true,
      fretePrazo: true,
      cliente: { select: { nome: true, email: true } },
    },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  // ── Campos de rastreio/custo conforme a ação ───────────────────────────────
  if (dados.acao === 'despachar') {
    const codigo = limpar(dados.codigoRastreio) ?? pedido.codigoRastreio
    if (!codigo) {
      return NextResponse.json(
        { error: 'Código de rastreio é obrigatório para confirmar o envio.' },
        { status: 400 },
      )
    }
    data.codigoRastreio = codigo
    if (dados.transportadora !== undefined) data.transportadora = limpar(dados.transportadora)
    if (dados.linkRastreio !== undefined) data.linkRastreio = limpar(dados.linkRastreio)
    if (dados.custoFreteReal !== undefined) data.custoFreteReal = dados.custoFreteReal
    data.status = 'enviado'
  }
  // ── Marcar como entregue ──────────────────────────────────────────────────
  else if (dados.acao === 'entregue') {
    data.status = 'entregue'
  }
  // ── Edição genérica (correção) — pode ou não trocar status ─────────────────
  else {
    if (dados.status !== undefined) data.status = dados.status
    if (dados.codigoRastreio !== undefined) data.codigoRastreio = limpar(dados.codigoRastreio)
    if (dados.transportadora !== undefined) data.transportadora = limpar(dados.transportadora)
    if (dados.linkRastreio !== undefined) data.linkRastreio = limpar(dados.linkRastreio)
    if (dados.custoFreteReal !== undefined) data.custoFreteReal = dados.custoFreteReal
  }

  // ── Transições de status: carimba datas + decide email ─────────────────────
  // Centralizado p/ valer TANTO nas ações (despachar/entregue) QUANTO na troca
  // de status manual via dropdown — antes só "despachar" carimbava/enviava, e
  // mudar status pelo dropdown deixava enviadoEm/entregueEm null e sem email.
  const statusAntes  = pedido.status
  const statusDepois = (data.status as string | undefined) ?? statusAntes
  let dispararEmail = false

  // Entrou em "enviado" (anterior != enviado): carimba enviadoEm 1x e dispara
  // o email de despacho 1x. Edição posterior sem trocar status NÃO reentra aqui
  // (statusDepois == statusAntes), então não reenvia.
  if (statusDepois === 'enviado' && statusAntes !== 'enviado' && !pedido.enviadoEm) {
    data.enviadoEm = new Date()
    const codigoEmail = (data.codigoRastreio as string | undefined) ?? pedido.codigoRastreio
    dispararEmail = !!codigoEmail // só envia se houver rastreio
  }

  // Entrou em "entregue" (anterior != entregue): carimba entregueEm 1x.
  if (statusDepois === 'entregue' && statusAntes !== 'entregue' && !pedido.entregueEm) {
    data.entregueEm = new Date()
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const atualizado = await prisma.pedido.update({ where: { id }, data })

  // ── Ciclo do cashback conforme a transição de status ───────────────────────
  // Entrega → libera o cashback pendente (vira disponível). Idempotente.
  if (statusDepois === 'entregue' && statusAntes !== 'entregue') {
    await liberarCashbackPedido(id).catch((e) =>
      console.error('[admin/pedidos] liberar cashback:', (e as Error).message),
    )
  }
  // Cancelamento → clawback do cashback + recálculo de nível. Roda DEPOIS do
  // update (status já 'cancelado'), p/ o recálculo de totalGasto excluir o pedido.
  if (statusDepois === 'cancelado' && statusAntes !== 'cancelado') {
    await estornarCashbackPedido(id).catch((e) =>
      console.error('[admin/pedidos] clawback cashback:', (e as Error).message),
    )
  }

  // Email de despacho — try/catch, nunca bloqueia o salvamento. NÃO inclui
  // custoFreteReal/margem (dados internos): só rastreio, transportadora e prazo.
  let emailEnviado = false
  if (dispararEmail && pedido.cliente?.email) {
    const codigoEmail = (data.codigoRastreio as string | undefined) ?? pedido.codigoRastreio ?? ''
    const transpEmail = (data.transportadora as string | null | undefined) ?? pedido.transportadora
    const linkEmail   = (data.linkRastreio as string | null | undefined) ?? pedido.linkRastreio
    try {
      await enviarEmailRastreio(pedido.cliente.email, {
        nomeCliente:    pedido.cliente.nome,
        pedidoId:       id,
        codigoRastreio: String(codigoEmail),
        transportadora: transpEmail ?? undefined,
        linkRastreio:   linkEmail ?? undefined,
        prazoEstimado:  pedido.fretePrazo ? `cerca de ${pedido.fretePrazo} dias úteis` : undefined,
      })
      emailEnviado = true
    } catch (e) {
      console.error('[admin/pedidos] email de despacho falhou:', (e as Error).message)
    }
  }

  await auditLog({
    req: request,
    action: dados.acao ? `pedido.${dados.acao}` : 'pedido.update',
    target: id,
    metadata: {
      antes: { status: pedido.status, codigoRastreio: pedido.codigoRastreio },
      depois: { status: atualizado.status, codigoRastreio: atualizado.codigoRastreio },
      emailEnviado,
    },
  })

  return NextResponse.json({ pedido: atualizado, emailEnviado })
}
