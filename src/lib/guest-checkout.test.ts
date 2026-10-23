import { describe, it, expect } from 'vitest'
import {
  guestDadosSchema,
  guestEnderecoSchema,
  montarClienteGuestData,
} from './guest-checkout'

const pfValido = {
  nome: 'João da Silva',
  email: 'Joao@Example.com ',
  telefone: '(11) 99999-8888',
  tipoPessoa: 'PF' as const,
  documento: '390.533.447-05', // CPF válido
}

const pjValido = {
  nome: 'Maria Souza',
  email: 'maria@empresa.com',
  telefone: '11988887777',
  tipoPessoa: 'PJ' as const,
  documento: '11.222.333/0001-81', // CNPJ válido
  razaoSocial: 'Empresa Ltda',
  inscricaoEstadual: '123456',
  isentoIE: false,
}

describe('guestDadosSchema', () => {
  it('aceita PF válido', () => {
    expect(guestDadosSchema.safeParse(pfValido).success).toBe(true)
  })

  it('aceita PJ válido', () => {
    expect(guestDadosSchema.safeParse(pjValido).success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    expect(guestDadosSchema.safeParse({ ...pfValido, email: 'nao-email' }).success).toBe(false)
  })

  it('rejeita nome sem sobrenome', () => {
    expect(guestDadosSchema.safeParse({ ...pfValido, nome: 'João' }).success).toBe(false)
  })

  it('rejeita CPF inválido para PF', () => {
    expect(guestDadosSchema.safeParse({ ...pfValido, documento: '111.111.111-11' }).success).toBe(false)
  })

  it('rejeita CNPJ inválido para PJ', () => {
    expect(guestDadosSchema.safeParse({ ...pjValido, documento: '11.111.111/1111-11' }).success).toBe(false)
  })

  it('rejeita telefone sem DDD válido', () => {
    expect(guestDadosSchema.safeParse({ ...pfValido, telefone: '12345' }).success).toBe(false)
  })

  it('PJ exige razão social', () => {
    const { razaoSocial: _r, ...semRazao } = pjValido
    void _r
    expect(guestDadosSchema.safeParse(semRazao).success).toBe(false)
  })

  it('PJ não-isento exige inscrição estadual', () => {
    expect(guestDadosSchema.safeParse({ ...pjValido, inscricaoEstadual: '', isentoIE: false }).success).toBe(false)
  })

  it('PJ isento dispensa inscrição estadual', () => {
    expect(guestDadosSchema.safeParse({ ...pjValido, inscricaoEstadual: '', isentoIE: true }).success).toBe(true)
  })
})

describe('guestEnderecoSchema', () => {
  const end = {
    cep: '01001000',
    logradouro: 'Praça da Sé',
    numero: '100',
    bairro: 'Sé',
    cidade: 'São Paulo',
    estado: 'SP',
  }
  it('aceita endereço válido', () => {
    expect(guestEnderecoSchema.safeParse(end).success).toBe(true)
  })
  it('rejeita CEP não-8-dígitos', () => {
    expect(guestEnderecoSchema.safeParse({ ...end, cep: '0100100' }).success).toBe(false)
  })
})

describe('montarClienteGuestData', () => {
  it('PF: senha vazia, indicadorIE 9, email normalizado, telefone DDD+8, CPF em dígitos', () => {
    const data = montarClienteGuestData(guestDadosSchema.parse(pfValido))
    expect(data.senha).toBe('')
    expect(data.indicadorIE).toBe(9)
    expect(data.email).toBe('joao@example.com')
    expect(data.nome).toBe('João da Silva')
    expect(data.telefone).toBe('1199998888') // canonTelefone: DDD + 8 (drop 9)
    expect(data.cpf).toBe('39053344705')
    expect(data.cnpj).toBeUndefined()
  })

  it('PJ isento: indicadorIE 2, CNPJ setado, IE nula, sem CPF', () => {
    const data = montarClienteGuestData(guestDadosSchema.parse({ ...pjValido, isentoIE: true }))
    expect(data.indicadorIE).toBe(2)
    expect(data.cnpj).toBe('11222333000181')
    expect(data.cpf).toBeUndefined()
    expect(data.razaoSocial).toBe('Empresa Ltda')
    expect(data.inscricaoEstadual).toBeNull()
    expect(data.senha).toBe('')
  })

  it('PJ com IE: indicadorIE 1 e IE em dígitos', () => {
    const data = montarClienteGuestData(guestDadosSchema.parse(pjValido))
    expect(data.indicadorIE).toBe(1)
    expect(data.inscricaoEstadual).toBe('123456')
  })
})
