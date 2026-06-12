import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { mpPayment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isStatusPendente } from '@/lib/pedido-status'
import { creditarCashback } from '@/lib/cashback'
import { registrarUsoCupom } from '@/lib/cupom'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { isClienteBloqueado, MSG_CONTA_BLOQUEADA } from '@/lib/cliente-bloqueio'

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

  // Gate autoritativo: cliente bloqueado não gera pagamento.
  if (await isClienteBloqueado(session.user.id)) {
    return NextResponse.json({ error: MSG_CONTA_BLOQUEADA, bloqueado: true }, { status: 403 })
  }

  // Rate-limit por cliente (degrada graciosamente sem Upstash configurado).
  const rl = await rateLimit('criar-pagamento', session.user.id ?? getClientIp(req))
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
    include: {
      // produto.nome + endereco são usados pelo e-mail de confirmação enviado no
      // caminho do cartão aprovado inline (ver bloco 'approved' abaixo). sku/
      // descricao/categoria enriquecem o additional_info.items do Mercado Pago.
      itens: {
        include: {
          produto: { select: { nome: true, sku: true, descricao: true, categoria: true } },
        },
      },
      cliente: true,
      endereco: true,
    },
  })

  if (!pedido) {
    return NextResponse.json(
      { error: 'Pedido não encontrado' },
      { status: 404 },
    )
  }
  if (!isStatusPendente(pedido.status)) {
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

  // Telefone -> { area_code (DDD), number }. Tolera "(11) 98765-4321", "+55 11…", etc.
  const telDigits = (pedido.cliente.telefone ?? '').replace(/\D/g, '')
  const telLocal = telDigits.length > 11 && telDigits.startsWith('55')
    ? telDigits.slice(2)
    : telDigits
  const phone =
    telLocal.length >= 10
      ? { area_code: telLocal.slice(0, 2), number: telLocal.slice(2) }
      : undefined

  // Endereço do pedido -> payer.address (e additional_info abaixo).
  const end = pedido.endereco
  const zipCode = (end?.cep ?? '').replace(/\D/g, '')
  const address =
    end && (end.logradouro || zipCode)
      ? {
          zip_code: zipCode || undefined,
          street_name: end.logradouro || undefined,
          street_number: end.numero || undefined,
        }
      : undefined

  const basePayer: Record<string, unknown> = {
    email: emailPayer,
    first_name: firstName || 'Cliente',
    last_name: lastName,
  }
  if (cpfDigits && cpfDigits.length === 11) {
    basePayer.identification = { type: 'CPF', number: cpfDigits }
  }
  if (phone) basePayer.phone = phone
  if (address) basePayer.address = address

  // Itens do carrinho -> additional_info.items (lido pelo antifraude do MP).
  // category_id deve ser uma categoria do MP; a loja vende climatização/eletro.
  const MP_CATEGORY = 'home_appliances'
  const itemsMP = pedido.itens.map((i) => ({
    id: i.produto.sku || i.produtoId,
    title: i.variacaoNome ? `${i.produto.nome} — ${i.variacaoNome}` : i.produto.nome,
    description: (i.produto.descricao || i.produto.nome).replace(/\s+/g, ' ').trim().slice(0, 256),
    category_id: MP_CATEGORY,
    quantity: i.quantidade,
    unit_price: Number(i.precoUnitario),
    currency_id: 'BRL',
  }))

  // additional_info: items + espelho do payer + endereço de entrega. Tudo isso
  // alimenta a Qualidade da Integração e o score de aprovação.
  const additionalInfo: Record<string, unknown> = { items: itemsMP }
  const aiPayer: Record<string, unknown> = {
    first_name: firstName || 'Cliente',
    last_name: lastName,
  }
  if (phone) aiPayer.phone = phone
  if (address) aiPayer.address = address
  additionalInfo.payer = aiPayer
  if (end) {
    additionalInfo.shipments = {
      receiver_address: {
        zip_code: zipCode || undefined,
        street_name: end.logradouro || undefined,
        street_number: end.numero || undefined,
        city_name: end.cidade || undefined,
        state_name: end.estado || undefined,
      },
    }
  }

  const basePayload = {
    transaction_amount: valorBRL,
    description: `Pedido #${pedido.id.slice(0, 8).toUpperCase()}`,
    payer: basePayer,
    additional_info: additionalInfo,
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
      // Cartão aprovado SÍNCRONO: o webhook veria status já 'pago' e pularia o
      // crédito. Credita aqui (pendente, % do nível, sobre o subtotal de
      // produtos). Idempotente: se o webhook também rodar, não credita 2x.
      try {
        const subtotalProdutos = pedido.itens.reduce(
          (s, i) => s + Number(i.precoUnitario) * i.quantidade,
          0,
        )
        await creditarCashback(pedido.clienteId, subtotalProdutos, pedido.id)
      } catch (e) {
        console.error('[mp:create] cashback:', (e as Error).message)
      }
      // Registra uso do cupom (idempotente). Mesma lacuna do cashback: cartão
      // aprovado inline marca 'pago' antes do webhook, que então pularia.
      await registrarUsoCupom(pedido.id).catch((e) =>
        console.error('[mp:create] registrar uso cupom:', (e as Error).message),
      )
      // E-mail de confirmação. Mesma lacuna: o webhook do MP só envia quando
      // status !== 'pago'; como já marcamos 'pago' aqui, o webhook pularia e o
      // cliente de CARTÃO aprovado inline ficaria sem confirmação. Enviamos aqui
      // (try/catch, nunca bloqueia). Não duplica com o webhook por causa do guard.
      try {
        const end = pedido.endereco
        await enviarEmailConfirmacaoPedido(pedido.cliente.email, {
          nomeCliente: pedido.cliente.nome,
          pedidoId: pedido.id,
          itens: pedido.itens.map((i) => ({
            nome: i.produto.nome,
            variacaoNome: i.variacaoNome,
            quantidade: i.quantidade,
            precoUnitario: Number(i.precoUnitario),
          })),
          frete: Number(pedido.frete),
          desconto: Number(pedido.desconto),
          total: Number(pedido.total),
          formaPagamento: pedido.formaPagamento,
          endereco: `${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}`,
        })
      } catch (e) {
        console.error('[mp:create] email confirmacao:', (e as Error).message)
      }
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
