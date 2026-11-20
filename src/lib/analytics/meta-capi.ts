// ─── Meta Conversions API (CAPI) — SERVER ONLY ───────────────────────────────
// Envia eventos server-side para a Graph API (/{PIXEL_ID}/events). O token é um
// System User token que vive SÓ no servidor (META_CAPI_ACCESS_TOKEN) — NUNCA no
// client. Reusa a MESMA normalização do Advanced Matching do browser
// (montarAdvancedMatching) e então hasheia em SHA-256 server-side, garantindo que
// os hashes batam com os do Pixel. event_id = pedido.id → a Meta DEDUPLICA o
// Purchase do browser com o do servidor.

import crypto from 'crypto'
import { montarAdvancedMatching, type MetaAdvancedMatching } from '@/lib/analytics/meta-pixel'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const API_VERSION = 'v21.0'

function sha256(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex')
}

export interface CapiPurchaseInput {
  eventId: string // = pedido.id (dedupe com o Purchase do browser)
  eventTime: number // unix seconds
  eventSourceUrl: string
  userData: MetaAdvancedMatching
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  clientUserAgent?: string | null
  value: number
  currency: string
  contentIds: string[]
  contents: { id: string; quantity: number; item_price: number }[]
  numItems: number
}

// Campos de PII que a Meta exige hasheados (SHA-256 do valor normalizado).
const CAMPOS_HASH = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country', 'external_id'] as const

// Sinais de user_data comuns a qualquer evento CAPI. userData (advanced matching)
// é opcional: no meio-funil (ViewContent/AddToCart) o visitante costuma ser
// anônimo, então só fbp/fbc/ip/ua vão — exatamente como o Pixel do browser manda.
interface UserDataBase {
  userData?: MetaAdvancedMatching
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  clientUserAgent?: string | null
}

function montarUserData(input: UserDataBase): Record<string, unknown> {
  const ud: Record<string, unknown> = {}
  if (input.userData) {
    const am = montarAdvancedMatching(input.userData) // MESMA normalização do browser
    for (const k of CAMPOS_HASH) {
      if (am[k]) ud[k] = sha256(am[k])
    }
  }
  // fbp/fbc/ip/ua vão em CLARO (a Meta não hasheia estes).
  if (input.fbp) ud.fbp = input.fbp
  if (input.fbc) ud.fbc = input.fbc
  if (input.clientIp) ud.client_ip_address = input.clientIp
  if (input.clientUserAgent) ud.client_user_agent = input.clientUserAgent
  return ud
}

// Envia o Purchase para o CAPI. NUNCA lança — retorna { ok, error } para o
// chamador (webhook) logar sem quebrar o fluxo do pedido.
export async function enviarPurchaseCapi(
  input: CapiPurchaseInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return { ok: false, error: 'META_CAPI_ACCESS_TOKEN ou NEXT_PUBLIC_META_PIXEL_ID ausente' }
  }

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: input.eventTime,
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: input.eventSourceUrl,
        user_data: montarUserData(input),
        custom_data: {
          currency: input.currency,
          value: input.value,
          content_type: 'product',
          content_ids: input.contentIds,
          contents: input.contents,
          num_items: input.numItems,
        },
      },
    ],
  }

  return postCapi(body.data)
}

// POST cru para a Graph API. NUNCA lança — retorna { ok, error }. Centraliza o
// envio (Purchase e meio-funil) e a checagem de credenciais.
async function postCapi(data: unknown[]): Promise<{ ok: boolean; error?: string }> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return { ok: false, error: 'META_CAPI_ACCESS_TOKEN ou NEXT_PUBLIC_META_PIXEL_ID ausente' }
  }
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      return { ok: false, error: `Graph ${resp.status}: ${txt.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Meio-funil (ViewContent / AddToCart) — server-side ──────────────────────
// Espelho server dos eventos que o Pixel já dispara no browser (events.ts). O
// event_id DEVE ser o MESMO UUID gerado no browser p/ aquele disparo, senão o
// Events Manager CONTA EM DOBRO em vez de deduplicar. Visitante anônimo → sem
// advanced matching; só fbp/fbc/ip/ua casam a identidade. content_ids = g:id do
// feed (NUNCA o CUID). num_items default 1.
export type CapiEventoNome = 'ViewContent' | 'AddToCart'

export interface CapiEventoInput {
  eventName: CapiEventoNome
  eventId: string // = UUID gerado no browser (dedupe com o Pixel)
  eventTime: number // unix seconds
  eventSourceUrl: string
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  clientUserAgent?: string | null
  value: number
  currency: string
  contentIds: string[]
  contentName?: string
  numItems?: number
}

export async function enviarEventoCapi(
  input: CapiEventoInput,
): Promise<{ ok: boolean; error?: string }> {
  const custom: Record<string, unknown> = {
    currency: input.currency,
    value: input.value,
    content_type: 'product',
    content_ids: input.contentIds,
  }
  if (input.contentName) custom.content_name = input.contentName
  if (input.eventName === 'AddToCart') custom.num_items = input.numItems ?? 1

  return postCapi([
    {
      event_name: input.eventName,
      event_time: input.eventTime,
      event_id: input.eventId,
      action_source: 'website',
      event_source_url: input.eventSourceUrl,
      user_data: montarUserData({
        fbp: input.fbp,
        fbc: input.fbc,
        clientIp: input.clientIp,
        clientUserAgent: input.clientUserAgent,
      }),
      custom_data: custom,
    },
  ])
}
