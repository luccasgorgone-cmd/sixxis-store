// ─── g:id do feed (Google Merchant) = content_ids do Meta / item_id do GA4 ────
// FONTE ÚNICA do id que identifica um produto para os catálogos externos.
//
// O feed (merchant-feed.xml), o Meta Pixel/CAPI (content_ids) e o GA4 (item_id)
// PRECISAM enviar exatamente este mesmo id. Se divergirem, a taxa de
// correspondência do catálogo cai a 0% — foi o que aconteceu quando o site
// mandava o CUID interno do banco (ex.: cmnzk1f0m005ilohxic32vl9s), que não
// existe no catálogo (g:id é ASPIRA-BRAVO, CLIM-SX070-TREND, CLI-SX040A-R-110…).
//
// Regras (idênticas às do merchant-feed.xml/route.ts):
//  • Produto com variação PRECIFICADA (preço próprio) → 1 item por variação no
//    feed, g:id = SKU da variação.
//  • Caso contrário (item único; voltagem 110/220V não muda preço) →
//    g:id = sku ?? slug do produto.

export type ProdutoFeedId = { sku?: string | null; slug: string }
// preco é só testado por `!= null` (número, string ou Prisma.Decimal) → unknown.
export type VariacaoFeedId = { sku?: string | null; preco?: unknown }

// g:id do item ÚNICO de um produto (sem variação precificada): sku ?? slug.
export function feedIdProduto(p: ProdutoFeedId): string {
  const sku = p.sku?.trim()
  return sku ? sku : p.slug
}

// Um produto vira itens POR VARIAÇÃO no feed quando ALGUMA variação tem preço
// próprio (preco != null). Nesse caso todas as variações viram itens (g:id = SKU
// da variação); voltagem sem preço próprio cai no item único do produto.
export function temVariacaoPrecificada(
  variacoes?: readonly VariacaoFeedId[] | null,
): boolean {
  return !!variacoes?.some((v) => v.preco != null)
}

// g:id resolvido para um contexto de tracking (ViewContent/AddToCart/Purchase…).
// Usa o SKU da variação quando o produto é vendido por variação precificada;
// senão cai no item único (sku ?? slug). `variacoes` é a lista completa do
// produto — quando fornecida, decide o caso "produto tem variação precificada"
// mesmo que a variação selecionada em si não tenha preço próprio.
export function feedId(
  p: ProdutoFeedId,
  variacao?: VariacaoFeedId | null,
  variacoes?: readonly VariacaoFeedId[] | null,
): string {
  const skuVar = variacao?.sku?.trim()
  if (skuVar && (variacao?.preco != null || temVariacaoPrecificada(variacoes))) {
    return skuVar
  }
  return feedIdProduto(p)
}
