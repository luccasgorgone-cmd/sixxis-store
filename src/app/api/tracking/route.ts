import { createHash } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { COOKIE_SESSION, detectDispositivo, detectBrowser, detectOS, extrairUTMs } from '@/lib/tracking'
import { CONSENT_COOKIE, parseConsent } from '@/lib/consent'
import { getClientIp, rateLimit } from '@/lib/ratelimit'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'

export const dynamic = 'force-dynamic'

const EVENT_TYPES = ['page_view', 'scroll_depth', 'view_item', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'checkout_payment_outcome', 'add_shipping_info', 'purchase', 'search'] as const
type EventType = typeof EVENT_TYPES[number]
const shortText = z.string().max(191)
const optionalText = shortText.nullish()
const item = z.object({ id: shortText, nome: z.string().max(500), qtd: z.number().int().min(1).max(100), preco: z.number().finite().min(0).max(100_000_000) }).strict()
const eventDataSchemas: Record<EventType, z.ZodType> = {
  page_view: z.object({}).strict(),
  scroll_depth: z.object({ profundidade: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]) }).strict(),
  view_item: z.object({ item_name: z.string().max(500).optional(), item_category: optionalText, variant: optionalText }).strict(),
  add_to_cart: z.object({ item_name: z.string().max(500).optional(), item_category: optionalText, quantity: z.number().int().min(1).max(100).optional(), variant: optionalText, price: z.number().finite().min(0).max(100_000_000).optional() }).strict(),
  begin_checkout: z.object({ coupon: optionalText, eventID: optionalText, itens: z.array(item).max(50).optional() }).strict(),
  add_payment_info: z.object({ payment_type: optionalText, coupon: optionalText }).strict(),
  checkout_payment_outcome: z.object({ outcome: z.enum(['submit', 'approved', 'pix_generated', 'pending', 'rejected', 'api_error', 'brick_error']), http_status: z.number().int().min(100).max(599).optional(), stage: z.enum(['config', 'validation', 'request', 'response']).optional(), payment_status: optionalText }).strict(),
  add_shipping_info: z.object({ shipping_tier: optionalText, coupon: optionalText }).strict(),
  purchase: z.object({ transaction_id: shortText, shipping: z.number().finite().min(0).max(100_000_000), coupon: optionalText, itens: z.array(item).max(50) }).strict(),
  search: z.object({ termo: z.string().trim().min(1).max(200) }).strict(),
}
const bodySchema = z.object({
  tipo: z.enum(EVENT_TYPES),
  sessaoId: z.string().regex(/^sid_\d{13}_[a-z0-9]{8}$/),
  pagina: z.string().max(500).refine(value => value.startsWith('/') && !value.includes('://')).optional(),
  landingPage: z.url().max(2000).optional(),
  produtoId: shortText.optional(),
  produtoSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(191).optional(),
  valor: z.number().finite().min(0).max(100_000_000).optional(),
  dados: z.unknown().optional(),
  profundidade: z.number().optional(),
}).strict()

function invalid() { return NextResponse.json({ ok: false }, { status: 400 }) }

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const quota = await rateLimit('tracking', ip)
    if (!quota.success) return NextResponse.json({ ok: false }, { status: 429 })

    const raw = await req.text()
    if (Buffer.byteLength(raw, 'utf8') > 16_384) return NextResponse.json({ ok: false }, { status: 413 })
    let decoded: unknown
    try { decoded = JSON.parse(raw) } catch { return invalid() }
    const parsed = bodySchema.safeParse(decoded)
    if (!parsed.success) return invalid()
    const body = parsed.data

    const consent = parseConsent(req.cookies.get(CONSENT_COOKIE)?.value)
    if (!consent.analytics) return NextResponse.json({ ok: false, reason: 'no_consent' })
    if (req.cookies.get(COOKIE_SESSION)?.value !== body.sessaoId) return invalid()

    const dataInput = body.tipo === 'scroll_depth' ? { profundidade: body.profundidade } : (body.dados ?? {})
    const eventData = eventDataSchemas[body.tipo].safeParse(dataInput)
    if (!eventData.success) return invalid()

    if (body.tipo === 'purchase') {
      const purchase = eventData.data as { transaction_id: string }
      const order = await prisma.pedido.findFirst({ where: { id: purchase.transaction_id, status: { in: STATUS_PAGO_TODOS } }, select: { id: true, total: true } })
      if (!order || body.valor === undefined || Math.abs(Number(order.total) - body.valor) > 0.01) return invalid()
    }

    const userAgent = req.headers.get('user-agent') || ''
    const anonIp = ip === 'unknown' ? null : ip.includes('.') ? `${ip.split('.').slice(0, 3).join('.')}.0` : ip
    const landingPage = body.landingPage ?? ''
    const utms = extrairUTMs(landingPage)
    const atributo = (value: string | undefined) => value?.substring(0, 191)
    const referer = req.headers.get('referer') || null
    // fbc: cookie _fbc (setado pelo fbevents.js) é a fonte autoritativa; quando
    // ainda não existe (primeiro hit antes do Pixel), sintetiza do fbclid no
    // formato oficial do Meta. Só grava fbc quando há sinal Meta real.
    const fbcCookie = req.cookies.get('_fbc')?.value
    const fbc = fbcCookie || (utms.fbclid ? `fb.1.${Date.now()}.${utms.fbclid}` : undefined)

    await prisma.sessaoVisitante.upsert({
      where: { sessaoId: body.sessaoId },
      create: {
        sessaoId: body.sessaoId,
        ip: anonIp,
        userAgent: userAgent.substring(0, 500),
        dispositivo: detectDispositivo(userAgent),
        browser: detectBrowser(userAgent),
        os: detectOS(userAgent),
        landingPage: landingPage || null,
        utmSource: atributo(utms.utmSource), utmMedium: atributo(utms.utmMedium), utmCampaign: atributo(utms.utmCampaign),
        utmContent: atributo(utms.utmContent), utmTerm: atributo(utms.utmTerm), gclid: atributo(utms.gclid), gbraid: atributo(utms.gbraid), wbraid: atributo(utms.wbraid),
        fbclid: atributo(utms.fbclid), fbc: atributo(fbc),
        referer: referer?.substring(0, 500) || null,
        totalPaginas: body.tipo === 'page_view' ? 1 : 0,
      },
      update: body.tipo === 'page_view' ? { totalPaginas: { increment: 1 } } : {},
    })

    const data: Prisma.EventoTrackingUncheckedCreateInput = { sessaoId: body.sessaoId, tipo: body.tipo, pagina: body.pagina || null, produtoId: body.produtoId || null, produtoSlug: body.produtoSlug || null, valor: body.valor ?? null, dados: eventData.data as Prisma.InputJsonValue }
    if (body.tipo === 'purchase') {
      const transactionId = (eventData.data as { transaction_id: string }).transaction_id
      const id = `trk_${createHash('sha256').update(`purchase:${transactionId}`).digest('hex')}`
      await prisma.eventoTracking.upsert({ where: { id }, create: { ...data, id }, update: {} })
    } else {
      await prisma.eventoTracking.create({ data })
    }

    return NextResponse.json({ ok: true })
  } catch {
    console.error('[Tracking] request failed')
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
