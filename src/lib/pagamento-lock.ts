// Lock anti-corrida do fluxo de criação de pagamento (ver
// api/checkout/criar-pagamento/route.ts): evita que 2 chamadas concorrentes
// pro MESMO pedido (duplo clique, 2 abas, retry de rede) gerem 2 cobranças
// aprovadas de verdade no Mercado Pago. Efêmero — expira sozinho depois de
// LOCK_PAGAMENTO_STALE_MS caso o processo trave no meio do caminho, pra nunca
// bloquear um retry legítimo depois de uma falha.
export const LOCK_PAGAMENTO_STALE_MS = 60_000

/** Instante a partir do qual um lock existente é considerado expirado (stale). */
export function cutoffLockPagamento(agora: Date): Date {
  return new Date(agora.getTime() - LOCK_PAGAMENTO_STALE_MS)
}
