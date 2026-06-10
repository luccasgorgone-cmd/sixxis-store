import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CONSENT_COOKIE, parseConsent } from '@/lib/consent'

export const dynamic = 'force-dynamic'

// Heartbeat de presença (Fase 2). Payload mínimo enviado pelo TrackingProvider a
// cada ~15s enquanto a aba está visível. Upsert por sessaoId — 1 linha/sessão.
// Gate LGPD: sem consentimento analítico, não registra (igual aos demais eventos).
export async function POST(req: NextRequest) {
  try {
    // Aceita corpo de sendBeacon (Blob/text) ou fetch JSON.
    const body = await req.json().catch(() => null) as
      | { sessaoId?: string; path?: string; dispositivo?: string }
      | null
    if (!body?.sessaoId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const consent = parseConsent(req.cookies.get(CONSENT_COOKIE)?.value)
    if (!consent.analytics) {
      return NextResponse.json({ ok: false, reason: 'no_consent' })
    }

    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : null
    const dispositivo = typeof body.dispositivo === 'string' ? body.dispositivo.slice(0, 32) : null
    const agora = new Date()

    await prisma.presenca.upsert({
      where: { sessaoId: body.sessaoId },
      create: { sessaoId: body.sessaoId, path, dispositivo, ultimoPing: agora },
      update: { path, dispositivo, ultimoPing: agora },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[heartbeat]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
