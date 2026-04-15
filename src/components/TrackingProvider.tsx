'use client'

import { createContext, useContext, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { COOKIE_SESSION, COOKIE_CONSENT, gerarSessaoId } from '@/lib/tracking'

type TrackData = Record<string, unknown>

interface TrackingCtx {
  track: (tipo: string, dados?: TrackData) => void
  sessaoId: string
}

const TrackingContext = createContext<TrackingCtx>({
  track: () => {},
  sessaoId: '',
})

export function useTracking() {
  return useContext(TrackingContext)
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';')
    .find(c => c.trim().startsWith(name + '='))
    ?.split('=')[1]?.trim() || ''
}

function setCookieClient(name: string, value: string, days = 1) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax`
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const sessaoIdRef = useRef<string>('')

  useEffect(() => {
    let sid = getCookie(COOKIE_SESSION)
    if (!sid) {
      sid = gerarSessaoId()
      setCookieClient(COOKIE_SESSION, sid, 1)
    }
    sessaoIdRef.current = sid

    // Persistir UTMs para uso em conversões posteriores
    try {
      const params = new URLSearchParams(window.location.search)
      const utms: Record<string, string> = {}
      ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
        const v = params.get(k)
        if (v) utms[k] = v
      })
      if (Object.keys(utms).length > 0) {
        sessionStorage.setItem('sixxis_utms', JSON.stringify(utms))
      }
    } catch {}
  }, [])

  const track = useCallback((tipo: string, dados?: TrackData) => {
    if (typeof window === 'undefined') return
    const consent = getCookie(COOKIE_CONSENT)
    if (consent === 'recusado') return
    const sid = sessaoIdRef.current
    if (!sid) return

    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo,
        sessaoId: sid,
        pagina: window.location.href,
        ...dados,
      }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  // Page views automáticos
  useEffect(() => {
    if (!sessaoIdRef.current) return
    track('page_view')
  }, [pathname, track])

  // Scroll depth milestones
  useEffect(() => {
    let maxScroll = 0
    const marcos = new Set<number>()
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight
      if (total <= 0) return
      const pct = Math.round((window.scrollY / total) * 100)
      if (pct > maxScroll) maxScroll = pct
      for (const m of [25, 50, 75, 100]) {
        if (maxScroll >= m && !marcos.has(m)) {
          marcos.add(m)
          track('scroll_depth', { profundidade: m })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname, track])

  return (
    <TrackingContext.Provider value={{ track, sessaoId: sessaoIdRef.current }}>
      {children}
    </TrackingContext.Provider>
  )
}
