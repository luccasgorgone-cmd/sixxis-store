import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AvisoPrazoEntrega from './AvisoPrazoEntrega'

describe('AvisoPrazoEntrega', () => {
  it('exibe o prazo especial de entrega do produto', () => {
    const html = renderToStaticMarkup(
      <AvisoPrazoEntrega aviso={{ titulo: 'Prazo de entrega', mensagem: 'A partir de 15/12/2026' }} />,
    )

    expect(html).toContain('Prazo de entrega')
    expect(html).toContain('A partir de 15/12/2026')
  })

  it('não renderiza sem aviso', () => {
    expect(renderToStaticMarkup(<AvisoPrazoEntrega aviso={null} />)).toBe('')
  })
})
