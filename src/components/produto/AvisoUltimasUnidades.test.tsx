import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AvisoUltimasUnidades from './AvisoUltimasUnidades'

describe('AvisoUltimasUnidades', () => {
  it('renderiza o saldo do lote no modo compacto do card', () => {
    const html = renderToStaticMarkup(
      <AvisoUltimasUnidades saldo={{ loteInicial: 12, restantes: 12 }} modo="card" />,
    )

    expect(html).toContain('Últimas 12 unidades do lote Black Friday')
    expect(html).toContain('aria-live="polite"')
  })

  it('detalha os saldos por cor no card da Sixxis Life', () => {
    const html = renderToStaticMarkup(
      <AvisoUltimasUnidades
        saldo={{ loteInicial: 24, restantes: 24 }}
        modo="card"
        variacoes={[
          { nome: 'Preta', estoquePromocional: { loteInicial: 14, restantes: 14 } },
          { nome: 'Branca', estoquePromocional: { loteInicial: 10, restantes: 10 } },
        ]}
      />,
    )

    expect(html).toContain('Preta: 14')
    expect(html).toContain('Branca: 10')
  })

  it('usa a mensagem singular na última unidade', () => {
    const html = renderToStaticMarkup(
      <AvisoUltimasUnidades saldo={{ loteInicial: 10, restantes: 1 }} />,
    )

    expect(html).toContain('Última unidade do lote Black Friday')
  })

  it('não renderiza alerta quando o lote acabou', () => {
    expect(renderToStaticMarkup(
      <AvisoUltimasUnidades saldo={{ loteInicial: 10, restantes: 0 }} />,
    )).toBe('')
  })
})
