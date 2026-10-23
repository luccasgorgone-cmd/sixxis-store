import { describe, it, expect } from 'vitest'
import {
  soDigitosCep,
  cepValido,
  formatarCep,
  montarProdutosFrete,
  normalizarRespostaFrete,
  estadoFreteView,
} from './frete-estimativa'

describe('soDigitosCep', () => {
  it('remove não-dígitos e limita a 8', () => {
    expect(soDigitosCep('01001-000')).toBe('01001000')
    expect(soDigitosCep('0100100099')).toBe('01001000')
    expect(soDigitosCep('abc')).toBe('')
  })
})

describe('cepValido', () => {
  it('exige exatamente 8 dígitos', () => {
    expect(cepValido('01001000')).toBe(true)
    expect(cepValido('01001-000')).toBe(true)
    expect(cepValido('0100100')).toBe(false)
    expect(cepValido('')).toBe(false)
  })
})

describe('formatarCep', () => {
  it('aplica máscara 00000-000 progressiva', () => {
    expect(formatarCep('0100')).toBe('0100')
    expect(formatarCep('01001')).toBe('01001')
    expect(formatarCep('010010')).toBe('01001-0')
    expect(formatarCep('01001000')).toBe('01001-000')
    expect(formatarCep('01001-000')).toBe('01001-000')
  })
})

describe('montarProdutosFrete', () => {
  it('usa produtoId (fallback id), soma quantidades por produto e ordena', () => {
    const r = montarProdutosFrete([
      { produtoId: 'b', quantidade: 2 },
      { id: 'a', quantidade: 1 },
      { produtoId: 'b', quantidade: 3 },
    ])
    expect(r).toEqual([
      { id: 'a', quantidade: 1 },
      { id: 'b', quantidade: 5 },
    ])
  })

  it('descarta itens sem id ou com quantidade inválida', () => {
    expect(
      montarProdutosFrete([
        { quantidade: 2 },
        { produtoId: 'x', quantidade: 0 },
        { produtoId: 'y', quantidade: -1 },
        { produtoId: 'z', quantidade: 2.9 },
      ]),
    ).toEqual([{ id: 'z', quantidade: 2 }])
  })

  it('lista vazia → []', () => {
    expect(montarProdutosFrete([])).toEqual([])
  })
})

describe('normalizarRespostaFrete', () => {
  it('status ok: mapeia opções e converte preço para Number', () => {
    const r = normalizarRespostaFrete({
      status: 'ok',
      mensagem: '',
      opcoes: [{ id: 'normal', nome: 'Entrega', prazo: '3 dias úteis', preco: '25.5' }],
    })
    expect(r.status).toBe('ok')
    expect(r.opcoes).toEqual([{ id: 'normal', nome: 'Entrega', prazo: '3 dias úteis', preco: 25.5 }])
  })

  it('status a_combinar: sem opções, mensagem preservada', () => {
    const r = normalizarRespostaFrete({ status: 'a_combinar', mensagem: 'Frete a combinar', opcoes: [] })
    expect(r.status).toBe('a_combinar')
    expect(r.opcoes).toEqual([])
    expect(r.mensagem).toBe('Frete a combinar')
  })

  it('status ausente/desconhecido → bloqueado e descarta opções', () => {
    expect(normalizarRespostaFrete({}).status).toBe('bloqueado')
    expect(normalizarRespostaFrete({ status: 'xyz', opcoes: [{ id: 'a' }] }).opcoes).toEqual([])
    expect(normalizarRespostaFrete(null).status).toBe('bloqueado')
  })
})

describe('estadoFreteView', () => {
  const ok = { status: 'ok' as const, opcoes: [{ id: 'n', nome: 'Entrega', prazo: '', preco: 10 }], mensagem: '' }
  it('calculando tem prioridade', () => {
    expect(estadoFreteView(true, ok)).toBe('calculando')
    expect(estadoFreteView(true, null)).toBe('calculando')
  })
  it('sem resultado → nada', () => {
    expect(estadoFreteView(false, null)).toBe('nada')
  })
  it('ok com opções → ok; ok sem opções → sem-opcoes', () => {
    expect(estadoFreteView(false, ok)).toBe('ok')
    expect(estadoFreteView(false, { status: 'ok', opcoes: [], mensagem: '' })).toBe('sem-opcoes')
  })
  it('mapeia a_combinar e bloqueado', () => {
    expect(estadoFreteView(false, { status: 'a_combinar', opcoes: [], mensagem: '' })).toBe('a_combinar')
    expect(estadoFreteView(false, { status: 'bloqueado', opcoes: [], mensagem: '' })).toBe('bloqueado')
  })
})
