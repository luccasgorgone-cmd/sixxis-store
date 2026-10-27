import { describe, expect, it } from 'vitest'
import {
  calcularPromoServidor,
  calcularPromoCliente,
  promoVigentePorErp,
} from './promo-segunda-unidade'

// erpProdutoId REAL do SX180 Trend em producao (chave do match server-side).
const ERP = 'ADMIN-1781206602840-9qw3wci'
const PRECO = 2000
// Dentro da vigência (27/10 → 04/11/2026, America/Sao_Paulo).
const DENTRO = new Date('2026-10-28T12:00:00-03:00')
// Depois do fim.
const FORA = new Date('2026-11-05T00:00:00-03:00')
// Antes do início.
const ANTES = new Date('2026-10-26T23:59:00-03:00')

describe('promo 2ª unidade — pareamento floor(qtd/2)', () => {
  const casos: [number, number][] = [
    [1, 0],
    [2, 1],
    [3, 1],
    [4, 2],
    [5, 2],
    [6, 3],
  ]
  for (const [qtd, esperadoUnidades] of casos) {
    it(`${qtd} unidade(s) → ${esperadoUnidades} com 50%`, () => {
      const r = calcularPromoServidor([{ erpProdutoId: ERP, precoUnitario: PRECO, quantidade: qtd }], DENTRO)
      expect(r.unidadesComDesconto).toBe(esperadoUnidades)
      expect(r.desconto).toBeCloseTo(esperadoUnidades * PRECO * 0.5, 2)
      expect(r.ativo).toBe(esperadoUnidades > 0)
    })
  }
})

describe('vigência', () => {
  it('não aplica antes do início', () => {
    const r = calcularPromoServidor([{ erpProdutoId: ERP, precoUnitario: PRECO, quantidade: 2 }], ANTES)
    expect(r.ativo).toBe(false)
    expect(r.desconto).toBe(0)
  })
  it('não aplica depois do fim', () => {
    const r = calcularPromoServidor([{ erpProdutoId: ERP, precoUnitario: PRECO, quantidade: 4 }], FORA)
    expect(r.ativo).toBe(false)
    expect(r.desconto).toBe(0)
  })
  it('promoVigentePorErp reflete a janela', () => {
    expect(promoVigentePorErp(ERP, DENTRO)).not.toBeNull()
    expect(promoVigentePorErp(ERP, FORA)).toBeNull()
    expect(promoVigentePorErp('OUTRO-PRODUTO', DENTRO)).toBeNull()
  })
})

describe('escopo por produto', () => {
  it('produto fora da promo não ganha desconto', () => {
    const r = calcularPromoServidor([{ erpProdutoId: 'CLIM-SX070-TREND', precoUnitario: PRECO, quantidade: 4 }], DENTRO)
    expect(r.ativo).toBe(false)
  })
  it('soma linhas do mesmo produto e desconta a unidade mais barata', () => {
    // 1 un a R$2000 + 1 un a R$1800 (mesmo erp) → 2 un → 1 com 50% da MENOR.
    const r = calcularPromoServidor(
      [
        { erpProdutoId: ERP, precoUnitario: 2000, quantidade: 1 },
        { erpProdutoId: ERP, precoUnitario: 1800, quantidade: 1 },
      ],
      DENTRO,
    )
    expect(r.unidadesComDesconto).toBe(1)
    expect(r.desconto).toBeCloseTo(1800 * 0.5, 2)
  })
})

describe('cliente casa por feedId (sku ou slug)', () => {
  it('casa pelo sku', () => {
    const r = calcularPromoCliente([{ feedId: 'CLIM-SX180-TREND', preco: PRECO, quantidade: 2 }], DENTRO)
    expect(r.ativo).toBe(true)
    expect(r.desconto).toBeCloseTo(PRECO * 0.5, 2)
  })
  it('casa pelo slug', () => {
    const r = calcularPromoCliente([{ feedId: 'sx180-trend', preco: PRECO, quantidade: 2 }], DENTRO)
    expect(r.ativo).toBe(true)
  })
  it('feedId desconhecido não aplica', () => {
    const r = calcularPromoCliente([{ feedId: 'outro-produto', preco: PRECO, quantidade: 2 }], DENTRO)
    expect(r.ativo).toBe(false)
  })
})
