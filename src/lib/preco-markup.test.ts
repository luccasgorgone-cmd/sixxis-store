import { describe, expect, it } from 'vitest'
import { FATOR_MARKUP_SITE, aplicarMarkupSite } from './preco-markup'

describe('markup do site (+20%)', () => {
  it('fator é 1.20', () => {
    expect(FATOR_MARKUP_SITE).toBe(1.20)
  })
  it('aplica +20% e arredonda a 2 casas', () => {
    expect(aplicarMarkupSite(2000)).toBe(2400)
    expect(aplicarMarkupSite(1999)).toBe(2398.8)
    expect(aplicarMarkupSite(450)).toBe(540)
    expect(aplicarMarkupSite(99.99)).toBe(119.99) // 119.988 → 119.99
  })
  it('null/undefined passam direto (não inventa preço)', () => {
    expect(aplicarMarkupSite(null)).toBeNull()
    expect(aplicarMarkupSite(undefined)).toBeUndefined()
  })
  it('0 continua 0', () => {
    expect(aplicarMarkupSite(0)).toBe(0)
  })
})
