import { describe, expect, it } from 'vitest'
import { cupomVitrinePorFeedId, CUPONS_VITRINE } from './cupom-vitrine'

describe('cupom-vitrine — badge (só exibição)', () => {
  it('sem cupons de vitrine configurados (10OFFTREND virou desconto direto)', () => {
    expect(CUPONS_VITRINE).toHaveLength(0)
  })

  it('SX200 Trend não anuncia mais badge de cupom (removido)', () => {
    expect(cupomVitrinePorFeedId('CLIM-SX200-TREND')).toBeNull()
    expect(cupomVitrinePorFeedId('sx200-trend')).toBeNull()
  })

  it('não casa feedId vazio/nulo', () => {
    expect(cupomVitrinePorFeedId(undefined)).toBeNull()
    expect(cupomVitrinePorFeedId(null)).toBeNull()
    expect(cupomVitrinePorFeedId('CLIM-SX180-TREND')).toBeNull()
  })
})
