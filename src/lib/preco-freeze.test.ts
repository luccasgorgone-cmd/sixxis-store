import { afterEach, describe, expect, it } from 'vitest'
import { precoCongeladoNoSync } from './preco-freeze'
import { PROMO_BF } from './promo-segunda-unidade'

// Datas âncora derivadas da janela canônica de BF (PROMO_BF).
const ANTES = new Date(new Date(PROMO_BF.inicio).getTime() - 60 * 60 * 1000) // 1h antes do início
const DENTRO = new Date('2026-11-25T12:00:00-03:00')
const DEPOIS = new Date(
  (PROMO_BF.fim ? new Date(PROMO_BF.fim).getTime() : Date.now()) + 60 * 60 * 1000, // 1h após o fim
)

describe('precoCongeladoNoSync — janela de BF', () => {
  afterEach(() => {
    delete process.env.ERP_SYNC_PRICE_FREEZE
  })

  it('antes da janela → não congela', () => {
    expect(precoCongeladoNoSync(ANTES)).toBe(false)
  })

  it('dentro da janela → congela', () => {
    expect(precoCongeladoNoSync(DENTRO)).toBe(true)
  })

  it('depois da janela → não congela', () => {
    expect(precoCongeladoNoSync(DEPOIS)).toBe(false)
  })

  it('no instante exato do início → congela (inclusivo)', () => {
    expect(precoCongeladoNoSync(new Date(PROMO_BF.inicio))).toBe(true)
  })
})

describe('precoCongeladoNoSync — override por env', () => {
  afterEach(() => {
    delete process.env.ERP_SYNC_PRICE_FREEZE
  })

  it('ERP_SYNC_PRICE_FREEZE=off desliga mesmo dentro da janela', () => {
    process.env.ERP_SYNC_PRICE_FREEZE = 'off'
    expect(precoCongeladoNoSync(DENTRO)).toBe(false)
  })

  it('ERP_SYNC_PRICE_FREEZE=on liga mesmo fora da janela', () => {
    process.env.ERP_SYNC_PRICE_FREEZE = 'on'
    expect(precoCongeladoNoSync(ANTES)).toBe(true)
  })

  it('valor desconhecido cai no automático (janela)', () => {
    process.env.ERP_SYNC_PRICE_FREEZE = 'talvez'
    expect(precoCongeladoNoSync(DENTRO)).toBe(true)
    expect(precoCongeladoNoSync(ANTES)).toBe(false)
  })

  it('tolera espaços e maiúsculas (" OFF ")', () => {
    process.env.ERP_SYNC_PRICE_FREEZE = ' OFF '
    expect(precoCongeladoNoSync(DENTRO)).toBe(false)
  })
})
