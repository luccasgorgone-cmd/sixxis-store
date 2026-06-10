'use client'

// Widget do Cloudflare Turnstile (render explícito).
//
// DEGRADAÇÃO GRACIOSA: se NEXT_PUBLIC_TURNSTILE_SITE_KEY não estiver definida,
// o componente NÃO renderiza nada e o fluxo segue normal (o servidor também
// pula a verificação quando o secret está ausente).
//
// Use TURNSTILE_ENABLED para decidir se o submit deve aguardar o token.
// Use a ref (TurnstileHandle.reset) para forçar um novo desafio — útil ao
// reenviar um formulário cujo token já foi consumido (ex.: senha errada).

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** true quando o Turnstile está configurado no front (site key presente). */
export const TURNSTILE_ENABLED = Boolean(SITE_KEY)

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    turnstile?: any
  }
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
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch {
          /* ignora */
        }
      }
    },
  }))

  useEffect(() => {
    if (!SITE_KEY) return // sem site key → não renderiza
    let cancelled = false

    function render() {
      if (cancelled || !containerRef.current || !window.turnstile) return
      if (widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => cbRef.current(token),
        'error-callback': () => cbRef.current(''),
        'expired-callback': () => cbRef.current(''),
      })
    }

    if (window.turnstile) {
      render()
    } else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
      if (!script) {
        script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.setAttribute('data-turnstile', 'true')
        document.head.appendChild(script)
      }
      script.addEventListener('load', render)
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
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
  return <div ref={containerRef} className={className} />
})

export default TurnstileWidget
