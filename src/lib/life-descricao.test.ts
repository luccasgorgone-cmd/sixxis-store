import { describe, expect, it } from 'vitest'
import {
  normalizarEspecificacoesLife,
  normalizarFaqsLife,
  normalizarNiveisLife,
  normalizarTextoPublicoLife,
} from './life-descricao'

describe('normalizarNiveisLife', () => {
  it('substitui todas as menções legadas pelo upgrade oficial de 32 níveis', () => {
    const legadoOito = `${8} níveis`
    const legadoDez = `${10} níveis`
    const atual = `<p>Pedalada com ${legadoOito}.</p><li>Resistência com ${legadoDez} ajustáveis.</li>`

    expect(normalizarNiveisLife(atual)).toBe(
      '<p>Pedalada com 32 níveis.</p><li>Resistência com 32 níveis ajustáveis.</li>',
    )
  })

  it('é idempotente quando a descrição já está correta', () => {
    const correta = '<p>Pedalada com resistência magnética ajustável em 32 níveis.</p>'

    expect(normalizarNiveisLife(correta)).toBe(correta)
  })

  it('recusa conteúdo inesperado para não reescrever outro produto por engano', () => {
    expect(() => normalizarNiveisLife('<p>Resistência ajustável.</p>')).toThrow(
      'Descrição da Sixxis Life não contém a frase esperada',
    )
  })
})

describe('normalizarEspecificacoesLife', () => {
  it('publica a resistência magnética de 32 níveis entre as três primeiras specs para o SEO', () => {
    const atual = [
      { label: 'Marca', valor: 'Sixxis' },
      { label: 'Modelo', valor: 'Spinning Sixxis Life' },
      { label: 'Tipo', valor: 'Spinning Semi-Profissional' },
      { label: 'Tipo de Resistência', valor: 'Magnética e Mecânica' },
    ]

    expect(normalizarEspecificacoesLife(atual)).toEqual([
      { label: 'Marca', valor: 'Sixxis' },
      { label: 'Modelo', valor: 'Spinning Sixxis Life' },
      { label: 'Tipo de Resistência', valor: 'Magnética — 32 níveis ajustáveis' },
      { label: 'Tipo', valor: 'Spinning Semi-Profissional' },
    ])
  })
})

describe('normalizarTextoPublicoLife', () => {
  it('atualiza título e comentário seedados sem alterar textos sem níveis', () => {
    expect(normalizarTextoPublicoLife(`${10} níveis dão pra variar`)).toBe('32 níveis dão pra variar')
    expect(normalizarTextoPublicoLife('Resistência magnética suave')).toBe('Resistência magnética suave')
  })
})

describe('normalizarFaqsLife', () => {
  it('atualiza pergunta e resposta sem remover FAQs não relacionadas', () => {
    const legado = `${10} níveis`
    const faqs = [
      { pergunta: `A bike tem ${legado}?`, resposta: `Sim, são ${legado} ajustáveis.` },
      { pergunta: 'Qual é a garantia?', resposta: '12 meses.' },
    ]

    expect(normalizarFaqsLife(faqs)).toEqual([
      { pergunta: 'A bike tem 32 níveis?', resposta: 'Sim, são 32 níveis ajustáveis.' },
      { pergunta: 'Qual é a garantia?', resposta: '12 meses.' },
    ])
  })
})
