export const VARIANTE_QUERY_PARAM = 'variante'

export type VariacaoPorSku = {
  sku: string
  ativo: boolean
}

export function encontrarVariacaoPorSku<T extends VariacaoPorSku>(
  variacoes: readonly T[],
  sku: string | string[] | undefined,
): T | null {
  if (typeof sku !== 'string' || !sku) return null
  return variacoes.find((variacao) => variacao.ativo && variacao.sku === sku) ?? null
}

export function urlProdutoComVariacao(siteUrl: string, slug: string, sku: string): string {
  const url = new URL(`/produtos/${slug}`, siteUrl)
  url.searchParams.set(VARIANTE_QUERY_PARAM, sku)
  return url.toString()
}

export function estoqueDisponivel(estoque: number): boolean {
  return estoque > 0
}
