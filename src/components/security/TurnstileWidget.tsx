'use client'

// Widget do Cloudflare Turnstile (render explícito e robusto).
//
// DEGRADAÇÃO GRACIOSA: se NEXT_PUBLIC_TURNSTILE_SITE_KEY não estiver definida,
// o componente NÃO renderiza nada e o fluxo segue normal (o servidor também
// pula a verificação quando o secret está ausente).
//
// Robustez (correção do bug de não-renderização):
//   1. O api.js é carregado UMA vez via Promise compartilhada — resolve mesmo se
//      o script já estava no DOM/carregado (evita a corrida do 'load' perdido).
//   2. NÃO usa turnstile.ready() — em produção o callback do ready() não dispara
//      em alguns cenários. Assim que o load resolve (window.turnstile existe),
//      chamamos turnstile.render() DIRETO. widgetId guarda contra render duplo.
//   3. O container (ref) tem LARGURA + altura explícitas — o widget Managed
//      (~300px) não monta o iframe se o container não tiver largura definida.
//
// Use TURNSTILE_ENABLED para gatear o submit; use a ref (TurnstileHandle.reset)
// para forçar novo desafio quando o token foi consumido (ex.: senha errada).

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** true quando o Turnstile está configurado no front (site key presente). */
export const TURNSTILE_ENABLED = Boolean(SITE_KEY)

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    turnstile?: any
  }
}

// Carrega o api.js uma única vez. Resolve quando window.turnstile existe —
// inclusive se o script já estava presente e já tinha terminado de carregar.
let scriptPromise: Promise<void> | null = null
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (window.turnstile) return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('turnstile: falha ao carregar api.js')))
      return
    }
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('turnstile: falha ao carregar api.js'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export interface TurnstileHandle {
  /** Reseta o widget e dispara um novo desafio (limpa o token anterior). */
  reset: () => void
}

interface Props {
  onVerify: (token: string) => void
  className?: string
}

const TurnstileWidget = forwardRef<TurnstileHandle, Props>(function TurnstileWidget(
  { onVerify, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  // Mantém o callback sempre atual sem re-disparar o efeito (evita re-render).
  const cbRef = useRef(onVerify)
  cbRef.current = onVerify

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current != null && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch {
          /* ignora */
        }
        cbRef.current('') // token antigo deixa de ser válido até resolver de novo
      }
    },
  }))

  useEffect(() => {
    if (!SITE_KEY) return // sem site key → não renderiza (degradação graciosa)
    let cancelled = false

    loadTurnstileScript()
      .then(() => {
        // Render DIRETO (sem turnstile.ready) assim que a API existe e o
        // container está montado. widgetId evita render duplo.
        if (cancelled || !window.turnstile || !containerRef.current) return
        if (widgetIdRef.current != null) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => cbRef.current(token),
          'error-callback': () => cbRef.current(''),
          'expired-callback': () => cbRef.current(''),
          'timeout-callback': () => cbRef.current(''),
        })
      })
      .catch(() => {
        // Script não carregou: sem token. O servidor degrada (pula se o secret
        // estiver ausente); se o secret existir, o submit fica bloqueado de
        // propósito até o desafio carregar.
        console.error('[turnstile] api.js não carregou')
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current != null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignora */
        }
        widgetIdRef.current = null
      }
    }
  }, [])

  if (!SITE_KEY) return null
  // LARGURA explícita (~300px) é obrigatória: sem ela o iframe Managed não monta.
  // maxWidth:100% evita estouro em telas estreitas; margin auto centraliza.
  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: 300, maxWidth: '100%', minHeight: 65, marginInline: 'auto' }}
    />
  )
})

export default TurnstileWidget
