interface PedidoParaTotal {
  frete: unknown
  desconto: unknown
  cashbackUsado: unknown
  itens: { precoUnitario: unknown; quantidade: number }[]
  garantias: { valorPago: unknown }[]
}

/**
 * Recalcula o total BASE do pedido (sem o desconto à vista do PIX) a partir
 * dos seus componentes. NUNCA confia em `pedido.total`: esse campo reflete a
 * ÚLTIMA tentativa de pagamento (pode ter o desconto PIX de uma tentativa
 * anterior arrastado). Extraído de criar-pagamento/route.ts pra ser
 * compartilhado com as rotas de checkout multi-método — mesma fonte de
 * verdade, evita as duas divergirem no cálculo do que é realmente cobrado.
 */
export function calcularTotalBaseReais(pedido: PedidoParaTotal): number {
  const subtotalItens = pedido.itens.reduce(
    (s, i) => s + Number(i.precoUnitario) * i.quantidade,
    0,
  )
  const totalGarantias = pedido.garantias.reduce((s, g) => s + Number(g.valorPago), 0)
  return (
    Math.round(
      Math.max(
        0,
        subtotalItens +
          Number(pedido.frete) +
          totalGarantias -
          Number(pedido.desconto) -
          Number(pedido.cashbackUsado),
      ) * 100,
    ) / 100
  )
}
