'use client'
import { useCallback } from 'react'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('sixxis_session_id')
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
    localStorage.setItem('sixxis_session_id', sid)
  }
  return sid
}

function hasConsent(cat = 'analytics'): boolean {
  if (typeof window === 'undefined') return false
  try {
    const c = JSON.parse(localStorage.getItem('sixxis_cookie_consent') || '{}')
    return c?.categorias?.[cat] === true
  } catch {
    return false
  }
}

export function useAnalytics() {
  const track = useCallback(async (
    tipo: string,
    dados?: Record<string, unknown>,
    pagina?: string,
  ) => {
    if (!hasConsent('analytics')) return
    try {
      await fetch('/api/analytics/evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          tipo,
          dados: dados || {},
          pagina: pagina || (typeof window !== 'undefined' ? window.location.pathname : ''),
        }),
      })
    } catch (e) {
      console.error('[useAnalytics]', e)
    }
  }, [])

  return { track, hasConsent, getSessionId }
}
