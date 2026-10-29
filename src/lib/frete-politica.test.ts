import { describe, it, expect } from 'vitest'
import {
  UFS_FRETE_GRATIS,
  PERCENTUAL_FRETE,
  ufTemFreteGratis,
  isAspirador,
  prazoPorUF,
  calcularFreteItem,
  calcularFreteCarrinho,
} from './frete-politica'

describe('ufTemFreteGratis', () => {
  it('as 10 UFs do grátis (Sul + Sudeste + MS/GO/MT) são grátis', () => {
    for (const uf of ['PR', 'SC', 'RS', 'SP', 'RJ', 'MG', 'ES', 'MS', 'GO', 'MT']) {
      expect(ufTemFreteGratis(uf)).toBe(true)
    }
    expect(UFS_FRETE_GRATIS).toHaveLength(10)
  })

  it('DF (Brasília) NÃO é grátis — não estava na lista do pedido', () => {
    expect(ufTemFreteGratis('DF')).toBe(false)
  })

  it('Nordeste e Norte NÃO são grátis', () => {
    for (const uf of ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA', 'AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO']) {
      expect(ufTemFreteGratis(uf)).toBe(false)
    }
  })

  it('normaliza minúsculas e rejeita UF inválida', () => {
    expect(ufTemFreteGratis('sp')).toBe(true)
    expect(ufTemFreteGratis('XX')).toBe(false)
    expect(ufTemFreteGratis('')).toBe(false)
    expect(ufTemFreteGratis(null)).toBe(false)
  })
})

describe('isAspirador', () => {
  it('casa categoria de aspirador (case-insensitive)', () => {
    expect(isAspirador('Aspiradores')).toBe(true)
    expect(isAspirador('aspirador')).toBe(true)
    expect(isAspirador('ASPIRADORES')).toBe(true)
  })
  it('não casa climatizador/spinning/nulo', () => {
    expect(isAspirador('Climatizadores')).toBe(false)
    expect(isAspirador('Spinning')).toBe(false)
    expect(isAspirador(null)).toBe(false)
    expect(isAspirador(undefined)).toBe(false)
  })
})

describe('prazoPorUF', () => {
  it('retorna faixa conhecida e [0,0] para UF inválida', () => {
    expect(prazoPorUF('SP')).toEqual([1, 3])
    expect(prazoPorUF('AM')).toEqual([10, 20])
    expect(prazoPorUF('XX')).toEqual([0, 0])
  })
})

describe('calcularFreteItem', () => {
  it('UF grátis → 0 mesmo para produto caro', () => {
    expect(calcularFreteItem('SP', { precoEfetivo: 5175, quantidade: 1, categoria: 'Climatizadores' })).toBe(0)
  })

  it('aspirador → 0 em UF paga', () => {
    expect(calcularFreteItem('BA', { precoEfetivo: 500, quantidade: 2, categoria: 'Aspiradores' })).toBe(0)
  })

  it('não-aspirador em UF paga → 9% × preço × qtd', () => {
    // SX200 com 10% já aplicado (5175) para BA: 9% = 465,75
    expect(calcularFreteItem('BA', { precoEfetivo: 5175, quantidade: 1, categoria: 'Climatizadores' })).toBe(465.75)
    // 2 unidades dobra o frete
    expect(calcularFreteItem('BA', { precoEfetivo: 5175, quantidade: 2, categoria: 'Climatizadores' })).toBe(931.5)
  })

  it('usa o percentual exportado (9%)', () => {
    expect(calcularFreteItem('AM', { precoEfetivo: 1000, quantidade: 1, categoria: 'Climatizadores' }))
      .toBe(Math.round(1000 * PERCENTUAL_FRETE * 100) / 100)
  })

  it('quantidade inválida vira 1 (piso)', () => {
    expect(calcularFreteItem('BA', { precoEfetivo: 100, quantidade: 0, categoria: 'x' })).toBe(9)
    expect(calcularFreteItem('BA', { precoEfetivo: 100, quantidade: -3, categoria: 'x' })).toBe(9)
  })
})

describe('calcularFreteCarrinho', () => {
  it('carrinho inteiro em UF grátis → grátis', () => {
    const r = calcularFreteCarrinho('SP', [
      { precoEfetivo: 5175, quantidade: 1, categoria: 'Climatizadores' },
      { precoEfetivo: 750, quantidade: 1, categoria: 'Spinning' },
    ])
    expect(r.freteGratis).toBe(true)
    expect(r.preco).toBe(0)
    expect(r.prazoDiasMin).toBe(1)
    expect(r.prazoDiasMax).toBe(3)
  })

  it('carrinho misto (aspirador + climatizador) em UF paga → 9% só do climatizador', () => {
    const r = calcularFreteCarrinho('BA', [
      { precoEfetivo: 500, quantidade: 1, categoria: 'Aspiradores' }, // isento
      { precoEfetivo: 5175, quantidade: 1, categoria: 'Climatizadores' }, // 465,75
    ])
    expect(r.preco).toBe(465.75)
    expect(r.freteGratis).toBe(false)
    expect(r.prazoDiasMin).toBe(5)
    expect(r.prazoDiasMax).toBe(9)
  })

  it('só aspirador em UF paga → grátis', () => {
    const r = calcularFreteCarrinho('AM', [
      { precoEfetivo: 500, quantidade: 3, categoria: 'Aspiradores' },
    ])
    expect(r.preco).toBe(0)
    expect(r.freteGratis).toBe(true)
  })

  it('soma itens pagos distintos corretamente', () => {
    const r = calcularFreteCarrinho('PE', [
      { precoEfetivo: 1000, quantidade: 1, categoria: 'Climatizadores' }, // 90
      { precoEfetivo: 2000, quantidade: 1, categoria: 'Climatizadores' }, // 180
    ])
    expect(r.preco).toBe(270)
    expect(r.freteGratis).toBe(false)
  })
})
