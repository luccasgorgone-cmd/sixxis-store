import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { mpPayment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const schema = z.object({
  pedidoId: z.string().min(1),
  metodo: z.enum(['pix', 'credit_card', 'debit_card']),
  payerEmail: z.string().email().optional(),
  payerNome: z.string().optional(),
  payerCpf: z.string().optional(),
  cardToken: z.string().optional(),
  parcelas: z.number().int().positive().optional(),
  issuerId: z.string().optional(),
  paymentMethodId: z.string().optional(),
})

const APP_URL =
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://sixxis-store-production.up.railway.app'

export async function POST(req: NextRequest) {
  if (!mpPayment) {
    return NextResponse.json(
      { error: 'Mercado Pago não configurado' },
      { status: 500 },
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const {
    pedidoId,
    metodo,
    payerEmail,
    payerNome,
    payerCpf,
    cardToken,
    parcelas,
    issuerId,
    paymentMethodId,
  } = parsed.data

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, clienteId: session.user.id },
    include: { itens: true, cliente: true },
  })

  if (!pedido) {
    return NextResponse.json(
      { error: 'Pedido não encontrado' },
      { status: 404 },
    )
  }
  if (pedido.status !== 'pendente') {
    return NextResponse.json(
      { error: 'Pedido em status inválido' },
      { status: 400 },
    )
  }
  if ((metodo === 'credit_card' || metodo === 'debit_card') && !cardToken) {
    return NextResponse.json(
      { error: 'cardToken obrigatório para cartão' },
      { status: 400 },
    )
  }

  const valorBRL = Number(pedido.total)
  const valorCentavos = Math.round(valorBRL * 100)
  const idempotencyKey = `pedido-${pedido.id}-${randomUUID()}`
  const emailPayer = payerEmail ?? pedido.cliente.email
  const nomePayer = payerNome ?? pedido.cliente.nome ?? ''
  const [firstName, ...rest] = nomePayer.trim().split(/\s+/)
  const lastName = rest.join(' ') || firstName
  const cpfDigits = payerCpf?.replace(/\D/g, '')

  const basePayer: Record<string, unknown> = {
    email: emailPayer,
    first_name: firstName || 'Cliente',
    last_name: lastName,
  }
  if (cpfDigits && cpfDigits.length === 11) {
    basePayer.identification = { type: 'CPF', number: cpfDigits }
  }

  const basePayload = {
    transaction_amount: valorBRL,
    description: `Pedido #${pedido.id.slice(0, 8).toUpperCase()}`,
    payer: basePayer,
    external_reference: pedido.id,
    notification_url: `${APP_URL}/api/webhooks/mercado-pago`,
    metadata: {
      pedido_id: pedido.id,
      loja: 'sixxis-store',
    },
  }

  try {
    let mpResp: Awaited<ReturnType<typeof mpPayment.create>>

    if (metodo === 'pix') {
      mpResp = await mpPayment.create({
        body: { ...basePayload, payment_method_id: 'pix' },
        requestOptions: { idempotencyKey },
      })
    } else {
      mpResp = await mpPayment.create({
        body: {
          ...basePayload,
          token: cardToken,
          installments: parcelas ?? 1,
          payment_method_id: paymentMethodId,
          issuer_id: issuerId ? Number(issuerId) : undefined,
          capture: true,
        },
        requestOptions: { idempotencyKey },
      })
    }

    const txData = mpResp.point_of_interaction?.transaction_data
    const expiraStr = (mpResp as { date_of_expiration?: string }).date_of_expiration

    const pagamento = await prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        mpPaymentId: mpResp.id ? String(mpResp.id) : null,
        mpStatus: mpResp.status ?? 'pending',
        mpStatusDetail: mpResp.status_detail ?? null,
        metodo,
        valor: valorCentavos,
        qrCodeBase64: txData?.qr_code_base64 ?? null,
        qrCodeCopiaECola: txData?.qr_code ?? null,
        pixExpiraEm: expiraStr ? new Date(expiraStr) : null,
        parcelas: parcelas ?? null,
        bandeira: mpResp.payment_method_id ?? null,
        ultimosDigitos: mpResp.card?.last_four_digits ?? null,
        payerEmail: emailPayer,
        payerCpf: cpfDigits ?? null,
        payerNome: nomePayer || null,
        rawResponse: JSON.parse(JSON.stringify(mpResp)) as Prisma.InputJsonValue,
        aprovadoEm: mpResp.status === 'approved' ? new Date() : null,
        rejeitadoEm: mpResp.status === 'rejected' ? new Date() : null,
      },
    })

    if (mpResp.status === 'approved') {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          status: 'pago',
          pagoEm: new Date(),
          mpPaymentId: pagamento.mpPaymentId,
        },
      })
    } else if (pagamento.mpPaymentId) {
      // mantém referência principal pra reconciliação via webhook
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { mpPaymentId: pagamento.mpPaymentId },
      })
    }

    return NextResponse.json({
      ok: true,
      pagamentoId: pagamento.id,
      mpPaymentId: pagamento.mpPaymentId,
      status: pagamento.mpStatus,
      qrCodeBase64: pagamento.qrCodeBase64,
      qrCodeCopiaECola: pagamento.qrCodeCopiaECola,
      pixExpiraEm: pagamento.pixExpiraEm,
    })
  } catch (e) {
    const err = e as { message?: string; cause?: unknown }
    console.error('[mp:create]', err.message, err.cause)
    return NextResponse.json(
      {
        error: 'Erro ao processar pagamento',
        detalhe: err.message?.substring(0, 200),
      },
      { status: 500 },
    )
  }
}
