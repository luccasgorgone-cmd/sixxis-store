import { NextRequest, NextResponse } from 'next/server'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'
import { reconciliarMultiMetodo } from '@/lib/checkout-multi-metodo-orquestrador'
import { paymentsClientDeps } from '@/lib/mercadopago-payments-deps'

// Reconciliação sob demanda do checkout multi-método (requisito 8) — o boot
// do server (instrumentation.ts) já cobre "acabou de cair e subiu de novo",
// mas um processo que fica no ar por dias sem reiniciar também precisa disso
// periodicamente. Pensada pra ser chamada por um agendador EXTERNO (Railway
// Cron Job, por exemplo) a cada poucos minutos — não há scheduler embutido
// no código pra isto.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!autorizarInterno(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: HEADERS_INTERNOS })
  }

  const resultado = await reconciliarMultiMetodo(paymentsClientDeps)
  return NextResponse.json({ ok: true, ...resultado }, { headers: HEADERS_INTERNOS })
}
