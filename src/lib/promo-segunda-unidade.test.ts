import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  PROMO_BF,
  promoAtiva,
  promoVigentePorFeedId,
  promoVigentePorErp,
  calcularPromoServidor,
  calcularPromoCliente,
} from './promo-segunda-unidade'

// Snapshot/restore da config (os testes mexem no interruptor e nos hooks).
const ORIG = { ...PROMO_BF, excluir: [...PROMO_BF.excluir] }
function reset() {
  PROMO_BF.ativa = ORIG.ativa
  PROMO_BF.percentual = ORIG.percentual
  PROMO_BF.inicio = ORIG.inicio
  PROMO_BF.fim = ORIG.fim
  PROMO_BF.descricao = ORIG.descricao
  PROMO_BF.excluir = [...ORIG.excluir]
  PROMO_BF.pisoItemDescontado = ORIG.pisoItemDescontado
}
beforeEach(() => {
  reset()
  PROMO_BF.ativa = true // ativa a promo para os testes de cálculo
})
afterEach(reset)

// Dentro da janela padrão (27→30/11/2026, America/Sao_Paulo).
const DENTRO = new Date('2026-11-28T12:00:00-03:00')
const ANTES = new Date('2026-11-20T00:00:00-03:00')
const DEPOIS = new Date('2026-12-01T00:00:01-03:00')

const ERP = 'ADMIN-xyz'
const srv = (preco: number, quantidade: number, extra: Partial<{ sku: string; slug: string; erpProdutoId: string }> = {}) => ({
  erpProdutoId: extra.erpProdutoId ?? ERP, precoUnitario: preco, quantidade, sku: extra.sku ?? null, slug: extra.slug ?? null,
})

describe('interruptor-mestre + janela', () => {
  it('dormente (ativa=false) → nada aplica mesmo dentro da janela', () => {
    PROMO_BF.ativa = false
    expect(promoAtiva(DENTRO)).toBe(false)
    const r = calcularPromoServidor([srv(2000, 2)], DENTRO)
    expect(r.ativo).toBe(false)
    expect(r.desconto).toBe(0)
    expect(promoVigentePorFeedId('qualquer', DENTRO)).toBeNull()
  })
  it('ativa mas ANTES do início → nada', () => {
    const r = calcularPromoServidor([srv(2000, 2)], ANTES)
    expect(r.ativo).toBe(false)
    expect(promoAtiva(ANTES)).toBe(false)
  })
  it('ativa mas DEPOIS do fim → nada', () => {
    const r = calcularPromoServidor([srv(2000, 2)], DEPOIS)
    expect(r.ativo).toBe(false)
    expect(promoAtiva(DEPOIS)).toBe(false)
  })
  it('ativa e dentro da janela → aplica', () => {
    expect(promoAtiva(DENTRO)).toBe(true)
    expect(calcularPromoServidor([srv(2000, 2)], DENTRO).ativo).toBe(true)
  })
})

describe('2 do MESMO produto → 50% na 2ª', () => {
  it('2 un a 2000 → 1 desconto de 1000', () => {
    const r = calcularPromoServidor([srv(2000, 2)], DENTRO)
    expect(r.unidadesComDesconto).toBe(1)
    expect(r.desconto).toBeCloseTo(1000, 2)
  })
  it('linhas separadas do mesmo produto somam', () => {
    const r = calcularPromoServidor([srv(2000, 1), srv(2000, 1)], DENTRO)
    expect(r.unidadesComDesconto).toBe(1)
    expect(r.desconto).toBeCloseTo(1000, 2)
  })
})

describe('2 produtos DIFERENTES → desconto no MAIS BARATO, nunca no mais caro', () => {
  it('2000 + 1500 → desconta 1500 (750), nunca 2000', () => {
    const r = calcularPromoServidor([srv(2000, 1, { sku: 'A' }), srv(1500, 1, { sku: 'B' })], DENTRO)
    expect(r.unidadesComDesconto).toBe(1)
    expect(r.desconto).toBeCloseTo(750, 2) // metade do MAIS BARATO
    expect(r.desconto).not.toBeCloseTo(1000, 2) // NÃO a metade do mais caro
  })
  it('ordem dos itens não importa (barato primeiro)', () => {
    const r = calcularPromoServidor([srv(1500, 1), srv(2000, 1)], DENTRO)
    expect(r.desconto).toBeCloseTo(750, 2)
  })
})

