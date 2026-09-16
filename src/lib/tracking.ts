// ════════════════════════════════════════════════
// SIXXIS — SISTEMA DE TRACKING
// ════════════════════════════════════════════════

export const COOKIE_SESSION = 'sixxis_sid'
export const COOKIE_CONSENT = 'sixxis_cookie_consent'
const SESSION_LANDING_PAGE_PREFIX = 'sixxis_landing_page:'

export function detectDispositivo(ua: string): string {
  if (!ua) return 'desktop'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/mobile/i.test(ua)) return 'mobile'
  return 'desktop'
}

export function detectBrowser(ua: string): string {
  if (!ua) return 'Outro'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  return 'Outro'
}

export function detectOS(ua: string): string {
  if (!ua) return 'Outro'
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac OS')) return 'macOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Outro'
}

export function gerarSessaoId(): string {
  return `sid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

// ── Sessão no client (cookie único sixxis_sid) ────────────────────────────────
// Fonte única do id de sessão usada por TrackingProvider, eventos de e-commerce
// (events.ts) e pelo registro de consentimento. Sem localStorage.
export function lerSidClient(): string {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';')
    .find(c => c.trim().startsWith(COOKIE_SESSION + '='))
    ?.split('=')[1]?.trim() || ''
}

export function obterSidClient(): string {
  if (typeof document === 'undefined') return ''
  let sid = lerSidClient()
  if (!sid) {
    sid = gerarSessaoId()
    const expires = new Date(Date.now() + 864e5).toUTCString()
    document.cookie = `${COOKIE_SESSION}=${sid};expires=${expires};path=/;SameSite=Lax`
  }
  return sid
}

// Mantém a URL completa do PRIMEIRO contato vinculada ao sid atual. O pathname
// continua separado nos eventos; query params de atribuição nunca poluem o feed
// de páginas. Chamado apenas depois do opt-in de analytics.
export function obterLandingPageSessao(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  sessaoId: string,
  hrefAtual: string,
): string {
  if (!sessaoId) return hrefAtual
  const key = `${SESSION_LANDING_PAGE_PREFIX}${sessaoId}`
  try {
    const existente = storage.getItem(key)
    if (existente) return existente
    storage.setItem(key, hrefAtual)
  } catch { /* sessionStorage indisponível: usa a URL atual sem bloquear tracking */ }
  return hrefAtual
}

export function lerLandingPageSessao(
  storage: Pick<Storage, 'getItem'>,
  sessaoId: string,
): string | undefined {
  if (!sessaoId) return undefined
  try {
    return storage.getItem(`${SESSION_LANDING_PAGE_PREFIX}${sessaoId}`) || undefined
  } catch {
    return undefined
  }
}

// Google Ads faz auto-tagging (gclid/gbraid/wbraid) em vez de UTM manual — sem
// utm_source, esse tráfego ficava invisível pra atribuição (Meta continua
// normal, que sempre manda utm_* de verdade). Fallback ADITIVO: só entra em
// ação quando NÃO há utm_source; se houver (Meta ou UTM manual do Google),
// o comportamento de sempre continua intacto e nenhum click id é sintetizado.
export function extrairUTMs(url: string) {
  try {
    const u = new URL(url)
    const utmSource = u.searchParams.get('utm_source') || undefined
    const gclid = u.searchParams.get('gclid') || undefined
    const gbraid = u.searchParams.get('gbraid') || undefined
    const wbraid = u.searchParams.get('wbraid') || undefined
    const googleClickId = gclid || gbraid || wbraid

    if (!utmSource && googleClickId) {
      return {
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: u.searchParams.get('utm_campaign') || undefined,
        utmContent:  u.searchParams.get('utm_content')  || undefined,
        utmTerm:     u.searchParams.get('utm_term')     || undefined,
        gclid,
        gbraid,
        wbraid,
      }
    }

    return {
      utmSource,
      utmMedium:   u.searchParams.get('utm_medium')   || undefined,
      utmCampaign: u.searchParams.get('utm_campaign') || undefined,
      utmContent:  u.searchParams.get('utm_content')  || undefined,
      utmTerm:     u.searchParams.get('utm_term')     || undefined,
      gclid,
      gbraid,
      wbraid,
    }
  } catch {
    return {}
  }
}
