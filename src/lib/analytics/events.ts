'use client'

import { analyticsConsentido } from '@/lib/consent'
import { obterSidClient } from '@/lib/tracking'

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export type ProdutoTracking = {
  item_id: string
  item_slug?: string
  item_name: string
  item_category?: string
  item_brand?: string
  price: number
  quantity?: number
  variant?: string
}

function push(event: string, ecommerce: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  // (4) Só empurra evento de e-commerce ao dataLayer com consentimento de analytics.
  if (!analyticsConsentido()) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event, ecommerce })
}

// Pipeline interno (Sistema A): o MESMO evento que vai ao dataLayer também grava
// em EventoTracking via /api/tracking, com o cookie sixxis_sid e o mesmo gate
// LGPD (sixxis_consent). Sem consentimento analítico, não envia.
function enviarInterno(
  tipo: string,
  payload: { produtoId?: string; produtoSlug?: string; valor?: number; dados?: Record<string, unknown> } = {},
) {
  if (typeof window === 'undefined') return
  if (!analyticsConsentido()) return
  const sessaoId = obterSidClient()
  if (!sessaoId) return
  fetch('/api/tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      tipo,
      sessaoId,
      pagina: window.location.href,
      produtoId: payload.produtoId,
      produtoSlug: payload.produtoSlug,
      valor: payload.valor,
      dados: payload.dados,
    }),
  }).catch(() => {})
}

export function trackViewItem(produto: ProdutoTracking) {
  push('view_item', {
    currency: 'BRL',
    value: produto.price,
    items: [produto],
  })
  enviarInterno('view_item', {
    produtoId: produto.item_id,
    produtoSlug: produto.item_slug,
    valor: produto.price,
    dados: { item_name: produto.item_name, item_category: produto.item_category, variant: produto.variant },
  })
}

export function trackAddToCart(produto: ProdutoTracking) {
  const item = { ...produto, quantity: produto.quantity || 1 }
  push('add_to_cart', {
    currency: 'BRL',
    value: item.price * item.quantity,
    items: [item],
  })
  enviarInterno('add_to_cart', {
    produtoId: item.item_id,
    produtoSlug: item.item_slug,
    valor: item.price * item.quantity,
    dados: {
      item_name: item.item_name,
      item_category: item.item_category,
      quantity: item.quantity,
      variant: item.variant,
      price: item.price,
    },
  })
}

export function trackBeginCheckout(items: ProdutoTracking[], total: number, coupon?: string) {
  push('begin_checkout', {
    currency: 'BRL',
    value: total,
    coupon,
    items,
  })
  enviarInterno('begin_checkout', {
    valor: total,
    dados: { coupon, itens: items.map(i => ({ id: i.item_id, nome: i.item_name, qtd: i.quantity ?? 1, preco: i.price })) },
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
  enviarInterno('add_payment_info', {
    valor: total,
    dados: { payment_type, coupon },
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
  enviarInterno('purchase', {
    valor: total,
    dados: {
      transaction_id: transactionId,
      shipping: frete,
      coupon,
      itens: items.map(i => ({ id: i.item_id, nome: i.item_name, qtd: i.quantity ?? 1, preco: i.price })),
    },
  })
}

// Busca: GA4 'search' (search_term) + interno (EventoTracking tipo='search').
export function trackSearch(termo: string) {
  const t = termo.trim()
  if (!t) return
  if (typeof window !== 'undefined' && analyticsConsentido()) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'search', search_term: t })
  }
  enviarInterno('search', { dados: { termo: t } })
}