describe('3+ itens / quantidade ímpar → k=floor(N/2), nos k mais baratos', () => {
  it('3 diferentes [1000,1500,2000] → k=1, desconta 1000 (500)', () => {
    const r = calcularPromoServidor([srv(1000, 1), srv(1500, 1), srv(2000, 1)], DENTRO)
    expect(r.unidadesComDesconto).toBe(1)
    expect(r.desconto).toBeCloseTo(500, 2)
  })
  it('4 diferentes [100,200,300,400] → k=2, desconta os 2 mais baratos (100+200)*0.5=150', () => {
    const r = calcularPromoServidor(
      [srv(100, 1), srv(200, 1), srv(300, 1), srv(400, 1)], DENTRO,
    )
    expect(r.unidadesComDesconto).toBe(2)
    expect(r.desconto).toBeCloseTo(150, 2)
  })
  it('5 un do mesmo (2000) → k=2 → 2000', () => {
    const r = calcularPromoServidor([srv(2000, 5)], DENTRO)
    expect(r.unidadesComDesconto).toBe(2)
    expect(r.desconto).toBeCloseTo(2000, 2)
  })
  it('1 unidade → nada', () => {
    const r = calcularPromoServidor([srv(2000, 1)], DENTRO)
    expect(r.ativo).toBe(false)
    expect(r.desconto).toBe(0)
  })
  it('arredonda a 2 casas (1999 → 999.5)', () => {
    const r = calcularPromoServidor([srv(1999, 2)], DENTRO)
    expect(r.desconto).toBeCloseTo(999.5, 2)
  })
})

describe('hook de margem — exclusão de SKU', () => {
  it('2× aspirador excluído (450) → nada (protege margem)', () => {
    PROMO_BF.excluir = ['aspirador']
    const r = calcularPromoServidor([srv(450, 2, { sku: 'aspirador' })], DENTRO)
    expect(r.ativo).toBe(false)
    expect(r.desconto).toBe(0)
  })
  it('[aspirador(excl) + 2× clim 2000] → pool só clim → k=1 → 1000', () => {
    PROMO_BF.excluir = ['aspirador']
    const r = calcularPromoServidor(
      [srv(450, 1, { sku: 'aspirador' }), srv(2000, 2, { sku: 'clim' })], DENTRO,
    )
    expect(r.unidadesComDesconto).toBe(1)
    expect(r.desconto).toBeCloseTo(1000, 2)
  })
  it('[aspirador(excl) + 1 clim] → sem par elegível → nada (não desconta o caro)', () => {
    PROMO_BF.excluir = ['aspirador']
    const r = calcularPromoServidor(
      [srv(450, 1, { sku: 'aspirador' }), srv(2000, 1, { sku: 'clim' })], DENTRO,
    )
    expect(r.ativo).toBe(false)
  })
  it('exclusão casa por slug também', () => {
    PROMO_BF.excluir = ['aspirador-sixxis']
    const r = calcularPromoServidor([srv(450, 2, { slug: 'aspirador-sixxis' })], DENTRO)
    expect(r.ativo).toBe(false)
  })
})

describe('hook de margem — piso de preço', () => {
  it('piso 600: [450, 2000] → pool só 2000 → sem par → nada', () => {
    PROMO_BF.pisoItemDescontado = 600
    const r = calcularPromoServidor([srv(450, 1), srv(2000, 1)], DENTRO)
    expect(r.ativo).toBe(false)
  })
  it('piso 600: [2000, 2000] → ambos acima do piso → 1000', () => {
    PROMO_BF.pisoItemDescontado = 600
    const r = calcularPromoServidor([srv(2000, 2)], DENTRO)
    expect(r.desconto).toBeCloseTo(1000, 2)
  })
})

describe('cliente (exibição) casa por feedId', () => {
  it('2 un mesmo feedId → 1000', () => {
    const r = calcularPromoCliente([{ feedId: 'sx180', preco: 2000, quantidade: 2 }], DENTRO)
    expect(r.ativo).toBe(true)
    expect(r.desconto).toBeCloseTo(1000, 2)
  })
  it('2 produtos diferentes no cliente → mais barato', () => {
    const r = calcularPromoCliente(
      [{ feedId: 'a', preco: 2000, quantidade: 1 }, { feedId: 'b', preco: 1200, quantidade: 1 }], DENTRO,
    )
    expect(r.desconto).toBeCloseTo(600, 2)
  })
  it('exclusão por feedId no cliente', () => {
    PROMO_BF.excluir = ['aspirador']
    const r = calcularPromoCliente([{ feedId: 'aspirador', preco: 450, quantidade: 2 }], DENTRO)
    expect(r.ativo).toBe(false)
  })
})

describe('badges de PDP/vitrine (site inteiro)', () => {
  it('promoVigentePorFeedId → badge quando ativo e não excluído', () => {
    const b = promoVigentePorFeedId('qualquer-produto', DENTRO)
    expect(b).not.toBeNull()
    expect(b?.descricao).toBe(PROMO_BF.descricao)
    expect(b?.percentual).toBe(50)
  })
  it('produto excluído NÃO mostra badge', () => {
    PROMO_BF.excluir = ['aspirador']
    expect(promoVigentePorFeedId('aspirador', DENTRO)).toBeNull()
  })
  it('promoVigentePorErp → badge quando ativo (site inteiro)', () => {
    expect(promoVigentePorErp('qualquer-erp', DENTRO)).not.toBeNull()
  })
  it('fora da janela → sem badge', () => {
    expect(promoVigentePorFeedId('x', ANTES)).toBeNull()
  })
})
