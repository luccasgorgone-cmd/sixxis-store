'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { marketingConsentido, CONSENT_EVENT } from '@/lib/consent'
import { META_PIXEL_ID, trackMetaPageView } from '@/lib/analytics/meta-pixel'

// Lado client do Meta Pixel:
//  1. PageView nas TROCAS DE ROTA (App Router não recarrega a página, então o
//     PageView do snippet base só conta o 1º load).
//  2. Sincroniza o consentimento ao vivo: quando o visitante aceita/recusa
//     marketing no banner (CONSENT_EVENT), concede/revoga no fbq — espelhando o
//     gtag('consent','update') que o CookieBanner já faz pro Google.
export default function MetaPixelRouter() {
  const pathname = usePathname()
  const primeiraRota = useRef(true)

  // Consentimento ao vivo (aceite/recusa dentro da mesma navegação).
  useEffect(() => {
    if (!META_PIXEL_ID) return
    const sync = () => {
      if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
      window.fbq('consent', marketingConsentido() ? 'grant' : 'revoke')
    }
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  // PageView por troca de rota — pula o 1º load (o snippet base já disparou).
  useEffect(() => {
    if (!META_PIXEL_ID) return
    if (primeiraRota.current) {
      primeiraRota.current = false
      return
    }
    trackMetaPageView()
  }, [pathname])

  return null
}
