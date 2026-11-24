import { describe, expect, it } from 'vitest'
import { normalizeZustandItem, toZustandItem } from './carrinho-pagina'
import { calcularPromoCliente, PROMO_BF } from './promo-segunda-unidade'

// Item como o PDP grava no store (InfoProdutoCB.handleAddToCart).
const itemStore = {
  produtoId: 'p-sx200-prime',
  nome: 'SX200 Prime',
  preco: 8600,
  quantidade: 1,
  imagem: '/img.webp',
  variacaoId: 'v-branco',
  variacaoNome: 'Branco',
  feedId: 'CLIM-SX200-PRIME-Branco',
}

describe('/carrinho ↔ store: ida e volta sem perder campos', () => {
  it('alterar quantidade na página preserva variacaoId, variacaoNome e feedId', () => {
    const naPagina = normalizeZustandItem(itemStore)
    const devolvido = toZustandItem({ ...naPagina, quantidade: 2 })
    expect(devolvido).toEqual({ ...itemStore, quantidade: 2 })
  })

  it('item sem variação não ganha campos vazios', () => {
    const simples = { produtoId: 'p-asp', nome: 'Aspirador', preco: 450, quantidade: 1, feedId: 'ASPIRA-BRAVO' }
    expect(toZustandItem(normalizeZustandItem(simples))).toEqual(simples)
  })

  it('depois do "+" na página, 2× SX200 Prime continua sem desconto da 2ª unidade', () => {
    const DENTRO = new Date('2026-11-28T12:00:00-03:00')
    const ativaOrig = PROMO_BF.ativa
    PROMO_BF.ativa = true
    try {
      const it2 = toZustandItem({ ...normalizeZustandItem(itemStore), quantidade: 2 })
      const r = calcularPromoCliente([{ feedId: it2.feedId, preco: it2.preco, quantidade: it2.quantidade }], DENTRO)
      expect(r.ativo).toBe(false)
    } finally {
      PROMO_BF.ativa = ativaOrig
    }
  })
})
