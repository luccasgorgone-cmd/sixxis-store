'use client'

import type { ItemCarrinho } from '@/hooks/useCarrinho'

// Etapas do funil (carrinho → pagamento). A mesma escala usada em
// CarrinhoCliente.etapaAtual e no painel admin de carrinhos abandonados.
export const ETAPA = {
  CARRINHO:      1,
  IDENTIFICACAO: 2,
  ENDERECO:      3,
  FRETE:         4,
  PAGAMENTO:     5,
} as const

export const ETAPA_LABEL: Record<number, string> = {
  1: 'Carrinho',
  2: 'Identificação',
  3: 'Endereço',
  4: 'Frete',
  5: 'Pagamento',
}

function toPayload(itens: ItemCarrinho[]) {
  return itens.map((i) => ({
    produtoId: i.produtoId,
    nome:      i.nome,
    variacao:  i.variacaoNome ?? null,
    qtd:       i.quantidade,
    preco:     i.preco,
  }))
}

// Espelha o carrinho do cliente LOGADO no servidor (fire-and-forget). O servidor
// faz no-op para visitantes sem sessão, então é seguro chamar sempre — mas os
// callers já evitam a chamada quando não há sessão pra poupar request.
export function syncCarrinhoCliente(itens: ItemCarrinho[], etapa?: number) {
  if (typeof window === 'undefined') return
  fetch('/api/carrinho-cliente', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ itens: toPayload(itens), etapa }),
  }).catch(() => {})
}
