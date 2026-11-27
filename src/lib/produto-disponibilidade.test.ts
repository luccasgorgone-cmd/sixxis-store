import { describe, expect, it } from 'vitest'
import { avisoEntregaProduto } from './produto-disponibilidade'

describe('aviso de entrega por produto', () => {
  it('informa a data exata do SX200 Trend', () => {
    expect(avisoEntregaProduto('sx200-trend')).toEqual({
      titulo: 'Prazo de entrega',
      mensagem: 'A partir de 15/12/2026',
    })
  })

  it('não mostra aviso especial nos demais produtos', () => {
    expect(avisoEntregaProduto('sx200-prime')).toBeNull()
    expect(avisoEntregaProduto('')).toBeNull()
  })
})
