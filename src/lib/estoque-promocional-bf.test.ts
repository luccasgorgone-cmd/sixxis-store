import { describe, expect, it } from 'vitest'
import {
  LOTES_PROMOCIONAIS_BF,
  calcularEstoquePromocionalBF,
  calcularSaldoLote,
  chaveQuantidadePaga,
  classificarVariacaoLote,
  formatarAvisoUltimasUnidades,
} from './estoque-promocional-bf'

const DENTRO_BF = new Date('2026-11-27T12:00:00-03:00')
const FORA_BF = new Date('2026-12-01T00:00:00-03:00')

describe('configuração dos lotes Black Friday', () => {
  it('fixa as quantidades aprovadas por produto', () => {
    expect(LOTES_PROMOCIONAIS_BF).toMatchObject({
      'asp-bravo': { total: 30 },
      'sx180-trend': { total: 28 },
      'sx100-trend': { total: 12 },
      sx040: { total: 20 },
      'spinning-sixxis-cardio': { total: 20 },
      'm45-trend': { total: 26 },
      'sx070-trend': { total: 8 },
      'sx060-prime': { total: 6 },
      'sx120-prime': { total: 10 },
      'spinning-sixxis-life': {
        variantes: { preta: 14, branca: 10 },
      },
    })
    expect(LOTES_PROMOCIONAIS_BF).not.toHaveProperty('sx200-prime')
    expect(LOTES_PROMOCIONAIS_BF).not.toHaveProperty('sx200-trend')
  })
})

describe('saldo de lote', () => {
  it('desconta só a quantidade paga e limita pelo estoque real', () => {
    expect(calcularSaldoLote(26, 3, 40)).toBe(23)
    expect(calcularSaldoLote(26, 3, 9)).toBe(9)
    expect(calcularSaldoLote(6, 9, 20)).toBe(0)
  })

  it('formata singular e plural sem alegar venda', () => {
    expect(formatarAvisoUltimasUnidades(1)).toBe('Última unidade do lote Black Friday')
    expect(formatarAvisoUltimasUnidades(8)).toBe('Últimas 8 unidades do lote Black Friday')
  })
})

describe('variações da Sixxis Life', () => {
  it('normaliza apenas as cores configuradas', () => {
    expect(classificarVariacaoLote('Life Preta')).toBe('preta')
    expect(classificarVariacaoLote('BRANCA')).toBe('branca')
    expect(classificarVariacaoLote('220V')).toBeNull()
  })

  it('mantém saldos separados e soma o card', () => {
    const pagos = new Map([
      [chaveQuantidadePaga('life', 'v-preta'), 2],
      [chaveQuantidadePaga('life', 'v-branca'), 1],
    ])
    const saldo = calcularEstoquePromocionalBF({
      id: 'life',
      slug: 'spinning-sixxis-life',
      estoque: 50,
      variacoes: [
        { id: 'v-preta', nome: 'Preta', estoque: 20 },
        { id: 'v-branca', nome: 'Branca', estoque: 20 },
      ],
    }, pagos, DENTRO_BF)

    expect(saldo).toEqual({
      loteInicial: 24,
      restantes: 21,
      variantes: {
        'v-preta': { loteInicial: 14, restantes: 12 },
        'v-branca': { loteInicial: 10, restantes: 9 },
      },
    })
  })
})

describe('vigência e produto sem campanha', () => {
  it('não mostra lote fora da Black Friday nem nos SX200', () => {
    const pagos = new Map<string, number>()
    const sx100 = { id: 'sx100', slug: 'sx100-trend', estoque: 20, variacoes: [] }
    expect(calcularEstoquePromocionalBF(sx100, pagos, FORA_BF)).toBeNull()
    expect(calcularEstoquePromocionalBF({ ...sx100, slug: 'sx200-trend' }, pagos, DENTRO_BF)).toBeNull()
  })
})
