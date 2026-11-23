import { describe, it, expect } from 'vitest'
import {
  UFS_FRETE_GRATIS,
  UFS_CENTRO_OESTE,
  PERCENTUAL_FRETE,
  PERCENTUAL_FRETE_CO,
  FATOR_FRETE_BF,
  CATEGORIA_ISENTA_FRETE,
  ufTemFreteGratis,
  ufEhCentroOeste,
  prazoPorUF,
  calcularFreteItem,
  calcularFreteCarrinho,
} from './frete-politica'

describe('ufTemFreteGratis', () => {
  it('grátis = Sul (PR,SC,RS) + Sudeste (SP,RJ,MG,ES) — 7 UFs', () => {
    for (const uf of ['PR', 'SC', 'RS', 'SP', 'RJ', 'MG', 'ES']) {
      expect(ufTemFreteGratis(uf)).toBe(true)
    }
    expect(UFS_FRETE_GRATIS).toHaveLength(7)
  })

  it('Centro-Oeste (MS, GO, MT, DF) NÃO é mais grátis — passou a ser cobrado', () => {
    for (const uf of ['MS', 'GO', 'MT', 'DF']) {
      expect(ufTemFreteGratis(uf)).toBe(false)
      expect(ufEhCentroOeste(uf)).toBe(true)
    }
    expect(UFS_CENTRO_OESTE).toHaveLength(4)
  })

  it('Nordeste e Norte NÃO são grátis (nem Centro-Oeste)', () => {
    for (const uf of ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA', 'AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO']) {
      expect(ufTemFreteGratis(uf)).toBe(false)
      expect(ufEhCentroOeste(uf)).toBe(false)
    }
  })

  it('normaliza minúsculas e rejeita UF inválida', () => {
    expect(ufTemFreteGratis('sp')).toBe(true)
    expect(ufTemFreteGratis('go')).toBe(false)
    expect(ufEhCentroOeste('go')).toBe(true)
    expect(ufTemFreteGratis('XX')).toBe(false)
    expect(ufTemFreteGratis(null)).toBe(false)
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
  it('UF grátis (Sudeste) → 0 mesmo para produto caro', () => {
    expect(calcularFreteItem('SP', { precoEfetivo: 5175, quantidade: 1 })).toBe(0)
  })

  it('Centro-Oeste → 7% flat do valor (sem uplift BF)', () => {
    expect(calcularFreteItem('GO', { precoEfetivo: 1000, quantidade: 1 })).toBe(70)
    expect(calcularFreteItem('MT', { precoEfetivo: 1000, quantidade: 2 })).toBe(140)
    expect(calcularFreteItem('DF', { precoEfetivo: 1000, quantidade: 1 }))
      .toBe(Math.round(1000 * PERCENTUAL_FRETE_CO * 100) / 100)
  })

  it('Nordeste/Norte → 9% × fator BF (+15%)', () => {
    expect(calcularFreteItem('BA', { precoEfetivo: 1000, quantidade: 1 })).toBe(103.5)
    expect(calcularFreteItem('AM', { precoEfetivo: 1000, quantidade: 1 }))
      .toBe(Math.round(1000 * PERCENTUAL_FRETE * FATOR_FRETE_BF * 100) / 100)
  })

  it('ASPIRADOR (categoria isenta) → frete grátis em QUALQUER UF', () => {
    expect(calcularFreteItem('BA', { precoEfetivo: 1000, quantidade: 1, categoria: CATEGORIA_ISENTA_FRETE })).toBe(0)
    expect(calcularFreteItem('GO', { precoEfetivo: 1000, quantidade: 1, categoria: CATEGORIA_ISENTA_FRETE })).toBe(0)
    expect(calcularFreteItem('AM', { precoEfetivo: 5000, quantidade: 3, categoria: CATEGORIA_ISENTA_FRETE })).toBe(0)
  })

  it('quantidade inválida vira 1 (piso) — CO 7%', () => {
    expect(calcularFreteItem('GO', { precoEfetivo: 100, quantidade: 0 })).toBe(7)
    expect(calcularFreteItem('GO', { precoEfetivo: 100, quantidade: -3 })).toBe(7)
  })
})

describe('calcularFreteCarrinho', () => {
  it('carrinho inteiro em UF grátis → grátis', () => {
    const r = calcularFreteCarrinho('SP', [
      { precoEfetivo: 5175, quantidade: 1 },
      { precoEfetivo: 750, quantidade: 1 },
    ])
    expect(r.freteGratis).toBe(true)
    expect(r.preco).toBe(0)
    expect(r.prazoDiasMin).toBe(1)
    expect(r.prazoDiasMax).toBe(3)
  })

  it('Centro-Oeste: só os não-aspirador pagam 7%; aspirador isento', () => {
    const r = calcularFreteCarrinho('GO', [
      { precoEfetivo: 1000, quantidade: 1 }, // climatizador: 70
      { precoEfetivo: 500, quantidade: 1, categoria: CATEGORIA_ISENTA_FRETE }, // aspirador: 0
    ])
    expect(r.preco).toBe(70)
    expect(r.freteGratis).toBe(false)
  })

  it('carrinho só de aspirador em UF cobrada → frete grátis (isento)', () => {
    const r = calcularFreteCarrinho('BA', [
      { precoEfetivo: 800, quantidade: 2, categoria: CATEGORIA_ISENTA_FRETE },
    ])
    expect(r.preco).toBe(0)
    expect(r.freteGratis).toBe(true)
  })

  it('Nordeste → 9%×1.15 de TODOS os itens não isentos', () => {
    const r = calcularFreteCarrinho('PE', [
      { precoEfetivo: 1000, quantidade: 1 }, // 103,5
      { precoEfetivo: 2000, quantidade: 1 }, // 207
    ])
    expect(r.preco).toBe(310.5)
    expect(r.freteGratis).toBe(false)
  })
})
