'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  META_PIXEL_ID,
  criarSincronizadorPixel,
  observarConsentimentoPixel,
  deveEnviarPageViewDeRota,
  trackMetaPageView,
} from '@/lib/analytics/meta-pixel'

// Lado client do Meta Pixel:
//  1. PageView nas TROCAS DE URL (App Router não recarrega a página, então o
//     PageView do snippet base só conta o 1º load). É o ÚNICO PageView de rota:
//     o gancho automático do fbevents está desligado (fbq.disablePushState).
//  2. Sincroniza o consentimento ao vivo: quando o visitante aceita/recusa
//     marketing no banner (CONSENT_EVENT) ou volta a esta aba, concede/revoga no
//     fbq — espelhando o gtag('consent','update') que o CookieBanner faz pro Google.
export default function MetaPixelRouter() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams?.toString() ?? ''
  const url = query ? `${pathname}?${query}` : pathname
  // Última URL já contada. Começa null: a 1ª rota é a do load, cujo PageView
  // sai pelo código base (ou pelo sincronizador no aceite tardio).
  const ultimaUrl = useRef<string | null>(null)

  // Consentimento ao vivo (aceite/recusa nesta aba ou em outra).
  useEffect(() => {
    if (!META_PIXEL_ID) return
    const sync = criarSincronizadorPixel()
    sync()
    return observarConsentimentoPixel(sync)
  }, [])

  // PageView por troca de URL (pathname ou querystring, como o fbevents contava
  // antes do disablePushState). Comparar com a última URL, e não usar uma flag de
  // "primeira rota", evita o PageView extra do efeito duplo do StrictMode.
  useEffect(() => {
    if (!META_PIXEL_ID) return
    const enviar = deveEnviarPageViewDeRota(ultimaUrl.current, url)
    ultimaUrl.current = url
    if (enviar) trackMetaPageView()
  }, [url])

  return null
}
