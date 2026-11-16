import { describe, expect, it } from 'vitest'
import { normalizarNiveisLife } from './life-descricao'

describe('normalizarNiveisLife', () => {
  it('alinha o parágrafo promocional à ficha técnica oficial de 8 níveis', () => {
    const atual = '<p>Pedalada com resistência magnética ajustável em 10 níveis. Treino completo.</p>'

    expect(normalizarNiveisLife(atual)).toBe(
      '<p>Pedalada com resistência magnética ajustável em 8 níveis. Treino completo.</p>',
    )
  })

  it('é idempotente quando a descrição já está correta', () => {
    const correta = '<p>Pedalada com resistência magnética ajustável em 8 níveis.</p>'

    expect(normalizarNiveisLife(correta)).toBe(correta)
  })

  it('recusa conteúdo inesperado para não reescrever outro produto por engano', () => {
    expect(() => normalizarNiveisLife('<p>Resistência ajustável.</p>')).toThrow(
      'Descrição da Sixxis Life não contém a frase esperada',
    )
  })
})
