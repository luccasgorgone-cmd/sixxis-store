// Fonte ÚNICA do desconto à vista no PIX.
//
// Antes deste módulo o fator estava hardcoded (`* 0.97`) em 8 arquivos de
// exibição, e o valor REALMENTE cobrado pelo Mercado Pago ignorava o desconto:
// o cliente via "no PIX" no carrinho e o QR Code cobrava o total cheio. Agora
// tanto a vitrine quanto `transaction_amount` derivam daqui.
//
// O desconto incide sobre o TOTAL já com cupom/cashback/frete — cupom e PIX
// acumulam, nessa ordem (cupom reduz o subtotal; o PIX reduz o total final).

/** Percentual do desconto à vista no PIX (0.05 = 5%). */
export const DESCONTO_PIX = 0.05

/** Fator multiplicativo equivalente (0.95). Derivado — nunca hardcodar. */
export const FATOR_PIX = 1 - DESCONTO_PIX

/** "5" — para interpolar em textos ("{PCT}% OFF no PIX"). */
export const DESCONTO_PIX_PCT = Math.round(DESCONTO_PIX * 100)

/**
 * Aplica o desconto PIX e arredonda para centavos (half-up), porque o valor
 * vira `transaction_amount` no Mercado Pago e `Pedido.total` no banco — ambos
 * com 2 casas. Ex.: 2802.50 → 2662.38.
 */
export function precoPix(valor: number): number {
  return Math.round(valor * FATOR_PIX * 100) / 100
}
