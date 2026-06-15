// ─── Consentimento (LGPD) — sinal ÚNICO compartilhado client ↔ servidor ──────
// Um cookie de 1ª parte (sixxis_consent) guarda as categorias escolhidas. Lido
// pelos gates do servidor (/api/tracking) e do client (TrackingProvider, eventos
// de e-commerce). Sem isso os gates liam um cookie que nunca existia e sempre
// rastreavam. Funções de cookie do client guardam typeof document/location.

export const CONSENT_COOKIE = 'sixxis_consent'
const UM_ANO = 60 * 60 * 24 * 365

export interface ConsentCategorias {
  analytics: boolean
  marketing: boolean
}

export function serializeConsent(c: ConsentCategorias): string {
  return encodeURIComponent(JSON.stringify({ a: c.analytics ? 1 : 0, m: c.marketing ? 1 : 0 }))
}

export function parseConsent(raw?: string | null): ConsentCategorias {
  if (!raw) return { analytics: false, marketing: false }
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as {
      a?: number; m?: number; analytics?: boolean; marketing?: boolean
    }
    return {
      analytics: o.a === 1 || o.analytics === true,
      marketing: o.m === 1 || o.marketing === true,
    }
  } catch {
    return { analytics: false, marketing: false }
  }
}

// ── Client (document.cookie) ──────────────────────────────────────────────────
export function lerConsentClient(): ConsentCategorias {
  if (typeof document === 'undefined') return { analytics: false, marketing: false }
  const m = document.cookie.match(/(?:^|;\s*)sixxis_consent=([^;]+)/)
  return parseConsent(m?.[1])
}

export function gravarConsentClient(c: ConsentCategorias) {
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(c)}; path=/; max-age=${UM_ANO}; SameSite=Lax${secure}`
}

export function analyticsConsentido(): boolean {
  return lerConsentClient().analytics
}

// Gate de marketing/publicidade (Meta Pixel, remarketing). Espelha
// analyticsConsentido(), mas lê a categoria 'marketing' do mesmo cookie
// sixxis_consent — é a categoria correta p/ ferramentas de anúncio (LGPD).
export function marketingConsentido(): boolean {
  return lerConsentClient().marketing
}

// Evento p/ avisar componentes (ex.: TrackingProvider) que o consentimento mudou.
export const CONSENT_EVENT = 'sixxis-consent-changed'
