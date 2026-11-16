'use client'

import { useSyncExternalStore, type AnchorHTMLAttributes } from 'react'
import { CONSENT_EVENT } from '@/lib/consent'
import { lerGclidClient, montarLinkWhatsApp } from '@/lib/analytics/gclid-whatsapp'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  telefone: string
  texto: string
}

function assinar(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}

  // Ao aceitar analytics, o TrackingProvider persiste o gclid no sessionStorage
  // durante o mesmo evento. A microtask garante que lemos depois desse listener.
  const atualizarDepoisDoConsentimento = () => queueMicrotask(onStoreChange)
  window.addEventListener(CONSENT_EVENT, atualizarDepoisDoConsentimento)
  window.addEventListener('popstate', onStoreChange)
  return () => {
    window.removeEventListener(CONSENT_EVENT, atualizarDepoisDoConsentimento)
    window.removeEventListener('popstate', onStoreChange)
  }
}

export default function WhatsAppTrackedLink({ telefone, texto, ...props }: Props) {
  const gclid = useSyncExternalStore(assinar, lerGclidClient, () => undefined)
  const href = montarLinkWhatsApp(telefone, texto, gclid)

  return <a {...props} href={href} />
}
