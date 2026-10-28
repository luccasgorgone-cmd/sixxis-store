import { describe, it, expect } from 'vitest'
import {
  parseProdutoIds,
  cuponsAplicaveisAoProduto,
  beneficioCupomTexto,
  type CupomEscopo,
} from './cupom-pdp'

function cupom(over: Partial<CupomEscopo> = {}): CupomEscopo {
  return {
    codigo: '10OFFTREND',
    tipo: 'PERCENTUAL',
    valor: 10,
    descricao: null,
    produtoIds: 'prod_trend',
    usoMaximo: null,
    totalUsos: 0,
    ...over,
  }
}

describe('parseProdutoIds', () => {
  it('nulo/vazio => lista vazia', () => {
    expect(parseProdutoIds(null)).toEqual([])
    expect(parseProdutoIds(undefined)).toEqual([])
    expect(parseProdutoIds('')).toEqual([])
    expect(parseProdutoIds('  ,  ')).toEqual([])
  })

  it('separa CSV e tira espaços', () => {
    expect(parseProdutoIds('a, b ,c')).toEqual(['a', 'b', 'c'])
  })
})

describe('cuponsAplicaveisAoProduto', () => {
  it('inclui cupom cujo escopo contém o produto', () => {
    const out = cuponsAplicaveisAoProduto([cupom()], 'prod_trend')
    expect(out).toHaveLength(1)
    expect(out[0].codigo).toBe('10OFFTREND')
  })

  it('exclui cupom de outro produto', () => {
    const out = cuponsAplicaveisAoProduto([cupom({ produtoIds: 'prod_outro' })], 'prod_trend')
    expect(out).toHaveLength(0)
  })

  it('membership é EXATA, não substring (id prefixo não casa)', () => {
    const out = cuponsAplicaveisAoProduto([cupom({ produtoIds: 'prod_trend_v2' })], 'prod_trend')
    expect(out).toHaveLength(0)
  })

  it('casa um id no meio de um CSV multi-produto', () => {
    const out = cuponsAplicaveisAoProduto([cupom({ produtoIds: 'a,prod_trend,b' })], 'prod_trend')
    expect(out).toHaveLength(1)
  })

  it('exclui cupom esgotado (totalUsos >= usoMaximo)', () => {
    const out = cuponsAplicaveisAoProduto([cupom({ usoMaximo: 5, totalUsos: 5 })], 'prod_trend')
    expect(out).toHaveLength(0)
  })

  it('inclui cupom ainda com usos disponíveis', () => {
    const out = cuponsAplicaveisAoProduto([cupom({ usoMaximo: 5, totalUsos: 4 })], 'prod_trend')
    expect(out).toHaveLength(1)
  })

  it('cupom de carrinho inteiro (produtoIds vazio) NÃO aparece na PDP', () => {
    const out = cuponsAplicaveisAoProduto([cupom({ produtoIds: '' })], 'prod_trend')
    expect(out).toHaveLength(0)
  })

  it('projeta só os campos de vitrine (sem produtoIds/usoMaximo)', () => {
    const [c] = cuponsAplicaveisAoProduto([cupom({ descricao: 'Exclusivo Trend' })], 'prod_trend')
    expect(c).toEqual({ codigo: '10OFFTREND', tipo: 'PERCENTUAL', valor: 10, descricao: 'Exclusivo Trend' })
  })
})

describe('beneficioCupomTexto', () => {
  it('percentual inteiro sem casas', () => {
    expect(beneficioCupomTexto({ tipo: 'PERCENTUAL', valor: 10 })).toBe('10% OFF')
  })

  it('percentual fracionado com vírgula pt-BR', () => {
    expect(beneficioCupomTexto({ tipo: 'PERCENTUAL', valor: 7.5 })).toBe('7,50% OFF')
  })

  it('valor fixo em reais', () => {
    expect(beneficioCupomTexto({ tipo: 'VALOR_FIXO', valor: 50 })).toBe('R$ 50,00 OFF')
  })

  it('frete grátis', () => {
    expect(beneficioCupomTexto({ tipo: 'FRETE_GRATIS', valor: 0 })).toBe('Frete grátis')
  })
})
