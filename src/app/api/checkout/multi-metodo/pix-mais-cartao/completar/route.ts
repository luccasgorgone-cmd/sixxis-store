import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { creditarCashback } from '@/lib/cashback'
import { registrarUsoCupom } from '@/lib/cupom'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { isClienteBloqueado, MSG_CONTA_BLOQUEADA } from '@/lib/cliente-bloqueio'
import { calcularTotalBaseReais } from '@/lib/checkout-total'
import { ordersClientDeps } from '@/lib/checkout-multi-metodo-deps'
import { completarCheckoutPixMaisCartao } from '@/lib/checkout-multi-metodo'
import { buscarOrder } from '@/lib/mercadopago-orders'

// STATUS (ver checkout-multi-metodo.ts): testado em produção em 2026-08-20 —
// a Orders API está bloqueada pra conta da Sixxis (403
// PA_UNAUTHORIZED_RESULT_FROM_POLICIES), então esta rota não funciona ainda.
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
  const { pedidoId, cardToken, bandeiraId, parcelas } = parsed.data

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, clienteId: session.user.id },
    include: {
      itens: { include: { produto: { select: { nome: true } } } },
      cliente: true,
      endereco: true,
      garantias: { select: { valorPago: true } },
      pagamentos: { where: { metodo: 'pix' }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (pedido.multiMetodoStatus !== 'aguardando_pagamento_restante' || !pedido.mpOrderId) {
    return NextResponse.json(
      { error: 'Pedido não está aguardando o pagamento do restante (Pix ainda não confirmado?)' },
      { status: 400 },
    )
  }
  const pagamentoPix = pedido.pagamentos[0]
  if (!pagamentoPix) {
    return NextResponse.json({ error: 'Pagamento Pix desta order não encontrado' }, { status: 500 })
  }

  const totalCentavos = Math.round(calcularTotalBaseReais(pedido) * 100)
  const valorRestanteCentavos = totalCentavos - pagamentoPix.valor
  if (valorRestanteCentavos <= 0) {
    return NextResponse.json({ error: 'Nada a cobrar — valor restante inválido' }, { status: 400 })
  }

  const resultado = await completarCheckoutPixMaisCartao(ordersClientDeps, {
    orderId: pedido.mpOrderId,
    valorRestanteCentavos,
    cartao: { token: cardToken, bandeiraId, parcelas, valorCentavos: valorRestanteCentavos },
  })

  if (resultado.status !== 'pago') {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { multiMetodoStatus: resultado.status },
    })
    await auditLog({
      req,
      actor: session.user.id,
      action: 'checkout.multi_metodo.pix_mais_cartao.completar.falhou',
      target: pedido.id,
      metadata: { erro: resultado.erro, detalhe: resultado.detalhe },
    })
    return NextResponse.json(
      { error: 'Pagamento do restante não aprovado', erro: resultado.erro, detalhe: resultado.detalhe },
      { status: 402 },
    )
  }

  const orderDetalhe = await buscarOrder(pedido.mpOrderId).catch(() => null)
  const transacaoCartao = orderDetalhe?.transactions?.payments?.find(
    (t) => t.payment_method?.type === 'credit_card' || t.payment_method?.type === 'debit_card',
  )

  await prisma.$transaction([
    prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        status: 'pago',
        pagoEm: new Date(),
        total: calcularTotalBaseReais(pedido),
        multiMetodoStatus: null,
      },
    }),
    prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        mpPaymentId: transacaoCartao?.id ? String(transacaoCartao.id) : null,
        mpStatus: transacaoCartao?.status ?? 'processed',
        mpStatusDetail: transacaoCartao?.status_detail ?? null,
        metodo: 'credit_card',
        valor: valorRestanteCentavos,
        parcelas,
        bandeira: bandeiraId,
        payerEmail: pedido.cliente.email,
        rawResponse: transacaoCartao
          ? (JSON.parse(JSON.stringify(transacaoCartao)) as Prisma.InputJsonValue)
          : undefined,
        aprovadoEm: new Date(),
      },
    }),
  ])

  try {
    const subtotalItens = pedido.itens.reduce(
      (s, i) => s + Number(i.precoUnitario) * i.quantidade,
      0,
    )
    await creditarCashback(pedido.clienteId, subtotalItens, pedido.id)
  } catch (e) {
    console.error('[checkout:pix-mais-cartao:completar] cashback:', (e as Error).message)
  }
  await registrarUsoCupom(pedido.id).catch((e) =>
    console.error('[checkout:pix-mais-cartao:completar] registrar uso cupom:', (e as Error).message),
  )
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
      total: calcularTotalBaseReais(pedido),
      formaPagamento: pedido.formaPagamento,
      endereco: `${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}`,
    })
  } catch (e) {
    console.error('[checkout:pix-mais-cartao:completar] email confirmacao:', (e as Error).message)
  }

  await auditLog({
    req,
    actor: session.user.id,
    action: 'checkout.multi_metodo.pix_mais_cartao.pago',
    target: pedido.id,
    metadata: { orderId: pedido.mpOrderId },
  })

  return NextResponse.json({ ok: true, status: 'pago' })
}
