import type { ItemCarrinho } from '@/hooks/useCarrinho'

// Modelo de item da página /carrinho e a conversão de/para o store do carrinho
// (Zustand persist em localStorage 'sixxis-carrinho', fonte única do drawer e do
// checkout). A ida e volta NÃO pode perder campos: sem `variacaoId` o pedido sai
// sem voltagem/cor (o /api/pedidos recusa) e sem `feedId` a promo "2ª unidade"
// não reconhece o produto excluído (SX200 Prime) e mostra desconto que o
// servidor não dá.
export interface CarrinhoItem {
  id: string
  produtoId?: string
  nome: string
  slug: string
  // g:id do feed (sku ?? slug, ou SKU da variação precificada) — casa a promo.
  feedId?: string
  preco: number
  precoPromocional?: number
  imagem?: string
  variacaoId?: string
  variacao?: string
  quantidade: number
}

// Normaliza item do formato Zustand persist → CarrinhoItem
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeZustandItem(i: any): CarrinhoItem {
  const idBase = String(i.produtoId || i.id || '')
  const varSuffix = i.variacaoId ? `-${i.variacaoId}` : ''
  return {
    id: (i.id && !i.produtoId) ? i.id : idBase + varSuffix,
    produtoId: i.produtoId || i.id,
    nome: i.nome || '',
    slug: i.slug || i.produtoId || i.id || '',
    feedId: i.feedId,
    preco: i.precoOriginal ?? i.preco ?? 0,
    precoPromocional: i.precoOriginal ? (i.preco ?? undefined) : i.precoPromocional,
    imagem: i.imagem,
    variacaoId: i.variacaoId || undefined,
    variacao: i.variacaoNome || i.variacaoId || i.variacao,
    quantidade: i.quantidade ?? 1,
  }
}

// Converte CarrinhoItem → item do store (mesmos campos que adicionarItem grava).
export function toZustandItem(i: CarrinhoItem): ItemCarrinho {
  return {
    produtoId: i.produtoId || i.id,
    nome: i.nome,
    preco: i.precoPromocional ?? i.preco,
    quantidade: i.quantidade,
    imagem: i.imagem,
    ...(i.variacaoId && { variacaoId: i.variacaoId }),
    ...(i.variacao && { variacaoNome: i.variacao }),
    ...(i.feedId && { feedId: i.feedId }),
  }
}
