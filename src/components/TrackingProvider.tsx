'use client'

import { createContext, useContext, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { COOKIE_SESSION, gerarSessaoId, detectDispositivo } from '@/lib/tracking'
import { analyticsConsentido, CONSENT_EVENT } from '@/lib/consent'
import { ADMIN_BASE, ADMIN_INTERNAL } from '@/lib/admin-path'

type TrackData = Record<string, unknown>

// Flag setada pela árvore do admin (<NoTrack/>): exclusão robusta independente do
// NEXT_PUBLIC_ADMIN_PATH estar inlined no bundle do client.
function noTrackAtivo(): boolean {
  return typeof window !== 'undefined' && !!(window as unknown as { __sixxisNoTrack?: boolean }).__sixxisNoTrack
}

// Normaliza pra pathname: se vier URL completa (https://host/painel.../x), extrai
// só o path. Sem isso, startsWith(ADMIN_BASE) falha contra a URL completa e a
// exclusão vaza. Aceita pathname puro (no-op) ou href.
function normalizarPath(input: string): string {
  if (!input) return ''
  if (input.includes('://')) {
    try { return new URL(input).pathname } catch { return input }
  }
  return input
}

// Não rastreia navegação do admin (path configurável via NEXT_PUBLIC_ADMIN_PATH —
// nada hardcoded), nem rotas internas/assets. Evita inflar visitantes/eventos e
// vazar páginas do painel em "top páginas"/feed. Tracking de cliente intacto.
function pathExcluido(input: string): boolean {
  const path = normalizarPath(input)
  if (!path) return false
  return (
    path === ADMIN_BASE || path.startsWith(ADMIN_BASE + '/') ||
    path === ADMIN_INTERNAL || path.startsWith(ADMIN_INTERNAL + '/') ||
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    /\.[a-z0-9]+$/i.test(path) // assets com extensão (.ico, .png, .css, .js, .txt, .xml…)
  )
}

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
  const inicializadoRef = useRef(false)

  // Só cria o cookie de sessão e persiste UTMs APÓS o consentimento de analytics.
  // Sem consentimento → nada de sixxis_sid nem eventos.
  const garantirSessao = useCallback((): boolean => {
    if (inicializadoRef.current) return true
    if (!analyticsConsentido()) return false

    let sid = getCookie(COOKIE_SESSION)
    if (!sid) {
      sid = gerarSessaoId()
      setCookieClient(COOKIE_SESSION, sid, 1)
    }
    sessaoIdRef.current = sid
    inicializadoRef.current = true

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
    return true
  }, [])

  const track = useCallback((tipo: string, dados?: TrackData) => {
    if (typeof window === 'undefined') return
    // Decide a exclusão SEMPRE pelo pathname (mesma fonte do heartbeat).
    const path = window.location.pathname
    if (noTrackAtivo() || pathExcluido(path)) return // não rastreia admin/api/assets
    if (!garantirSessao()) return // sem consentimento → não rastreia
    const sid = sessaoIdRef.current
    if (!sid) return

    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo,
        sessaoId: sid,
        // Grava o pathname (não a URL completa) → "Top Páginas" agrupa limpo e
        // o feed mostra o path. UTMs ficam na SessaoVisitante.
        pagina: path,
        ...dados,
      }),
      keepalive: true,
    }).catch(() => {})
  }, [garantirSessao])

  // Heartbeat de presença (Fase 2). Ping leve (payload mínimo) por sendBeacon
  // enquanto a aba está visível. Mesmo gate LGPD (garantirSessao só prossegue
  // com consentimento analítico).
  const enviarHeartbeat = useCallback(() => {
    if (typeof document === 'undefined') return
    if (document.visibilityState !== 'visible') return
    if (noTrackAtivo() || pathExcluido(window.location.pathname)) return // não conta presença no admin
    if (!garantirSessao()) return
    const sid = sessaoIdRef.current
    if (!sid) return
    const payload = JSON.stringify({
      sessaoId: sid,
      path: window.location.pathname,
      dispositivo: detectDispositivo(navigator.userAgent),
    })
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/heartbeat', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch { /* noop */ }
  }, [garantirSessao])

  // Inicializa (se já houver consentimento) e reage ao aceite no banner.
  useEffect(() => {
    garantirSessao()
    const onConsent = () => { if (garantirSessao()) { track('page_view'); enviarHeartbeat() } }
    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_EVENT, onConsent)
  }, [garantirSessao, track, enviarHeartbeat])

  // Heartbeat imediato a cada troca de rota + a cada 15s enquanto visível.
  // Pausa quando a aba some (visibilitychange) e retoma ao voltar.
  useEffect(() => {
    enviarHeartbeat()
    let timer: ReturnType<typeof setInterval> | null = null
    const start = () => { if (!timer) timer = setInterval(enviarHeartbeat, 15000) }
    const stop = () => { if (timer) { clearInterval(timer); timer = null } }
    const onVis = () => {
      if (document.visibilityState === 'visible') { enviarHeartbeat(); start() } else { stop() }
    }
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVis)
    return () => { stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [pathname, enviarHeartbeat])

  // Page views automáticos (track já valida consentimento).
  useEffect(() => {
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
