import { NextRequest, NextResponse } from 'next/server'
import { mpPayment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { enviarPurchaseCapi } from '@/lib/analytics/meta-capi'
import { enviarPurchaseGa4 } from '@/lib/analytics/ga4-measurement-protocol'
import { gIdItemPedido as gIdItem } from '@/lib/feed-id'

const ESTADOS_FINAIS = ['approved', 'rejected', 'cancelled', 'refunded', 'charged_back']
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sixxis.com.br'

// ── CAPI/GA4 Purchase — espelha o bloco do webhook (mesma idempotência por
// capiPurchaseEnviadoEm/ga4PurchaseEnviadoEm). Esta rota é o ÚNICO outro lugar
// (fora do webhook) que marca um Pedido como 'pago' — o PixPainel faz polling
// aqui a cada 4s enquanto o cliente espera a confirmação do Pix. Sem isto, se o
// webhook do MP nunca chegar pra aquele pagamento (perda de entrega, raro mas
// real), o pedido fica pago mas a conversão nunca é reportada a Meta/GA4 — não
// existe outro gatilho que tente de novo depois.
async function dispararConversoesPurchase(pedidoId: string, valorCentavos: number): Promise<void> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: { select: { email: true, telefone: true, nome: true } },
      endereco: true,
      itens: {
        include: {
          produto: {
            select: { sku: true, slug: true, variacoes: { select: { id: true, sku: true, preco: true } } },
          },
        },
      },
    },
  })
  if (!pedido) return
  const valor = valorCentavos / 100

  try {
    const claimCapi = await prisma.pedido.updateMany({
      where: { id: pedido.id, capiPurchaseEnviadoEm: null },
      data: { capiPurchaseEnviadoEm: new Date() },
    })
    if (claimCapi.count === 1) {
      const resultado = await enviarPurchaseCapi({
        eventId: pedido.id,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: `${SITE_URL}/pedido/${pedido.id}/sucesso`,
        userData: {
          email: pedido.cliente.email,
          telefone: pedido.cliente.telefone,
          nome: pedido.cliente.nome,
          cidade: pedido.endereco.cidade,
          estado: pedido.endereco.estado,
          cep: pedido.endereco.cep,
          country: 'br',
          externalId: pedido.clienteId,
        },
        fbp: pedido.fbp,
        fbc: pedido.fbc,
        clientIp: pedido.clientIp,
        clientUserAgent: pedido.clientUserAgent,
        value: valor,
        currency: 'BRL',
        contentIds: pedido.itens.map((i) => gIdItem(i)),
        contents: pedido.itens.map((i) => ({ id: gIdItem(i), quantity: i.quantidade, item_price: Number(i.precoUnitario) })),
        numItems: pedido.itens.reduce((s, i) => s + i.quantidade, 0),
      })
      if (!resultado.ok) {
        await prisma.pedido.update({ where: { id: pedido.id }, data: { capiPurchaseEnviadoEm: null } }).catch(() => {})
        console.error('[mp:status] CAPI Purchase falhou:', resultado.error)
      }
    }
  } catch (e) {
    console.error('[mp:status] CAPI Purchase:', (e as Error).message)
  }

  try {
    const claimGa4 = await prisma.pedido.updateMany({
      where: { id: pedido.id, ga4PurchaseEnviadoEm: null },
      data: { ga4PurchaseEnviadoEm: new Date() },
    })
    if (claimGa4.count === 1) {
      const resultadoGa4 = await enviarPurchaseGa4({
        clientId: pedido.gaClientId,
        sessionId: pedido.gaSessionId,
        transactionId: pedido.id,
        value: valor,
        currency: 'BRL',
        items: pedido.itens.map((i) => ({ item_id: gIdItem(i), price: Number(i.precoUnitario), quantity: i.quantidade })),
        shipping: Number(pedido.frete),
        coupon: pedido.cupomCodigo ?? undefined,
      })
      if (!resultadoGa4.ok && !resultadoGa4.skipped) {
        await prisma.pedido.update({ where: { id: pedido.id }, data: { ga4PurchaseEnviadoEm: null } }).catch(() => {})
        console.error('[mp:status] GA4 Purchase falhou:', resultadoGa4.error)
      }
    }
  } catch (e) {
    console.error('[mp:status] GA4 Purchase:', (e as Error).message)
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { pagamentoId } = await params

  const pagamento = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
    include: { pedido: { select: { id: true, status: true, clienteId: true } } },
  })

  if (!pagamento) {
    return NextResponse.json(
      { error: 'Pagamento não encontrado' },
      { status: 404 },
    )
  }
  if (pagamento.pedido.clienteId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  if (ESTADOS_FINAIS.includes(pagamento.mpStatus)) {
    return NextResponse.json({
      status: pagamento.mpStatus,
      pedidoStatus: pagamento.pedido.status,
    })
  }

  if (mpPayment && pagamento.mpPaymentId) {
    try {
      const mpResp = await mpPayment.get({ id: pagamento.mpPaymentId })
      const novoStatus = mpResp.status ?? pagamento.mpStatus

      if (novoStatus !== pagamento.mpStatus) {
        await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: {
            mpStatus: novoStatus,
            mpStatusDetail: mpResp.status_detail ?? null,
            aprovadoEm: novoStatus === 'approved' ? new Date() : pagamento.aprovadoEm,
            rejeitadoEm: novoStatus === 'rejected' ? new Date() : pagamento.rejeitadoEm,
          },
        })

        if (novoStatus === 'approved' && pagamento.pedido.status !== 'pago') {
          await prisma.pedido.update({
            where: { id: pagamento.pedidoId },
            data: { status: 'pago', pagoEm: new Date() },
          })
        }
      }

      if (novoStatus === 'approved') {
        await dispararConversoesPurchase(pagamento.pedidoId, pagamento.valor)
      }

      return NextResponse.json({
        status: novoStatus,
        pedidoStatus:
          novoStatus === 'approved' ? 'pago' : pagamento.pedido.status,
      })
    } catch (e) {
      const err = e as { message?: string }
      console.error('[mp:status]', err.message)
    }
  }

  return NextResponse.json({
    status: pagamento.mpStatus,
    pedidoStatus: pagamento.pedido.status,
  })
}
