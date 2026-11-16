const PADRAO_NIVEIS_LEGADOS = /\b(?:8|10)\s+níveis\b/gi
const PADRAO_NIVEIS_ATUAIS = /\b32\s+níveis\b/i
const RESISTENCIA_ATUAL = 'Magnética — 32 níveis ajustáveis'

export type EspecificacaoLife = { label: string; valor: string }
export type FaqLife = { pergunta: string; resposta: string }

export function normalizarTextoPublicoLife(texto: string): string {
  return texto.replace(PADRAO_NIVEIS_LEGADOS, '32 níveis')
}

export function normalizarNiveisLife(descricao: string): string {
  const normalizada = normalizarTextoPublicoLife(descricao)
  if (normalizada !== descricao) return normalizada

  if (PADRAO_NIVEIS_ATUAIS.test(descricao)) return descricao

  throw new Error('Descrição da Sixxis Life não contém a frase esperada')
}

export function normalizarEspecificacoesLife(
  especificacoes: EspecificacaoLife[],
): EspecificacaoLife[] {
  const normalizadas = especificacoes.map((spec) => ({
    label: normalizarTextoPublicoLife(spec.label),
    valor: normalizarTextoPublicoLife(spec.valor),
  }))

  const indiceResistencia = normalizadas.findIndex((spec) =>
    spec.label.toLocaleLowerCase('pt-BR').includes('tipo de resistência'),
  )
  const resistencia = indiceResistencia >= 0
    ? { ...normalizadas[indiceResistencia], valor: RESISTENCIA_ATUAL }
    : { label: 'Tipo de Resistência', valor: RESISTENCIA_ATUAL }

  const semResistencia = normalizadas.filter((_, indice) => indice !== indiceResistencia)
  semResistencia.splice(Math.min(2, semResistencia.length), 0, resistencia)

  return semResistencia
}

export function normalizarFaqsLife(faqs: FaqLife[]): FaqLife[] {
  return faqs.map((faq) => ({
    pergunta: normalizarTextoPublicoLife(faq.pergunta),
    resposta: normalizarTextoPublicoLife(faq.resposta),
  }))
}
