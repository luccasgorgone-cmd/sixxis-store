'use client'

import { useCallback } from 'react'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('sixxis_session_id')
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem('sixxis_session_id', id)
  }
  return id
}

function hasAnalyticConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('sixxis_cookie_consent')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!parsed?.analiticos
  } catch {
    return false
  }
}

export function useAnalytics() {
  const trackEvento = useCallback(async (tipo: string, dados?: Record<string, unknown>) => {
    if (!hasAnalyticConsent()) return
    const sessionId = getSessionId()
    const pagina = typeof window !== 'undefined' ? window.location.pathname : undefined

    try {
      await fetch('/api/analytics/evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, tipo, dados, pagina }),
      })
    } catch {
      // silencioso
    }
  }, [])

  const trackVisita = useCallback(async (pagina?: string) => {
    if (!hasAnalyticConsent()) return
    const sessionId = getSessionId()
    const paginaFinal = pagina ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
    const referrer = typeof document !== 'undefined' ? document.referrer : undefined

    try {
      await fetch('/api/analytics/visita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, pagina: paginaFinal, referrer }),
      })
    } catch {
      // silencioso
    }
  }, [])

  return { trackEvento, trackVisita }
}
