// ─── Parcelamento — FONTE ÚNICA DE VERDADE ───────────────────────────────────
// Toda superfície que exibe "Nx sem juros" ou calcula o valor da parcela deve
// importar daqui. Trocar MAX_PARCELAS_SEM_JUROS cascateia para o site inteiro
// (produto, cards, carrinho, checkout, selos, rodapé, e-mails, etc.).
//
// IMPORTANTE: "sem juros até N vezes" depende da CONFIGURAÇÃO da conta Mercado
// Pago (a loja é quem absorve os juros dessas parcelas). Este módulo apenas
// LIMITA (maxInstallments no brick) e EXIBE o número/valor — NÃO altera quem
// paga os juros. Se a conta MP não estiver configurada para N sem juros, o
// cliente ainda pode ser cobrado — a paridade é responsabilidade da conta MP.

export const MAX_PARCELAS_SEM_JUROS = 10

// Valor de cada parcela sem juros = total do CARTÃO ÷ N.
// NÃO usar o preço com desconto PIX aqui: a parcela é sobre o preço do cartão.
export function valorParcela(totalCartao: number): number {
  return totalCartao / MAX_PARCELAS_SEM_JUROS
}
