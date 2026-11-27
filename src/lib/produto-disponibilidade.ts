export interface AvisoEntregaProduto {
  titulo: string
  mensagem: string
}

const AVISOS_ENTREGA: Readonly<Record<string, AvisoEntregaProduto>> = {
  'sx200-trend': {
    titulo: 'Prazo de entrega',
    mensagem: 'A partir de 15/12/2026',
  },
}

export function avisoEntregaProduto(slug: string | null | undefined): AvisoEntregaProduto | null {
  if (!slug) return null
  return AVISOS_ENTREGA[slug] ?? null
}
