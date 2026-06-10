import { NextRequest } from 'next/server'

// DEPRECATED — Sistema B aposentado (Fase 1 analytics). O tracking interno foi
// consolidado no Sistema A: emissão via lib/analytics/events.ts → /api/tracking
// (EventoTracking/SessaoVisitante). Esta rota não grava mais nada; os models
// EventoAnalitico/ClienteInsight permanecem no schema (sem drop), apenas sem uso.
export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json(
    { ok: false, deprecated: true, motivo: 'Use /api/tracking (Sistema A).' },
    { status: 410 },
  )
}

export async function GET(_req: NextRequest) {
  void _req
  return Response.json([])
}
