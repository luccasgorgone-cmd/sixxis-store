'use client'

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export type ProdutoTracking = {
  item_id: string
  item_name: string
  item_category?: string
  item_brand?: string
  price: number
  quantity?: number
  variant?: string
}

function push(event: string, ecommerce: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event, ecommerce })
}

export function trackViewItem(produto: ProdutoTracking) {
  push('view_item', {
    currency: 'BRL',
    value: produto.price,
    items: [produto],
  })
}

export function trackAddToCart(produto: ProdutoTracking) {
  const item = { ...produto, quantity: produto.quantity || 1 }
  push('add_to_cart', {
    currency: 'BRL',
    value: item.price * item.quantity,
    items: [item],
  })
}

export function trackBeginCheckout(items: ProdutoTracking[], total: number, coupon?: string) {
  push('begin_checkout', {
    currency: 'BRL',
    value: total,
    coupon,
    items,
  })
}

export function trackAddPaymentInfo(
  items: ProdutoTracking[],
  total: number,
  payment_type: string,
  coupon?: string,
) {
  push('add_payment_info', {
    currency: 'BRL',
    value: total,
    payment_type,
    coupon,
    items,
  })
}

export function trackPurchase(
  transactionId: string,
  items: ProdutoTracking[],
  total: number,
  frete: number,
  coupon?: string,
) {
  push('purchase', {
    transaction_id: transactionId,
    currency: 'BRL',
    value: total,
    shipping: frete,
    coupon,
    items,
  })
}
