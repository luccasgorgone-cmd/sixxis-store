import { describe, expect, it } from 'vitest'
import { FATOR_MARKUP_SITE, aplicarMarkupSite } from './preco-markup'

describe('markup do site (+20% REVERTIDO — fator 1)', () => {
  it('fator é 1 (markup desligado, preços no base)', () => {
    expect(FATOR_MARKUP_SITE).toBe(1)
  })
  it('fator 1 = identidade (não altera o preço base)', () => {
    expect(aplicarMarkupSite(2000)).toBe(2000)
    expect(aplicarMarkupSite(1999)).toBe(1999)
    expect(aplicarMarkupSite(450)).toBe(450)
    expect(aplicarMarkupSite(99.99)).toBe(99.99)
  })
  it('null/undefined passam direto (não inventa preço)', () => {
    expect(aplicarMarkupSite(null)).toBeNull()
    expect(aplicarMarkupSite(undefined)).toBeUndefined()
  })
  it('0 continua 0', () => {
    expect(aplicarMarkupSite(0)).toBe(0)
  })
})
