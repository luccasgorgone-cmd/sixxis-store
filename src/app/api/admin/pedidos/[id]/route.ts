import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { enviarEmailRastreio } from '@/lib/email'
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
      linkRastreio: true, custoFreteReal: true, enviadoEm: true, fretePrazo: true,
      cliente: { select: { nome: true, email: true } },
    },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  let dispararEmail = false

  // ── Despacho: insere rastreio, migra pra "enviado", dispara email ──────────
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
    // Só seta enviadoEm na 1ª vez; e só manda email se ainda não havia sido enviado.
    const jaEnviado = pedido.status === 'enviado' || pedido.status === 'entregue' || !!pedido.enviadoEm
    if (!pedido.enviadoEm) data.enviadoEm = new Date()
    dispararEmail = !jaEnviado
  }
  // ── Marcar como entregue ──────────────────────────────────────────────────
  else if (dados.acao === 'entregue') {
    data.status = 'entregue'
    data.entregueEm = new Date()
  }
  // ── Edição genérica (correção) — sem troca de status, sem email ────────────
  else {
    if (dados.status !== undefined) data.status = dados.status
    if (dados.codigoRastreio !== undefined) data.codigoRastreio = limpar(dados.codigoRastreio)
    if (dados.transportadora !== undefined) data.transportadora = limpar(dados.transportadora)
    if (dados.linkRastreio !== undefined) data.linkRastreio = limpar(dados.linkRastreio)
    if (dados.custoFreteReal !== undefined) data.custoFreteReal = dados.custoFreteReal
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const atualizado = await prisma.pedido.update({ where: { id }, data })

  // Email de despacho — try/catch, nunca bloqueia o salvamento.
  let emailEnviado = false
  if (dispararEmail && pedido.cliente?.email) {
    try {
      await enviarEmailRastreio(pedido.cliente.email, {
        nomeCliente:    pedido.cliente.nome,
        pedidoId:       id,
        codigoRastreio: String(data.codigoRastreio),
        transportadora: (data.transportadora as string | null) ?? undefined,
        linkRastreio:   (data.linkRastreio as string | null) ?? undefined,
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
