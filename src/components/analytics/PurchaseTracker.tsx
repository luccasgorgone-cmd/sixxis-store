'use client'

import { useEffect } from 'react'
import { trackPurchase, type ProdutoTracking } from '@/lib/analytics/events'

interface Props {
  transactionId: string
  items: ProdutoTracking[]
  total: number
  frete: number
  coupon?: string
}

export default function PurchaseTracker({ transactionId, items, total, frete, coupon }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = `purchase_${transactionId}`
    if (sessionStorage.getItem(key)) return
    trackPurchase(transactionId, items, total, frete, coupon)
    sessionStorage.setItem(key, '1')
  }, [transactionId])

  return null
}
