// ════════════════════════════════════════════════
// SIXXIS — SISTEMA DE TRACKING
// ════════════════════════════════════════════════

export const COOKIE_SESSION = 'sixxis_sid'
export const COOKIE_CONSENT = 'sixxis_cookie_consent'

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

export function extrairUTMs(url: string) {
  try {
    const u = new URL(url)
    return {
      utmSource:   u.searchParams.get('utm_source')   || undefined,
      utmMedium:   u.searchParams.get('utm_medium')   || undefined,
      utmCampaign: u.searchParams.get('utm_campaign') || undefined,
      utmContent:  u.searchParams.get('utm_content')  || undefined,
      utmTerm:     u.searchParams.get('utm_term')     || undefined,
    }
  } catch {
    return {}
  }
}
