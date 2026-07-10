import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { mpPayment, MP_WEBHOOK_SECRET, somarTaxaMp } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'
import { calcularPontos, creditarPontos } from '@/lib/fidelidade'
import { creditarCashback, estornarCashbackPedido } from '@/lib/cashback'
import { registrarUsoCupom } from '@/lib/cupom'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'
import { enviarPurchaseCapi } from '@/lib/analytics/meta-capi'
import { feedId } from '@/lib/feed-id'
import { isStatusPago, isStatusCancelado } from '@/lib/pedido-status'

// g:id do feed p/ um item de pedido (content_ids do CAPI). Resolve variação
// precificada → SKU da variação; senão item único (sku ?? slug do produto).
function gIdItem(i: {
  variacaoId: string | null
  produto: {
    sku: string | null
    slug: string
    variacoes: { id: string; sku: string; preco: unknown }[]
  }
}): string {
  const v = i.variacaoId ? i.produto.variacoes.find((x) => x.id === i.variacaoId) : null
  return feedId(
    { sku: i.produto.sku, slug: i.produto.slug },
    v ? { sku: v.sku, preco: v.preco as number | null } : null,
    i.produto.variacoes.map((x) => ({ sku: x.sku, preco: x.preco as number | null })),
  )
}

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
            cliente: { select: { id: true, nome: true, email: true, telefone: true } },
            endereco: true,
            itens: {
              include: {
                produto: {
                  select: {
                    nome: true, slug: true, sku: true,
                    // p/ o g:id (content_ids do CAPI) de itens por variação.
                    variacoes: { select: { id: true, sku: true, preco: true } },
                  },
                },
              },
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

      // Cupom: registra uso (cria CupomUso + incrementa totalUsos). Idempotente.
      await registrarUsoCupom(pedido.id).catch((e) =>
        console.error('[mp:webhook] registrar uso cupom:', (e as Error).message),
      )

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

    // ── Tarifa real do MP (margem de contribuição) ─────────────────────────────
    // Reusa o mpResp que ESTE webhook já buscou — nenhuma chamada de rede nova,
    // logo nenhum risco novo de timeout na confirmação da venda. Idempotente:
    // grava só quando ainda está null. A confirmação do pagamento NUNCA depende
    // disto — qualquer falha vira log [mp-taxa] e o pedido segue pago.
    if (novoStatus === 'approved') {
      try {
        const taxa = somarTaxaMp((mpResp as { fee_details?: unknown }).fee_details)
        if (taxa == null) {
          console.warn(`[mp-taxa] fee_details ausente no pagamento ${mpPaymentId} — taxa fica pendente`)
        } else {
          const r = await prisma.pedido.updateMany({
            where: { id: pedido.id, mpTaxaReal: null },
            data:  { mpTaxaReal: taxa },
          })
          if (r.count) console.info(`[mp-taxa] pedido ${pedido.id} taxa=R$${taxa.toFixed(2)}`)
        }
      } catch (e) {
        console.error('[mp-taxa]', (e as Error).message)
      }
    }

    // ── CAPI Purchase (server-side, Fase 2) ────────────────────────────────────
    // Espelha o Purchase do browser (event_id = pedido.id → a Meta deduplica).
    // Fica FORA do bloco "primeira aprovação" e tem guard próprio
    // (capiPurchaseEnviadoEm) para poder reenviar num webhook repetido se o 1º
    // envio falhou. NUNCA quebra o fluxo do pedido (try/catch + log).
    if (novoStatus === 'approved') {
      try {
        // Claim atômico: só 1 webhook ganha o lock (UPDATE ... WHERE col IS NULL).
        const claim = await prisma.pedido.updateMany({
          where: { id: pedido.id, capiPurchaseEnviadoEm: null },
          data: { capiPurchaseEnviadoEm: new Date() },
        })
        if (claim.count === 1) {
          const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sixxis.com.br'
          const resultado = await enviarPurchaseCapi({
            eventId: pedido.id,
            eventTime: Math.floor(Date.now() / 1000),
            eventSourceUrl: `${SITE_URL}/pedido/${pedido.id}/sucesso`,
            userData: {
              email:      pedido.cliente.email,
              telefone:   pedido.cliente.telefone,
              nome:       pedido.cliente.nome,
              cidade:     pedido.endereco.cidade,
              estado:     pedido.endereco.estado,
              cep:        pedido.endereco.cep,
              country:    'br',
              externalId: pedido.clienteId,
            },
            fbp: pedido.fbp,
            fbc: pedido.fbc,
            clientIp: pedido.clientIp,
            clientUserAgent: pedido.clientUserAgent,
            value: Number(pedido.total),
            currency: 'BRL',
            // content_ids/contents = g:id do feed (dedupe com o Purchase do
            // browser, que também manda o g:id). MESMA função do merchant-feed.
            contentIds: pedido.itens.map((i) => gIdItem(i)),
            contents: pedido.itens.map((i) => ({
              id: gIdItem(i),
              quantity: i.quantidade,
              item_price: Number(i.precoUnitario),
            })),
            numItems: pedido.itens.reduce((s, i) => s + i.quantidade, 0),
          })
          if (!resultado.ok) {
            // Libera o guard p/ retry num próximo webhook (a Meta dedupe por
            // event_id cobre eventual envio duplo).
            await prisma.pedido
              .update({ where: { id: pedido.id }, data: { capiPurchaseEnviadoEm: null } })
              .catch(() => {})
            console.error('[mp:webhook] CAPI Purchase falhou:', resultado.error)
          }
        }
      } catch (e) {
        console.error('[mp:webhook] CAPI Purchase:', (e as Error).message)
      }
    }

    // ── Estorno / cancelamento ─────────────────────────────────────────────────
    // GUARD anti-cancelamento de pedido pago: um pedido com QUALQUER pagamento
    // aprovado (ou pagoEm preenchido) NUNCA pode ser cancelado por um evento de
    // negação/expiração (rejected/cancelled) — o caso clássico é um PIX que
    // expira DEPOIS do cartão já ter sido aprovado. Só um ESTORNO real
    // (refunded/charged_back) reverte um pedido pago.
    const ESTORNO = ['refunded', 'charged_back']
    const negado = novoStatus === 'rejected' || novoStatus === 'cancelled'

    const pedidoTemPagamentoAprovado =
      pedido.pagoEm != null ||
      isStatusPago(pedido.status) ||
      (await prisma.pagamento.count({
        where: { pedidoId: pedido.id, mpStatus: 'approved' },
      })) > 0

    if (ESTORNO.includes(novoStatus)) {
      // Estorno/chargeback real → cancela o pedido e faz clawback do cashback.
      // NÃO chamamos refund na API do MP: o dinheiro já voltou lá (foi o próprio
      // MP quem emitiu este evento); aqui só refletimos o estado internamente.
      if (!isStatusCancelado(pedido.status)) {
        await prisma.pedido.update({
          where: { id: pedido.id },
          data: {
            status: 'cancelado',
            canceladoEm: new Date(),
            canceladoMotivo: `Estorno Mercado Pago (${novoStatus}) — pagamento ${mpPaymentId}`,
          },
        })
        // clawback DEPOIS de cancelar, p/ o recálculo de nível já excluir o pedido.
        await estornarCashbackPedido(pedido.id).catch((e) =>
          console.error('[mp:webhook] clawback cashback:', (e as Error).message),
        )
      }
    } else if (negado) {
      if (pedidoTemPagamentoAprovado) {
        // Pedido já pago: o evento negado/expirado atualiza APENAS o pagamento
        // (feito acima). NUNCA derruba o pedido. Corrige o bug do PIX expirado
        // cancelando um pedido pago por cartão.
        console.warn(
          `[mp:webhook] ${novoStatus} ignorado p/ o status do pedido ${pedido.id}: ` +
            `já existe pagamento aprovado (evento do pagamento ${mpPaymentId})`,
        )
      } else if (!isStatusCancelado(pedido.status)) {
        // Pedido ainda não pago → volta a 'pendente' (comportamento antigo).
        await prisma.pedido.update({
          where: { id: pedido.id },
          data: { status: 'pendente' },
        })
      }
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
