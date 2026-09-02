import { describe, expect, it } from 'vitest'
import { cnpjValido, cpfValido, documentoValido } from './validacao-documento'

describe('cpfValido', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
  })

  it('rejeita CPF com dígito verificador errado', () => {
    expect(cpfValido('529.982.247-26')).toBe(false)
  })

  it('rejeita sequência repetida (111.111.111-11)', () => {
    expect(cpfValido('111.111.111-11')).toBe(false)
  })

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(cpfValido('123.456.789')).toBe(false)
  })
})

describe('cnpjValido', () => {
  it('aceita CNPJ com dígitos verificadores corretos', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
  })

  it('rejeita CNPJ com dígito verificador errado', () => {
    expect(cnpjValido('11.222.333/0001-82')).toBe(false)
  })

  it('rejeita sequência repetida', () => {
    expect(cnpjValido('11.111.111/1111-11')).toBe(false)
  })

  it('rejeita CNPJ com menos de 14 dígitos', () => {
    expect(cnpjValido('11.222.333/0001')).toBe(false)
  })
})

describe('documentoValido', () => {
  it('roteia 11 dígitos pra validação de CPF', () => {
    expect(documentoValido('529.982.247-25')).toBe(true)
    expect(documentoValido('529.982.247-26')).toBe(false)
  })

  it('roteia 14 dígitos pra validação de CNPJ', () => {
    expect(documentoValido('11.222.333/0001-81')).toBe(true)
    expect(documentoValido('11.222.333/0001-82')).toBe(false)
  })

  it('rejeita quantidade de dígitos que não é nem CPF nem CNPJ', () => {
    expect(documentoValido('123')).toBe(false)
    expect(documentoValido('')).toBe(false)
  })
})
