import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { mpPayment, MP_WEBHOOK_SECRET } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'
import { calcularPontos, creditarPontos } from '@/lib/fidelidade'
import { creditarCashback, estornarCashbackPedido } from '@/lib/cashback'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'

function validarAssinatura(req: NextRequest): boolean {
  if (!MP_WEBHOOK_SECRET) return false

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''

  const parts: Record<string, string> = {}
  for (const seg of xSignature.split(',')) {
    const [k, v] = seg.trim().split('=')
    if (k && v) parts[k] = v
  }
  if (!parts.ts || !parts.v1) return false

  const url = new URL(req.url)
  const dataId = url.searchParams.get('data.id') ?? ''

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`
  const expected = crypto
    .createHmac('sha256', MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(parts.v1, 'utf8'),
      Buffer.from(expected, 'utf8'),
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Valida assinatura sempre que MERCADOPAGO_WEBHOOK_SECRET estiver definido.
  // Sem secret → loga warning e segue (apenas pra dev local; em prod o secret
  // DEVE estar setado no Railway).
  if (MP_WEBHOOK_SECRET) {
    if (!validarAssinatura(req)) {
      console.warn('[mp:webhook] assinatura inválida')
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  } else {
    console.warn(
      '[mp:webhook] MERCADOPAGO_WEBHOOK_SECRET ausente — validação de assinatura DESLIGADA. Configure o secret no Railway antes do go-live.',
    )
  }

  let payload: { type?: string; data?: { id?: string | number } } | null = null
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (!payload || payload.type !== 'payment' || !payload.data?.id) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const mpPaymentId = String(payload.data.id)

  try {
    if (!mpPayment) {
      throw new Error('Mercado Pago client não configurado')
    }

    const mpResp = await mpPayment.get({ id: mpPaymentId })

    const pagamento = await prisma.pagamento.findUnique({
      where: { mpPaymentId },
      include: {
        pedido: {
          include: {
            cliente: { select: { id: true, nome: true, email: true } },
            endereco: true,
            itens: {
              include: { produto: { select: { nome: true, slug: true } } },
            },
          },
        },
      },
    })

    if (!pagamento) {
      console.warn('[mp:webhook] pagamento não encontrado:', mpPaymentId)
      return NextResponse.json({ ok: true, notFound: true })
    }

    const novoStatus = mpResp.status ?? pagamento.mpStatus

    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        mpStatus: novoStatus,
        mpStatusDetail: mpResp.status_detail ?? null,
        aprovadoEm:
          novoStatus === 'approved' ? new Date() : pagamento.aprovadoEm,
        rejeitadoEm:
          novoStatus === 'rejected' ? new Date() : pagamento.rejeitadoEm,
        rawResponse: JSON.parse(JSON.stringify(mpResp)) as Prisma.InputJsonValue,
      },
    })

    const pedido = pagamento.pedido

    if (novoStatus === 'approved' && pedido.status !== 'pago') {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { status: 'pago', pagoEm: new Date() },
      })

      // Pontos de fidelidade
      try {
        const pontos = await calcularPontos(Number(pedido.total))
        if (pontos > 0) {
          await creditarPontos(
            pedido.clienteId,
            pontos,
            `Compra #${pedido.id.slice(-8).toUpperCase()}`,
            pedido.id,
          ).catch(() => {})
        }
      } catch (e) {
        console.error('[mp:webhook] pontos:', e)
      }

      // Cashback (% do nível) sobre o SUBTOTAL DE PRODUTOS (sem frete).
      // Entra como pendente; idempotente por pedido.
      try {
        const subtotalProdutos = pedido.itens.reduce(
          (s, i) => s + Number(i.precoUnitario) * i.quantidade,
          0,
        )
        await creditarCashback(pedido.clienteId, subtotalProdutos, pedido.id)
      } catch (e) {
        console.error('[mp:webhook] cashback:', e)
      }

      // Cupom: incrementar uso
      if (pedido.cupomCodigo) {
        await prisma.cupom
          .update({
            where: { codigo: pedido.cupomCodigo },
            data: { totalUsos: { increment: 1 } },
          })
          .catch(() => {})
      }

      // Email de confirmação
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
        console.error('[mp:webhook] email:', e)
      }

      await auditLog({
        req,
        actor: 'mercado-pago',
        action: 'pedido.pago',
        target: pedido.id,
        metadata: { mpPaymentId, valor: pagamento.valor },
      })
    }

    // Estorno/cancelamento. Se o pedido já estava pago e foi estornado
    // (refunded/charged_back) ou cancelado, marca 'cancelado' e faz clawback do
    // cashback. Se ainda não estava pago, volta a 'pendente' (comportamento antigo).
    const ESTORNO = ['refunded', 'charged_back']
    const negado = novoStatus === 'rejected' || novoStatus === 'cancelled'

    if (ESTORNO.includes(novoStatus) || (negado && pedido.status === 'pago')) {
      if (pedido.status !== 'cancelado') {
        await prisma.pedido.update({
          where: { id: pedido.id },
          data: { status: 'cancelado' },
        })
        // clawback DEPOIS de cancelar, p/ o recálculo de nível já excluir o pedido.
        await estornarCashbackPedido(pedido.id).catch((e) =>
          console.error('[mp:webhook] clawback cashback:', (e as Error).message),
        )
      }
    } else if (negado && pedido.status !== 'pago') {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { status: 'pendente' },
      })
    }

    await auditLog({
      req,
      actor: 'mercado-pago',
      action: 'pagamento.update',
      target: pagamento.id,
      metadata: {
        mpPaymentId,
        statusAntes: pagamento.mpStatus,
        statusDepois: novoStatus,
      },
    })

    return NextResponse.json({ ok: true, status: novoStatus })
  } catch (e) {
    const err = e as { message?: string }
    console.error('[mp:webhook]', err.message)
    return NextResponse.json(
      { error: 'webhook processing failed' },
      { status: 500 },
    )
  }
}
