import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { mpPayment } from '@/lib/mercadopago'
import { STATUS_PENDENTE_TODOS } from '@/lib/pedido-status'
import { registrarUsoCupom } from '@/lib/cupom'
import { creditarCashback } from '@/lib/cashback'
import { calcularPontos, creditarPontos } from '@/lib/fidelidade'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// ─── Reconciliação de status de pagamento (rede de segurança do webhook) ─────
//
//   POST /api/admin/pagamentos/reconciliar-status?limite=50
//
// POR QUÊ: o webhook do Mercado Pago é HOJE o ÚNICO caminho que marca um pedido
// como "pago". Se um webhook se perde (MP não entregou, URL/secret errados,
// 503 fail-closed, timeout), o pedido fica PENDENTE para sempre mesmo tendo sido
// pago — o sintoma relatado ("pedidos ficam pendentes e não passam"). Esta rota
// pergunta ao MP o status REAL dos pedidos pendentes e aplica o que o MP diz.
//
// SEGURANÇA:
//   • Só avança PENDENTE → PAGO quando o MP responde status='approved'. Nunca
//     inventa aprovação; a verdade é sempre o GET /v1/payments/{id}.
//   • Claim ATÔMICO (updateMany guardado por status pendente): só UMA via
//     (webhook OU esta reconciliação) vence a transição e dispara os efeitos
//     idempotentes (uso de cupom, cashback, pontos). Se o webhook já marcou
//     pago, claim.count=0 e nada é refeito.
//   • PULA pernas de checkout multi-método (tentativaMultiMetodoId != null):
//     elas têm orquestração própria (processarTentativa) e NUNCA podem marcar o
//     pedido inteiro pago sozinhas. Igual ao guard do webhook.
//   • NÃO re-dispara e-mail/CAPI/GA4 (notificação/analytics) — o webhook segue
//     dono disso; aqui o foco é destravar o estado + crédito idempotente.
//   • Não cancela pedidos: pagamentos rejeitados/cancelados/pendentes de fato
//     (ex.: PIX ainda não pago) são só reportados, não mexidos.
//
// Idempotente e seguro de repetir. Pensado também para rodar via automação/cron.

const LIMITE_PADRAO = 50
const LIMITE_MAX = 200
const PAUSA_MS = 250 // respeita o rate limit do MP entre chamadas

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const limiteParam = Number(request.nextUrl.searchParams.get('limite'))
  const limite = Math.min(
    Number.isFinite(limiteParam) && limiteParam > 0 ? limiteParam : LIMITE_PADRAO,
    LIMITE_MAX,
  )

  if (!mpPayment) {
    return NextResponse.json(
      { ok: false, error: 'Mercado Pago client não configurado (MP_ACCESS_TOKEN ausente).' },
      { status: 503 },
    )
  }

  // Pagamentos de pedidos ainda PENDENTES, com id do MP, de pagamento simples
  // (sem perna multi-método). Mais recentes primeiro.
  const pagamentos = await prisma.pagamento.findMany({
    where: {
      mpPaymentId: { not: null },
      tentativaMultiMetodoId: null,
      pedido: { status: { in: STATUS_PENDENTE_TODOS } },
    },
    select: {
      id: true,
      mpPaymentId: true,
      valor: true,
      pedidoId: true,
      pedido: {
        select: {
          id: true,
          status: true,
          clienteId: true,
          itens: { select: { precoUnitario: true, quantidade: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limite,
  })

  let processados = 0
  let aprovadosAgora = 0 // pendente → pago nesta execução
  let aindaPendentes = 0 // MP ainda não aprovou (ex.: PIX não pago)
  let negados = 0 // MP rejeitou/cancelou (reportado, não mexido)
  let falhas = 0

  for (const pg of pagamentos) {
    const mpPaymentId = pg.mpPaymentId as string
    processados++
    try {
      const mpResp = await mpPayment.get({ id: mpPaymentId })
      const statusMp = mpResp.status ?? 'unknown'
      await pausa(PAUSA_MS)

      // Reflete o status real do MP no Pagamento (informativo; sempre seguro).
      await prisma.pagamento.update({
        where: { id: pg.id },
        data: {
          mpStatus: statusMp,
          mpStatusDetail: mpResp.status_detail ?? null,
          aprovadoEm: statusMp === 'approved' ? new Date() : undefined,
          rejeitadoEm: statusMp === 'rejected' ? new Date() : undefined,
          rawResponse: JSON.parse(JSON.stringify(mpResp)) as Prisma.InputJsonValue,
        },
      })

      if (statusMp !== 'approved') {
        if (statusMp === 'rejected' || statusMp === 'cancelled') negados++
        else aindaPendentes++
        continue
      }

      // MP aprovou → claim atômico da transição pendente → pago. Só quem vence
      // o claim dispara os efeitos idempotentes (evita corrida com o webhook).
      const totalPago = pg.valor / 100
      const claim = await prisma.pedido.updateMany({
        where: { id: pg.pedidoId, status: { in: [...STATUS_PENDENTE_TODOS] } },
        data: { status: 'pago', pagoEm: new Date(), total: totalPago },
      })
      if (claim.count !== 1) {
        // Já estava pago (webhook venceu) — nada a refazer.
        continue
      }
      aprovadosAgora++

      // Efeitos idempotentes (mesmos helpers do webhook). Cada um protege a
      // própria duplicidade; nenhum quebra a confirmação da venda.
      const subtotalProdutos = pg.pedido.itens.reduce(
        (s, i) => s + Number(i.precoUnitario) * i.quantidade,
        0,
      )
      await registrarUsoCupom(pg.pedidoId).catch((e) =>
        console.error('[mp-reconciliar] uso cupom:', (e as Error).message),
      )
      await creditarCashback(pg.pedido.clienteId, subtotalProdutos, pg.pedidoId).catch((e) =>
        console.error('[mp-reconciliar] cashback:', (e as Error).message),
      )
      try {
        const pontos = await calcularPontos(totalPago)
        if (pontos > 0) {
          await creditarPontos(
            pg.pedido.clienteId,
            pontos,
            `Compra #${pg.pedidoId.slice(-8).toUpperCase()}`,
            pg.pedidoId,
          ).catch(() => {})
        }
      } catch (e) {
        console.error('[mp-reconciliar] pontos:', (e as Error).message)
      }

      await auditLog({
        req: request,
        actor: 'reconciliacao-mp',
        action: 'pedido.pago.reconciliado',
        target: pg.pedidoId,
        metadata: { mpPaymentId, valor: pg.valor },
      })
    } catch (e) {
      falhas++
      console.error(`[mp-reconciliar] falha no pagamento ${mpPaymentId}:`, (e as Error).message)
    }
  }

  await auditLog({
    req: request,
    actor: 'reconciliacao-mp',
    action: 'pagamentos.reconciliar-status',
    target: 'pedidos',
    metadata: { processados, aprovadosAgora, aindaPendentes, negados, falhas },
  })

  return NextResponse.json({
    ok: true,
    processados,
    aprovadosAgora,
    aindaPendentes,
    negados,
    falhas,
  })
}
