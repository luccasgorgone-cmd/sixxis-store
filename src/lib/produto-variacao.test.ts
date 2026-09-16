import { describe, expect, it } from 'vitest'
import { encontrarVariacaoPorSku, estoqueDisponivel, urlProdutoComVariacao } from './produto-variacao'

const variacoes = [
  { sku: 'SX200 Branco', ativo: true, preco: 8500 },
  { sku: 'SX200 Preto', ativo: true, preco: 9250 },
  { sku: 'SX200 Inativo', ativo: false, preco: 1 },
]

describe('deep-link de variante', () => {
  it('gera URL inequívoca e resolve somente variante ativa', () => {
    const url = urlProdutoComVariacao('https://www.sixxis.com.br', 'sx200-prime', 'SX200 Preto')

    expect(url).toBe('https://www.sixxis.com.br/produtos/sx200-prime?variante=SX200+Preto')
    expect(encontrarVariacaoPorSku(variacoes, 'SX200 Preto')?.preco).toBe(9250)
    expect(encontrarVariacaoPorSku(variacoes, 'SX200 Inativo')).toBeNull()
    expect(encontrarVariacaoPorSku(variacoes, ['SX200 Preto'])).toBeNull()
  })

  it('trata estoque zerado ou negativo como indisponível', () => {
    expect(estoqueDisponivel(1)).toBe(true)
    expect(estoqueDisponivel(0)).toBe(false)
    expect(estoqueDisponivel(-20)).toBe(false)
  })
})
