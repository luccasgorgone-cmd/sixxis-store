import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { isStatusPendente } from '@/lib/pedido-status'
import { creditarCashback } from '@/lib/cashback'
import { registrarUsoCupom } from '@/lib/cupom'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { isClienteBloqueado, MSG_CONTA_BLOQUEADA } from '@/lib/cliente-bloqueio'
import { calcularTotalBaseReais } from '@/lib/checkout-total'
import { ordersClientDeps } from '@/lib/checkout-multi-metodo-deps'
import { executarCheckoutDoisCartoes } from '@/lib/checkout-multi-metodo'
import { buscarOrder } from '@/lib/mercadopago-orders'

// STATUS (ver checkout-multi-metodo.ts): testado em produção em 2026-08-20 —
// a Orders API está bloqueada pra conta da Sixxis (403
// PA_UNAUTHORIZED_RESULT_FROM_POLICIES), então esta rota não funciona ainda.
// Não é bug de código; precisa do Mercado Pago liberar a Orders API na conta.

const cartaoSchema = z.object({
  token: z.string().min(1),
  bandeiraId: z.string().min(1),
  parcelas: z.number().int().positive(),
  valorCentavos: z.number().int().positive(),
})

const schema = z.object({
  pedidoId: z.string().min(1),
  payerEmail: z.string().email().optional(),
  cartaoA: cartaoSchema,
  cartaoB: cartaoSchema,
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
  const { pedidoId, payerEmail, cartaoA, cartaoB } = parsed.data

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, clienteId: session.user.id },
    include: {
      itens: { include: { produto: { select: { nome: true } } } },
      cliente: true,
      endereco: true,
      garantias: { select: { valorPago: true } },
    },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (!isStatusPendente(pedido.status)) {
    return NextResponse.json({ error: 'Pedido em status inválido' }, { status: 400 })
  }

  const totalBaseReais = calcularTotalBaseReais(pedido)
  const totalCentavos = Math.round(totalBaseReais * 100)

  const resultado = await executarCheckoutDoisCartoes(ordersClientDeps, {
    externalReference: pedido.id,
    payerEmail: payerEmail ?? pedido.cliente.email,
    totalCentavos,
    cartaoA,
    cartaoB,
  })

  if (resultado.status !== 'pago') {
    // Fluxo não avançou (ou foi revertido) — pedido segue 'pendente', cliente
    // pode tentar de novo. Guarda o sub-estado pra visibilidade no admin.
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        multiMetodoStatus: resultado.status,
        mpOrderId: resultado.orderId ?? pedido.mpOrderId,
      },
    })
    await auditLog({
      req,
      actor: session.user.id,
      action: 'checkout.multi_metodo.dois_cartoes.falhou',
      target: pedido.id,
      metadata: { erro: resultado.erro, detalhe: resultado.detalhe, orderId: resultado.orderId },
    })
    return NextResponse.json(
      { error: 'Pagamento não aprovado', erro: resultado.erro, detalhe: resultado.detalhe },
      { status: 402 },
    )
  }

  // Aprovado. Busca o detalhe da order pra registrar os 2 Pagamento (auditoria/
  // admin) — completarCheckoutPixMaisCartao/executarCheckoutDoisCartoes só
  // devolvem o resultado agregado, não o detalhe por transação.
  const orderId = resultado.orderId!
  const orderDetalhe = await buscarOrder(orderId).catch(() => null)
  const transacoes = orderDetalhe?.transactions?.payments ?? []

  await prisma.$transaction([
    prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        status: 'pago',
        pagoEm: new Date(),
        total: totalBaseReais,
        mpOrderId: orderId,
        multiMetodoStatus: null,
      },
    }),
    ...transacoes.map((t) =>
      prisma.pagamento.create({
        data: {
          pedidoId: pedido.id,
          mpPaymentId: t.id ? String(t.id) : null,
          mpStatus: t.status ?? 'processed',
          mpStatusDetail: t.status_detail ?? null,
          metodo: 'credit_card',
          valor: Math.round(Number(t.amount ?? 0) * 100),
          parcelas: t.payment_method?.installments ?? null,
          bandeira: t.payment_method?.id ?? null,
          payerEmail: payerEmail ?? pedido.cliente.email,
          rawResponse: JSON.parse(JSON.stringify(t)) as Prisma.InputJsonValue,
          aprovadoEm: new Date(),
        },
      }),
    ),
  ])

  try {
    const subtotalItens = pedido.itens.reduce(
      (s, i) => s + Number(i.precoUnitario) * i.quantidade,
      0,
    )
    await creditarCashback(pedido.clienteId, subtotalItens, pedido.id)
  } catch (e) {
    console.error('[checkout:dois-cartoes] cashback:', (e as Error).message)
  }
  await registrarUsoCupom(pedido.id).catch((e) =>
    console.error('[checkout:dois-cartoes] registrar uso cupom:', (e as Error).message),
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
      total: totalBaseReais,
      formaPagamento: pedido.formaPagamento,
      endereco: `${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}`,
    })
  } catch (e) {
    console.error('[checkout:dois-cartoes] email confirmacao:', (e as Error).message)
  }

  await auditLog({
    req,
    actor: session.user.id,
    action: 'checkout.multi_metodo.dois_cartoes.pago',
    target: pedido.id,
    metadata: { orderId },
  })

  return NextResponse.json({ ok: true, orderId, status: 'pago' })
}
