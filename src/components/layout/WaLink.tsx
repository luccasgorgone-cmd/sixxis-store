'use client'

import { useSyncExternalStore } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { lerGclidClient, montarLinkWhatsApp } from '@/lib/analytics/gclid-whatsapp'

// ════════════════════════════════════════════════════════════════════════════
// WaLink — link wa.me com gclid embutido (lane GOOGLE do Offline Import)
// ════════════════════════════════════════════════════════════════════════════
// Wrapper único e reutilizável pra TODO touchpoint pré-venda que abre WhatsApp.
// Centraliza a mecânica (uma só, não divergente) usada antes só no botão
// flutuante: lê o gclid no client e monta o link via montarLinkWhatsApp, que já
// faz validação anti-injeção + consent-gating (sem gclid → link base intacto).
//
// Lê o gclid via useSyncExternalStore: no server/SSR devolve undefined (link
// base, sem mismatch de hidratação); no client reflete o gclid disponível após
// a hidratação. Snapshot estável (mesma URL/cookie → mesmo valor) → sem loop.
const assinarNoop = () => () => {}
function useGclid(): string | undefined {
  return useSyncExternalStore(assinarNoop, lerGclidClient, () => undefined)
}

interface Props {
  fone: string            // só dígitos, ex. '5518997474701'
  texto: string           // texto base CRU (não encodar; montarLinkWhatsApp encoda)
  className?: string
  style?: CSSProperties
  ariaLabel?: string
  children: ReactNode
}

export default function WaLink({ fone, texto, className, style, ariaLabel, children }: Props) {
  const gclid = useGclid()
  const href = montarLinkWhatsApp(fone, texto, gclid)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  )
}
