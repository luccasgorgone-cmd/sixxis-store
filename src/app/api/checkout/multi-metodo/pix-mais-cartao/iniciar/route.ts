import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { isStatusPendente } from '@/lib/pedido-status'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { isClienteBloqueado, MSG_CONTA_BLOQUEADA } from '@/lib/cliente-bloqueio'
import { calcularTotalBaseReais } from '@/lib/checkout-total'
import { ordersClientDeps } from '@/lib/checkout-multi-metodo-deps'
import { iniciarCheckoutPixMaisCartao } from '@/lib/checkout-multi-metodo'

// TODO-SANDBOX (ver checkout-multi-metodo.ts): fluxo nunca exercitado contra
// o MP real. Além disso, esta etapa 1 assume que a transação Pix criada
// dentro de uma Order dispara o MESMO webhook topic=payment (por
// mpPaymentId) que um pagamento Pix clássico — não confirmado. Ver o branch
// novo em webhooks/mercado-pago/route.ts.

const schema = z.object({
  pedidoId: z.string().min(1),
  payerEmail: z.string().email().optional(),
  valorPixCentavos: z.number().int().positive(),
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
  const { pedidoId, payerEmail, valorPixCentavos } = parsed.data

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

  const resultado = await iniciarCheckoutPixMaisCartao(ordersClientDeps, {
    externalReference: pedido.id,
    payerEmail: payerEmail ?? pedido.cliente.email,
    valorPixCentavos,
  })

  if (resultado.status !== 'aguardando_pix' || !resultado.orderId) {
    await auditLog({
      req,
      actor: session.user.id,
      action: 'checkout.multi_metodo.pix_mais_cartao.iniciar.falhou',
      target: pedido.id,
      metadata: { erro: resultado.erro },
    })
    return NextResponse.json({ error: 'Não foi possível iniciar o Pix', erro: resultado.erro }, { status: 502 })
  }

  const qrCode = resultado.qrCode as
    | { id?: string; status?: string; date_of_expiration?: string; payment_method?: { qr_code?: string; qr_code_base64?: string } }
    | undefined

  await prisma.$transaction([
    prisma.pedido.update({
      where: { id: pedido.id },
      data: { mpOrderId: resultado.orderId, multiMetodoStatus: 'aguardando_pix' },
    }),
    prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        mpPaymentId: qrCode?.id ? String(qrCode.id) : null,
        mpStatus: qrCode?.status ?? 'pending',
        metodo: 'pix',
        valor: valorPixCentavos,
        qrCodeBase64: qrCode?.payment_method?.qr_code_base64 ?? null,
        qrCodeCopiaECola: qrCode?.payment_method?.qr_code ?? null,
        pixExpiraEm: qrCode?.date_of_expiration ? new Date(qrCode.date_of_expiration) : null,
        payerEmail: payerEmail ?? pedido.cliente.email,
        rawResponse: qrCode ? (JSON.parse(JSON.stringify(qrCode)) as Prisma.InputJsonValue) : undefined,
      },
    }),
  ])

  await auditLog({
    req,
    actor: session.user.id,
    action: 'checkout.multi_metodo.pix_mais_cartao.iniciado',
    target: pedido.id,
    metadata: { orderId: resultado.orderId, valorPixCentavos },
  })

  return NextResponse.json({
    ok: true,
    orderId: resultado.orderId,
    status: 'aguardando_pix',
    qrCodeBase64: qrCode?.payment_method?.qr_code_base64 ?? null,
    qrCodeCopiaECola: qrCode?.payment_method?.qr_code ?? null,
    valorRestanteCentavos: totalCentavos - valorPixCentavos,
  })
}
