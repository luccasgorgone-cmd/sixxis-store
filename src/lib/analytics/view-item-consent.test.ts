import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acompanharViewItem, type ProdutoTracking } from './events'
import { CONSENT_EVENT, serializeConsent } from '../consent'

// A suite roda sem alias '@/': aponta os imports internos para os módulos reais.
vi.mock('@/lib/consent', () => import('../consent'))
vi.mock('@/lib/tracking', () => import('../tracking'))
vi.mock('@/lib/analytics/meta-pixel', () => import('./meta-pixel'))

const produto: ProdutoTracking = {
  item_id: 'CLIM-SX070-TREND',
  produto_id: 'cuid-interno',
  item_slug: 'sx070-trend',
  item_name: 'Climatizador SX070 Trend',
  price: 2100,
}

let fbq: ReturnType<typeof vi.fn>
let fetchMock: ReturnType<typeof vi.fn>
let janela: EventTarget & Record<string, unknown>

function consentir(analytics: boolean, marketing: boolean) {
  ;(globalThis.document as unknown as { cookie: string }).cookie =
    `sixxis_consent=${serializeConsent({ analytics, marketing })}; sixxis_sid=sessao-teste`
}
const viewContents = () => fbq.mock.calls.filter((c) => c[0] === 'track' && c[1] === 'ViewContent')
const viewItems = () => (janela.dataLayer as { event?: string }[] | undefined ?? []).filter((e) => e.event === 'view_item')
const internos = () => fetchMock.mock.calls.filter((c) => c[0] === '/api/tracking')

function aceitar(analytics = true, marketing = true) {
  consentir(analytics, marketing)
  janela.dispatchEvent(new Event(CONSENT_EVENT))
  vi.runAllTimers()
}

beforeEach(() => {
  vi.useFakeTimers()
  fbq = vi.fn()
  fetchMock = vi.fn(() => Promise.resolve(new Response('{}')))
  janela = Object.assign(new EventTarget(), {
    fbq,
    location: { href: 'https://www.sixxis.com.br/produtos/sx070-trend', pathname: '/produtos/sx070-trend' },
    sessionStorage: { getItem: () => null, setItem: () => undefined },
  }) as unknown as EventTarget & Record<string, unknown>
  vi.stubGlobal('window', janela)
  vi.stubGlobal('document', { cookie: 'sixxis_sid=sessao-teste' })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('acompanharViewItem', () => {
  it('visitante recorrente com consentimento dispara uma vez no load', () => {
    consentir(true, true)
    acompanharViewItem(produto)
    vi.runAllTimers()
    expect(viewContents()).toHaveLength(1)
    expect(viewItems()).toHaveLength(1)
    expect(internos()).toHaveLength(1)
  })

  it('sem consentimento nao envia nada', () => {
    acompanharViewItem(produto)
    vi.runAllTimers()
    expect(fbq).not.toHaveBeenCalled()
    expect(viewItems()).toHaveLength(0)
    expect(internos()).toHaveLength(0)
  })

  it('visitante novo que aceita o banner na PDP recupera o ViewContent e o view_item', () => {
    acompanharViewItem(produto)
    aceitar()
    expect(viewContents()).toHaveLength(1)
    expect(viewContents()[0][2]).toMatchObject({ content_ids: ['CLIM-SX070-TREND'], value: 2100, currency: 'BRL' })
    expect(viewItems()).toHaveLength(1)
    expect(internos()).toHaveLength(1)
  })

  it('o ViewContent sai depois dos listeners sincronos de consentimento', () => {
    const ordem: string[] = []
    fbq.mockImplementation((m: string, ev: string) => { if (m === 'track') ordem.push(ev) })
    acompanharViewItem(produto)
    janela.addEventListener(CONSENT_EVENT, () => ordem.push('grant'))
    consentir(true, true)
    janela.dispatchEvent(new Event(CONSENT_EVENT))
    expect(ordem).toEqual(['grant'])
    vi.runAllTimers()
    expect(ordem).toEqual(['grant', 'ViewContent'])
  })

  it('nao duplica quando o consentimento e reemitido', () => {
    consentir(true, true)
    acompanharViewItem(produto)
    aceitar()
    aceitar()
    expect(viewContents()).toHaveLength(1)
    expect(viewItems()).toHaveLength(1)
    expect(internos()).toHaveLength(1)
  })

  it('respeita cada categoria e completa so o canal que faltava', () => {
    acompanharViewItem(produto)
    aceitar(true, false)
    expect(viewContents()).toHaveLength(0)
    expect(viewItems()).toHaveLength(1)
    aceitar(true, true)
    expect(viewContents()).toHaveLength(1)
    expect(viewItems()).toHaveLength(1)
    expect(internos()).toHaveLength(1)
  })

  it('apos desmontar nao dispara mais', () => {
    const parar = acompanharViewItem(produto)
    consentir(true, true)
    janela.dispatchEvent(new Event(CONSENT_EVENT))
    parar()
    vi.runAllTimers()
    expect(fbq).not.toHaveBeenCalled()
  })
})
