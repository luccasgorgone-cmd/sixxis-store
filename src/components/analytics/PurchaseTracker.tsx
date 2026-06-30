'use client'

import { useEffect } from 'react'
import { trackPurchase, type ProdutoTracking } from '@/lib/analytics/events'
import { initMetaAdvancedMatching, type MetaAdvancedMatching } from '@/lib/analytics/meta-pixel'

interface Props {
  transactionId: string
  items: ProdutoTracking[]
  total: number
  frete: number
  coupon?: string
  // Dados do cliente DESTE pedido (próprios, página autenticada) para Advanced
  // Matching — enriquecem o Purchase do browser. Normalizados + hasheados pela
  // lib da Meta; o CAPI usa os mesmos campos (hash server-side) com o MESMO
  // event_id → dedupe browser↔servidor.
  advancedMatching?: MetaAdvancedMatching
}

export default function PurchaseTracker({ transactionId, items, total, frete, coupon, advancedMatching }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = `purchase_${transactionId}`
    if (sessionStorage.getItem(key)) return
    // Enriquece o Pixel ANTES do Purchase, p/ o evento sair com matching.
    if (advancedMatching) initMetaAdvancedMatching(advancedMatching)
    trackPurchase(transactionId, items, total, frete, coupon)
    sessionStorage.setItem(key, '1')
  }, [transactionId])

  return null
}
