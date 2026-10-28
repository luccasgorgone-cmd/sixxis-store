import { describe, expect, it } from 'vitest'
import { cupomVitrinePorFeedId } from './cupom-vitrine'

describe('cupom-vitrine — badge (só exibição)', () => {
  it('casa 10OFFTREND pelo sku e pelo slug do SX200 Trend', () => {
    expect(cupomVitrinePorFeedId('CLIM-SX200-TREND')?.codigo).toBe('10OFFTREND')
    expect(cupomVitrinePorFeedId('sx200-trend')?.codigo).toBe('10OFFTREND')
    expect(cupomVitrinePorFeedId('CLIM-SX200-TREND')?.percentual).toBe(10)
  })

  it('não casa produto sem cupom escopado nem feedId vazio', () => {
    expect(cupomVitrinePorFeedId('CLIM-SX180-TREND')).toBeNull()
    expect(cupomVitrinePorFeedId(undefined)).toBeNull()
    expect(cupomVitrinePorFeedId(null)).toBeNull()
  })

  it('respeita a janela de vigência quando definida', () => {
    // 10OFFTREND não tem validade → vigente em qualquer data.
    const futuroLongo = new Date('2030-01-01T00:00:00-03:00')
    expect(cupomVitrinePorFeedId('sx200-trend', futuroLongo)?.codigo).toBe('10OFFTREND')
  })
})
