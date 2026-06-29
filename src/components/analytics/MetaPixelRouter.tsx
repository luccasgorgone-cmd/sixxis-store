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
  // PageView inicial já saiu? O snippet base dispara o PageView no load APENAS se
  // já havia consentimento. Sem consentimento no load, o PageView é responsabilidade
  // deste componente, disparado explicitamente na 1ª concessão (sem confiar no buffer).
  const pageViewInicial = useRef(false)

  // Consentimento ao vivo (aceite/recusa dentro da mesma navegação).
  useEffect(() => {
    if (!META_PIXEL_ID) return
    // Já consentido no load → o snippet base já contou o PageView inicial.
    if (marketingConsentido()) pageViewInicial.current = true

    const sync = () => {
      if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
      if (marketingConsentido()) {
        window.fbq('consent', 'grant')
        // 1ª concessão ao vivo (estava 'revoke' no load): dispara o PageView
        // explicitamente, uma única vez. Não dependemos do replay do buffer.
        if (!pageViewInicial.current) {
          pageViewInicial.current = true
          trackMetaPageView()
        }
      } else {
        window.fbq('consent', 'revoke')
      }
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
