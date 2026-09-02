import { describe, expect, it } from 'vitest'
import { nomeCompletoSchema, nomeCompletoValido } from './validacao-nome'

describe('nomeCompletoValido', () => {
  it('rejeita nome com uma única palavra', () => {
    expect(nomeCompletoValido('Josafá')).toBe(false)
  })

  it('aceita nome e sobrenome', () => {
    expect(nomeCompletoValido('Josafá Silva')).toBe(true)
  })

  it('rejeita string vazia ou só espaços', () => {
    expect(nomeCompletoValido('')).toBe(false)
    expect(nomeCompletoValido('   ')).toBe(false)
  })

  it('ignora espaços extras entre e ao redor das palavras', () => {
    expect(nomeCompletoValido('  Ana   Maria  ')).toBe(true)
  })

  it('aceita nomes compostos com 3+ palavras', () => {
    expect(nomeCompletoValido('Ana Maria da Silva')).toBe(true)
  })

  it('rejeita uma palavra seguida só de espaço', () => {
    expect(nomeCompletoValido('Josafá ')).toBe(false)
  })
})

describe('nomeCompletoSchema', () => {
  it('rejeita nome com uma palavra via safeParse', () => {
    const resultado = nomeCompletoSchema.safeParse('Gilson')
    expect(resultado.success).toBe(false)
  })

  it('aceita nome completo via safeParse', () => {
    const resultado = nomeCompletoSchema.safeParse('Gilson Souza')
    expect(resultado.success).toBe(true)
  })
})
