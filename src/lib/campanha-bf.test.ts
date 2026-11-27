import { describe, expect, it } from 'vitest'
import { CAMPANHA_CUPOM_BF, campanhaCupomAtiva } from './campanha-bf'

describe('comunicação do cupom Black Friday', () => {
  it('expõe código, elegibilidade e regra de não acúmulo', () => {
    expect(CAMPANHA_CUPOM_BF.codigo).toBe('BLACKFRIDAY10')
    expect(CAMPANHA_CUPOM_BF.percentual).toBe(10)
    expect(CAMPANHA_CUPOM_BF.textoHeader).toMatch(/1 produto elegível/i)
    expect(CAMPANHA_CUPOM_BF.textoHeader).toMatch(/não acumula com 50% na 2ª unidade/i)
  })

  it('segue exatamente a janela da campanha Black Friday', () => {
    expect(campanhaCupomAtiva(new Date('2026-11-27T12:00:00-03:00'))).toBe(true)
    expect(campanhaCupomAtiva(new Date('2026-12-01T00:00:01-03:00'))).toBe(false)
  })
})
