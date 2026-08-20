import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { isClienteBloqueado, MSG_CONTA_BLOQUEADA } from '@/lib/cliente-bloqueio'
import { paymentsClientDeps } from '@/lib/mercadopago-payments-deps'
import { processarTentativa } from '@/lib/checkout-multi-metodo-orquestrador'

// STATUS (ver checkout-multi-metodo.ts): reconstruído sobre a Payments API
// clássica em 2026-08-20 depois de confirmar em produção que a Orders API
// está bloqueada pra conta da Sixxis (403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES,
// sem previsão de desbloqueio).
//
// Só chamável quando o Pix da etapa 1 já foi confirmado pelo webhook
// (Pedido.multiMetodoStatus === 'aguardando_pagamento_restante') — o cliente
// só chega aqui DEPOIS de avisado, então o token do cartão é sempre
// submetido fresco nesta chamada (nunca guardado entre as 2 etapas).

const schema = z.object({
  pedidoId: z.string().min(1),
  cardToken: z.string().min(1),
  bandeiraId: z.string().min(1),
  parcelas: z.number().int().positive(),
  deviceId: z.string().optional(),
})

type ProximaAcaoPixMaisCartao = {
  payerEmail: string
  valorPixCentavos: number
  cartaoRestante?: unknown
  deviceId?: string
}

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
  const { pedidoId, cardToken, bandeiraId, parcelas, deviceId } = parsed.data

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, clienteId: session.user.id },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (pedido.multiMetodoStatus !== 'aguardando_pagamento_restante') {
    return NextResponse.json(
      { error: 'Pedido não está aguardando o pagamento do restante (Pix ainda não confirmado?)' },
      { status: 400 },
    )
  }

  const tentativa = await prisma.tentativaMultiMetodo.findFirst({
    where: { pedidoId: pedido.id, tipo: 'pix_mais_cartao', status: 'aguardando_pagamento_restante' },
    orderBy: { createdAt: 'desc' },
    include: { pagamentos: { where: { perna: 'pix' } } },
  })
  if (!tentativa) {
    return NextResponse.json({ error: 'Tentativa de pix + cartão não encontrada' }, { status: 500 })
  }
  const pagamentoPix = tentativa.pagamentos[0]
  if (!pagamentoPix) {
    return NextResponse.json({ error: 'Pagamento Pix desta tentativa não encontrado' }, { status: 500 })
  }

  const totalCentavos = tentativa.totalCentavos
  const valorRestanteCentavos = totalCentavos - pagamentoPix.valor
  if (valorRestanteCentavos <= 0) {
    return NextResponse.json({ error: 'Nada a cobrar — valor restante inválido' }, { status: 400 })
  }

  const proximaAcaoAtual = tentativa.proximaAcao as ProximaAcaoPixMaisCartao
  await prisma.tentativaMultiMetodo.update({
    where: { id: tentativa.id },
    data: {
      proximaAcao: {
        ...proximaAcaoAtual,
        cartaoRestante: { token: cardToken, bandeiraId, parcelas, valorCentavos: valorRestanteCentavos },
        deviceId: deviceId ?? proximaAcaoAtual.deviceId,
      },
    },
  })

  await processarTentativa(paymentsClientDeps, tentativa.id)

  const final = await prisma.tentativaMultiMetodo.findUniqueOrThrow({ where: { id: tentativa.id } })

  await auditLog({
    req,
    actor: session.user.id,
    action: `checkout.multi_metodo.pix_mais_cartao.completar.${final.status}`,
    target: pedido.id,
    metadata: { tentativaId: tentativa.id, erro: final.erro },
  })

  if (final.status === 'pago') {
    return NextResponse.json({ ok: true, status: 'pago' })
  }
  if (final.status === 'falhou' || final.status === 'cancelado') {
    return NextResponse.json(
      { error: 'Pagamento do restante não aprovado', erro: final.erro, status: final.status },
      { status: 402 },
    )
  }
  return NextResponse.json({ ok: true, status: final.status }, { status: 202 })
}
