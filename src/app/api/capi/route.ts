// ─── Meta Conversions API — meio-funil (ViewContent / AddToCart) ─────────────
// Espelho SERVER dos eventos que o Pixel já dispara no browser (events.ts). O
// browser manda o MESMO event_id (UUID gerado 1x por disparo) aqui e no fbq →
// o Events Manager DEDUPLICA (senão conta em dobro). Gate LGPD: categoria
// 'marketing' (igual ao Pixel). fbp/fbc saem dos cookies de 1ª parte do próprio
// request (_fbp/_fbc); ip/ua do header — nada de PII extra trafega no corpo.
// content_ids = g:id do feed (NUNCA o CUID). Nunca lança: o tracking de
// marketing não pode quebrar a navegação.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CONSENT_COOKIE, parseConsent } from '@/lib/consent'
import { getClientIp, rateLimit } from '@/lib/ratelimit'
import { enviarEventoCapi } from '@/lib/analytics/meta-capi'

export const dynamic = 'force-dynamic'

const feedId = z.string().max(191).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)

const bodySchema = z.object({
  event_name: z.enum(['ViewContent', 'AddToCart']),
  event_id: z.string().uuid(),
  event_source_url: z.url().max(2000),
  content_ids: z.array(feedId).min(1).max(50),
  content_name: z.string().max(500).optional(),
  value: z.number().finite().min(0).max(100_000_000),
  currency: z.literal('BRL'),
  num_items: z.number().int().min(1).max(1000).optional(),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const quota = await rateLimit('capi', ip)
    if (!quota.success) return NextResponse.json({ ok: false }, { status: 429 })

    const raw = await req.text()
    if (Buffer.byteLength(raw, 'utf8') > 8_192) return NextResponse.json({ ok: false }, { status: 413 })
    let decoded: unknown
    try { decoded = JSON.parse(raw) } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
    const parsed = bodySchema.safeParse(decoded)
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
    const body = parsed.data

    // Gate de marketing (LGPD): sem opt-in de publicidade, não envia ao Meta.
    const consent = parseConsent(req.cookies.get(CONSENT_COOKIE)?.value)
    if (!consent.marketing) return NextResponse.json({ ok: false, reason: 'no_consent' })

    const resultado = await enviarEventoCapi({
      eventName: body.event_name,
      eventId: body.event_id,
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: body.event_source_url,
      fbp: req.cookies.get('_fbp')?.value ?? null,
      fbc: req.cookies.get('_fbc')?.value ?? null,
      clientIp: ip === 'unknown' ? null : ip,
      clientUserAgent: req.headers.get('user-agent'),
      value: body.value,
      currency: body.currency,
      contentIds: body.content_ids,
      contentName: body.content_name,
      numItems: body.num_items,
    })

    if (!resultado.ok) {
      // Falha do Graph não quebra o fluxo; loga server-side p/ diagnóstico.
      console.error('[CAPI] envio meio-funil falhou:', resultado.error)
      return NextResponse.json({ ok: false, reason: 'send_failed' })
    }
    return NextResponse.json({ ok: true })
  } catch {
    console.error('[CAPI] request failed')
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
