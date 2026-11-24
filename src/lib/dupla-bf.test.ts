import { describe, expect, it } from 'vitest'
import { simularDupla } from './dupla-bf'

const DURANTE = new Date('2026-11-25T12:00:00-03:00')
const DEPOIS = new Date('2026-12-01T00:00:01-03:00')
const SX120 = { id: 'a', preco: 4100, sku: 'SX120', slug: 'sx120-prime' }
const SX100 = { id: 'b', preco: 2750, sku: 'SX100', slug: 'sx100-trend' }
const SX200P = { id: 'c', preco: 8600, sku: 'CLIM-SX200-PRIME', slug: 'sx200-prime' }

describe('simularDupla', () => {
  it('desconta 50% do menor valor em produtos diferentes', () => {
    expect(simularDupla(SX120, SX100, DURANTE)).toEqual({ desconto: 1375, totalCartao: 5475, totalPix: 5201.25 })
  })

  it('dá o mesmo resultado com a ordem invertida', () => {
    expect(simularDupla(SX100, SX120, DURANTE)).toEqual(simularDupla(SX120, SX100, DURANTE))
  })

  it('calcula duas unidades iguais', () => {
    expect(simularDupla(SX120, SX120, DURANTE)).toEqual({ desconto: 2050, totalCartao: 6150, totalPix: 5842.5 })
  })

  it('não simula dupla com produto excluído da promoção', () => {
    expect(simularDupla(SX200P, SX100, DURANTE)).toBeNull()
  })

  it('não simula fora da vigência', () => {
    expect(simularDupla(SX120, SX100, DEPOIS)).toBeNull()
  })
})
