'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  META_PIXEL_ID,
  criarSincronizadorPixel,
  observarConsentimentoPixel,
  trackMetaPageView,
} from '@/lib/analytics/meta-pixel'

// Lado client do Meta Pixel:
//  1. PageView nas TROCAS DE ROTA (App Router não recarrega a página, então o
//     PageView do snippet base só conta o 1º load).
//  2. Sincroniza o consentimento ao vivo: quando o visitante aceita/recusa
//     marketing no banner (CONSENT_EVENT) ou volta a esta aba, concede/revoga no
//     fbq — espelhando o gtag('consent','update') que o CookieBanner faz pro Google.
export default function MetaPixelRouter() {
  const pathname = usePathname()
  const primeiraRota = useRef(true)

  // Consentimento ao vivo (aceite/recusa nesta aba ou em outra).
  useEffect(() => {
    if (!META_PIXEL_ID) return
    const sync = criarSincronizadorPixel()
    sync()
    return observarConsentimentoPixel(sync)
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
