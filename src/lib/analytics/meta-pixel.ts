// ─── Meta Pixel — helper de eventos (lado client) ────────────────────────────
// Espelha o padrão de src/lib/analytics/events.ts (GA4): um disparo central,
// com gate LGPD. Aqui o gate é a categoria 'marketing' (Pixel = publicidade).
//
// A base do Pixel (fbevents.js + init + PageView) é carregada no layout raiz por
// <MetaPixelScript/>. Este módulo só DISPARA eventos padrão da Meta nos mesmos
// pontos onde o GA4 já dispara — chamado de dentro de events.ts.

import { marketingConsentido } from '@/lib/consent'

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

type Fbq = ((...args: unknown[]) => void) & {
  queue?: unknown[]
  loaded?: boolean
  version?: string
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

// Garante value numérico em BRL (nunca Decimal/string) — exigência da Meta.
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Dispara um evento padrão da Meta. No-op sem fbq (script ainda não montou) ou
 * sem consentimento de marketing. `options.eventID` vai como 4º arg do fbq —
 * essencial p/ DEDUPLICAR com o CAPI (fase 2): mesmo id no browser e no servidor.
 */
export function trackMeta(
  evento: string,
  params: Record<string, unknown> = {},
  options?: { eventID?: string },
) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  // LGPD: mesmo gate que concede/revoga o consentimento do Pixel.
  // (Plugue/remova este gate junto com o do GA4 se a política mudar.)
  if (!marketingConsentido()) return

  const limpo: Record<string, unknown> = { ...params }
  if ('value' in limpo) limpo.value = num(limpo.value)

  if (options?.eventID) {
    window.fbq('track', evento, limpo, { eventID: options.eventID })
  } else {
    window.fbq('track', evento, limpo)
  }
}

// PageView avulso (trocas de rota client-side). Mesmo gate do trackMeta.
export function trackMetaPageView() {
  trackMeta('PageView')
}
