// Lógica do callout de cupom na página de produto (PDP).
//
// Um Cupom pode ser escopado a produtos específicos via `produtoIds` (CSV de
// Produto.id; null/vazio = carrinho inteiro — ver schema). A PDP mostra, como
// callout informativo, os cupons ATIVOS que se aplicam àquele produto. A
// autoridade do desconto é sempre o servidor (/api/pedidos → avaliarCupom);
// isto aqui é só vitrine, por isso vive separado e testável.

/** Cupom como vem do banco (campos relevantes p/ a PDP). */
export interface CupomEscopo {
  codigo: string
  tipo: string // "PERCENTUAL" | "VALOR_FIXO" | "FRETE_GRATIS"
  valor: number
  descricao: string | null
  produtoIds: string | null
  usoMaximo: number | null
  totalUsos: number
}

/** Cupom já filtrado, pronto p/ render no componente. */
export interface CupomProduto {
  codigo: string
  tipo: string
  valor: number
  descricao: string | null
}

/** Parseia o CSV de produtoIds em ids limpos (sem vazios/espaços). */
export function parseProdutoIds(csv: string | null | undefined): string[] {
  return (csv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Dentre `cupons`, retorna os que se aplicam a `produtoId`: escopo contém o id
 * (membership EXATA no CSV — não substring, p/ não casar id que é prefixo de
 * outro) e o cupom não está esgotado (usoMaximo). Cupom de carrinho inteiro
 * (produtoIds vazio) NÃO entra: a PDP só anuncia cupom específico do produto.
 */
export function cuponsAplicaveisAoProduto(
  cupons: CupomEscopo[],
  produtoId: string,
): CupomProduto[] {
  return cupons
    .filter((c) => {
      const ids = parseProdutoIds(c.produtoIds)
      if (!ids.includes(produtoId)) return false
      if (c.usoMaximo != null && c.totalUsos >= c.usoMaximo) return false
      return true
    })
    .map((c) => ({ codigo: c.codigo, tipo: c.tipo, valor: c.valor, descricao: c.descricao }))
}

/** Texto curto do benefício por tipo de cupom (ex.: "10% OFF"). */
export function beneficioCupomTexto(c: Pick<CupomProduto, 'tipo' | 'valor'>): string {
  if (c.tipo === 'FRETE_GRATIS') return 'Frete grátis'
  if (c.tipo === 'VALOR_FIXO') {
    return `R$ ${c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} OFF`
  }
  // PERCENTUAL (default): sem casas quando inteiro (10 → "10%").
  const pct = Number.isInteger(c.valor)
    ? String(c.valor)
    : c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${pct}% OFF`
}
