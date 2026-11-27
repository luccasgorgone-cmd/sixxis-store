import { describe, it, expect, vi } from 'vitest'

// avaliarCupom (cupom.ts) importa @/lib/prisma. Para um cupom sem primeiraCompra
// o banco nunca é tocado, então basta um mock vazio para o módulo carregar.
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/pedido-status', () => ({ STATUS_PAGO_TODOS: [] }))

import { avaliarCupom } from './cupom'
import type { Cupom } from '@prisma/client'

// Cupom base BLACKFRIDAY10 (PERCENTUAL 10%, global, unidadeUnica=true). Como
// primeiraCompra=false, avaliarCupom não toca no banco — teste puro.
function cupom(over: Partial<Cupom> = {}): Cupom {
  return {
    id:             'cpm_blackfriday10_bf2026',
    codigo:         'BLACKFRIDAY10',
    tipo:           'PERCENTUAL',
    valor:          10,
    usoMaximo:      null,
    totalUsos:      0,
    pedidoMinimo:   0,
    validade:       null,
    ativo:          true,
    descricao:      null,
    primeiraCompra: false,
    produtoIds:     null,
    unidadeUnica:   true,
    createdAt:      new Date(),
    updatedAt:      new Date(),
    ...over,
  } as Cupom
}

type CupomComExclusoes = Cupom & { produtoIdsExcluidos: string | null }

function cupomComExclusoes(
  produtoIdsExcluidos: string | null,
  over: Partial<Cupom> = {},
): CupomComExclusoes {
  return { ...cupom(over), produtoIdsExcluidos }
}

describe('cupom unidadeUnica (BLACKFRIDAY10 — só com 1 produto)', () => {
  it('válido com EXATAMENTE 1 unidade → 10% de desconto', async () => {
    const r = await avaliarCupom(cupom(), 1000, null, undefined, 1)
    expect(r.valido).toBe(true)
    expect(r.desconto).toBe(100)
  })

  it('REJEITA com 2 unidades (não acumula com a promo da 2ª unidade)', async () => {
    const r = await avaliarCupom(cupom(), 1000, null, undefined, 2)
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('CUPOM_UNIDADE_UNICA')
  })

  it('REJEITA com 3+ unidades', async () => {
    const r = await avaliarCupom(cupom(), 3000, null, undefined, 5)
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('CUPOM_UNIDADE_UNICA')
  })

  it('cupom normal (unidadeUnica=false) NÃO é afetado pela regra', async () => {
    const r = await avaliarCupom(cupom({ unidadeUnica: false }), 1000, null, undefined, 3)
    expect(r.valido).toBe(true)
    expect(r.desconto).toBe(100)
  })

  it('sem totalUnidades informado (chamador legado) → regra omitida, cupom passa', async () => {
    const r = await avaliarCupom(cupom(), 1000, null, undefined, undefined)
    expect(r.valido).toBe(true)
  })

  it('REJEITA o SX200 Trend mesmo com exatamente 1 unidade', async () => {
    const r = await avaliarCupom(
      cupomComExclusoes('p-sx200-trend'),
      5750,
      null,
      [{ produtoId: 'p-sx200-trend', subtotal: 5750 }],
      1,
    )
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('PRODUTO_NAO_ELEGIVEL')
  })

  it('mantém o BLACKFRIDAY10 válido para uma unidade de produto elegível', async () => {
    const r = await avaliarCupom(
      cupomComExclusoes('p-sx200-trend'),
      3990,
      null,
      [{ produtoId: 'p-sx100', subtotal: 3990 }],
      1,
    )
    expect(r.valido).toBe(true)
    expect(r.desconto).toBe(399)
  })
})
