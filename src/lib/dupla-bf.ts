import { calcularPromoServidor } from './promo-segunda-unidade'
import { precoPix } from './preco-pix'

export interface ItemDupla {
  id: string
  preco: number
  sku?: string | null
  slug?: string | null
}

export interface SimulacaoDupla {
  desconto: number
  totalCartao: number
  totalPix: number
}

// Exibição da dupla usando a mesma regra do pedido. Valores antes do frete.
export function simularDupla(a: ItemDupla, b: ItemDupla, agora: Date = new Date()): SimulacaoDupla | null {
  const promo = calcularPromoServidor(
    [a, b].map((item) => ({
      erpProdutoId: item.id,
      precoUnitario: item.preco,
      quantidade: 1,
      sku: item.sku,
      slug: item.slug,
    })),
    agora,
  )
  if (!promo.ativo) return null
  const totalCartao = Math.round((a.preco + b.preco - promo.desconto) * 100) / 100
  return { desconto: promo.desconto, totalCartao, totalPix: precoPix(totalCartao) }
}
