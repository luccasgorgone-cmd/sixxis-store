import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { isStatusPendente } from '@/lib/pedido-status'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { isClienteBloqueado, MSG_CONTA_BLOQUEADA } from '@/lib/cliente-bloqueio'
import { calcularTotalBaseReais } from '@/lib/checkout-total'
import { paymentsClientDeps } from '@/lib/mercadopago-payments-deps'
import { processarTentativa } from '@/lib/checkout-multi-metodo-orquestrador'

// STATUS (ver checkout-multi-metodo.ts): reconstruído sobre a Payments API
// clássica em 2026-08-20 depois de confirmar em produção que a Orders API
// está bloqueada pra conta da Sixxis (403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES,
// sem previsão de desbloqueio). O pix desta etapa 1 é um pagamento Pix
// CLÁSSICO (mesmo tipo já usado no checkout de 1 método) — o webhook que já
// existe pra ele funciona sem nenhuma suposição nova.

const schema = z.object({
  pedidoId: z.string().min(1),
  payerEmail: z.string().email().optional(),
  valorPixCentavos: z.number().int().positive(),
  deviceId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (await isClienteBloqueado(session.user.id)) {
    return NextResponse.json({ error: MSG_CONTA_BLOQUEADA, bloqueado: true }, { status: 403 })
  }

  const rl = await rateLimit('checkout-multi-metodo', session.user.id ?? getClientIp(req))
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { pedidoId, payerEmail, valorPixCentavos, deviceId } = parsed.data

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, clienteId: session.user.id },
    include: {
      itens: { select: { precoUnitario: true, quantidade: true } },
      cliente: { select: { email: true } },
      garantias: { select: { valorPago: true } },
    },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (!isStatusPendente(pedido.status)) {
    return NextResponse.json({ error: 'Pedido em status inválido' }, { status: 400 })
  }

  const totalCentavos = Math.round(calcularTotalBaseReais(pedido) * 100)
  if (valorPixCentavos <= 0 || valorPixCentavos >= totalCentavos) {
    return NextResponse.json(
      { error: 'valorPixCentavos precisa ser maior que 0 e menor que o total do pedido' },
      { status: 400 },
    )
  }

  const tentativa = await prisma.tentativaMultiMetodo.create({
    data: {
      pedidoId: pedido.id,
      tipo: 'pix_mais_cartao',
      totalCentavos,
      proximaAcao: {
        payerEmail: payerEmail ?? pedido.cliente.email,
        valorPixCentavos,
        deviceId,
      },
    },
  })

  await processarTentativa(paymentsClientDeps, tentativa.id)

  const final = await prisma.tentativaMultiMetodo.findUniqueOrThrow({
    where: { id: tentativa.id },
    include: { pagamentos: { where: { perna: 'pix' } } },
  })
  const pernaPix = final.pagamentos[0]

  if (!pernaPix) {
    await auditLog({
      req,
      actor: session.user.id,
      action: 'checkout.multi_metodo.pix_mais_cartao.iniciar.falhou',
      target: pedido.id,
      metadata: { erro: final.erro, tentativaId: tentativa.id },
    })
    return NextResponse.json({ error: 'Não foi possível iniciar o Pix', erro: final.erro }, { status: 502 })
  }

  await auditLog({
    req,
    actor: session.user.id,
    action: 'checkout.multi_metodo.pix_mais_cartao.iniciado',
    target: pedido.id,
    metadata: { tentativaId: tentativa.id, valorPixCentavos },
  })

  return NextResponse.json({
    ok: true,
    tentativaId: tentativa.id,
    status: final.status,
    qrCodeBase64: pernaPix.qrCodeBase64,
    qrCodeCopiaECola: pernaPix.qrCodeCopiaECola,
    valorRestanteCentavos: totalCentavos - valorPixCentavos,
  })
}
