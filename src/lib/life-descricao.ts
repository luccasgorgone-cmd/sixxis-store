const FRASE_INCORRETA = 'Pedalada com resistência magnética ajustável em 10 níveis.'
const FRASE_OFICIAL = 'Pedalada com resistência magnética ajustável em 8 níveis.'

export function normalizarNiveisLife(descricao: string): string {
  if (descricao.includes(FRASE_OFICIAL) && !descricao.includes(FRASE_INCORRETA)) {
    return descricao
  }

  if (!descricao.includes(FRASE_INCORRETA)) {
    throw new Error('Descrição da Sixxis Life não contém a frase esperada')
  }

  return descricao.replace(FRASE_INCORRETA, FRASE_OFICIAL)
}
