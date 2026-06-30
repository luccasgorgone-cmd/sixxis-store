'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { marketingConsentido, CONSENT_EVENT } from '@/lib/consent'
import { initMetaAdvancedMatching } from '@/lib/analytics/meta-pixel'

// Enriquece o Meta Pixel com Advanced Matching para o cliente LOGADO, em todo o
// site. Busca o perfil server-authoritative (/api/conta/perfil — resolve a
// sessão por cookie httpOnly) e re-chama fbq('init', ID, {...}); re-init só
// atualiza a config de matching, sem re-disparar PageView. Respeita o gate de
// marketing e re-tenta quando o consentimento é concedido ao vivo.
//
// Cobre o caso "cliente conhecido" fora do checkout (catálogo, produto, conta).
// No checkout/sucesso o enriquecimento é reforçado com endereço (ct/st/zp).
export default function MetaAdvancedMatching() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return
    let cancelled = false
    const externalId = session.user.id

    const enriquecer = async () => {
      if (cancelled || !marketingConsentido()) return
      try {
        const r = await fetch('/api/conta/perfil', { cache: 'no-store' })
        if (!r.ok || cancelled) return
        const { cliente } = (await r.json()) as {
          cliente?: { nome?: string | null; email?: string | null; telefone?: string | null }
        }
        if (!cliente || cancelled) return
        initMetaAdvancedMatching({
          email:      cliente.email,
          telefone:   cliente.telefone,
          nome:       cliente.nome,
          country:    'br',
          externalId,
        })
      } catch {
        /* best-effort: matching é melhoria, nunca quebra a navegação */
      }
    }

    enriquecer()
    // Aceite de marketing ao vivo → enriquece então (no load estava sem opt-in).
    const onConsent = () => enriquecer()
    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => {
      cancelled = true
      window.removeEventListener(CONSENT_EVENT, onConsent)
    }
  }, [status, session?.user?.id])

  return null
}
