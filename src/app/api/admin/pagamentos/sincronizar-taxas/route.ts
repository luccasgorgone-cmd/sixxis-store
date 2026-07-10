import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { mpPayment, somarTaxaMp } from '@/lib/mercadopago'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'

export const dynamic = 'force-dynamic'

// Backfill da tarifa real do MP nos pedidos PAGOS que ainda têm mpTaxaReal null.
//
//   POST /api/admin/pagamentos/sincronizar-taxas?limite=50
//
// Idempotente: só toca em pedidos com mpTaxaReal null; rodar de novo é seguro.
//
// Ordem de busca da taxa, para NÃO castigar a API do MP:
//   1) Pagamento.rawResponse.fee_details — o webhook já salvou isso. De graça.
//   2) GET /v1/payments/{id} via SDK, só quando (1) não tem o dado.
// Entre chamadas à API há uma pausa curta (rate limit do MP).

const LIMITE_PADRAO = 50
const LIMITE_MAX    = 200
const PAUSA_MS      = 250

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const limiteParam = Number(request.nextUrl.searchParams.get('limite'))
  const limite = Math.min(
    Number.isFinite(limiteParam) && limiteParam > 0 ? limiteParam : LIMITE_PADRAO,
    LIMITE_MAX,
  )

  const pendentes = await prisma.pedido.findMany({
    where: {
      status:      { in: STATUS_PAGO_TODOS },
      mpPaymentId: { not: null },
      mpTaxaReal:  null,
    },
    select: { id: true, mpPaymentId: true },
    orderBy: { pagoEm: 'desc' },
    take: limite,
  })

  let atualizados = 0
  let semTaxa     = 0   // MP respondeu mas não trouxe fee_details
  let falhas      = 0   // erro de rede/API
  let viaCache    = 0   // resolvido pelo rawResponse, sem chamar o MP

  for (const p of pendentes) {
    const mpPaymentId = p.mpPaymentId as string
    try {
      // (1) rawResponse que o webhook já persistiu.
      const pagamento = await prisma.pagamento.findUnique({
        where:  { mpPaymentId },
        select: { rawResponse: true },
      })
      const raw = pagamento?.rawResponse as { fee_details?: unknown } | null
      let taxa = somarTaxaMp(raw?.fee_details)
      if (taxa != null) viaCache++

      // (2) só então a API do MP.
      if (taxa == null) {
        if (!mpPayment) throw new Error('Mercado Pago client não configurado')
        const mpResp = await mpPayment.get({ id: mpPaymentId })
        taxa = somarTaxaMp((mpResp as { fee_details?: unknown }).fee_details)
        await pausa(PAUSA_MS)
      }

      if (taxa == null) {
        semTaxa++
        console.warn(`[mp-taxa] sem fee_details p/ pagamento ${mpPaymentId} (pedido ${p.id})`)
        continue
      }

      // updateMany + guard `null` = idempotente mesmo com 2 execuções em paralelo.
      const r = await prisma.pedido.updateMany({
        where: { id: p.id, mpTaxaReal: null },
        data:  { mpTaxaReal: taxa },
      })
      if (r.count) atualizados++
    } catch (e) {
      falhas++
      console.error(`[mp-taxa] falha no pagamento ${mpPaymentId}:`, (e as Error).message)
    }
  }

  const restantes = await prisma.pedido.count({
    where: {
      status:      { in: STATUS_PAGO_TODOS },
      mpPaymentId: { not: null },
      mpTaxaReal:  null,
    },
  })

  await auditLog({
    req: request,
    action: 'pagamentos.sincronizar-taxas',
    target: 'pedidos',
    metadata: { processados: pendentes.length, atualizados, semTaxa, falhas, restantes },
  })

  return NextResponse.json({
    ok: true,
    processados: pendentes.length,
    atualizados,
    viaCache,
    semTaxa,
    falhas,
    restantes,
  })
}
