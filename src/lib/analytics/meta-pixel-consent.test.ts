import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { concederConsentimentoPixel, revogarConsentimentoPixel, trackMeta } from './meta-pixel'
import { serializeConsent } from '../consent'

vi.mock('@/lib/consent', () => import('../consent'))

type Chamada = unknown[]
type FbqFake = ((...args: unknown[]) => void) & { queue: Chamada[]; callMethod?: (...args: unknown[]) => void }

// Reproduz a regra do fbevents.js: com lock de consentimento só 'consent' passa, e
// ao destravar a fila é drenada em ordem até encontrar um novo 'revoke'.
function criarFbq() {
  const enviados: Chamada[] = []
  let travado = false
  const executar = (a: Chamada) => {
    if (travado && a[0] !== 'consent') { fbq.queue.push(a); return }
    if (a[0] === 'consent') {
      travado = a[1] === 'revoke'
      if (!travado) drenar()
      return
    }
    enviados.push(a)
  }
  const drenar = () => { while (fbq.queue.length && !travado) executar(fbq.queue.shift()!) }
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  }) as FbqFake
  fbq.queue = []
  const carregar = () => { fbq.callMethod = (...args) => executar(args); drenar() }
  return { fbq, enviados, carregar, travado: () => travado }
}

const consentir = (marketing: boolean) => {
  ;(globalThis.document as unknown as { cookie: string }).cookie =
    `sixxis_consent=${serializeConsent({ analytics: marketing, marketing })}`
}
const eventos = (e: Chamada[]) => e.filter((a) => a[0] === 'track').map((a) => a[1])

let pixel: ReturnType<typeof criarFbq>

beforeEach(() => {
  pixel = criarFbq()
  vi.stubGlobal('window', { fbq: pixel.fbq })
  vi.stubGlobal('document', { cookie: '' })
})
afterEach(() => vi.unstubAllGlobals())

describe('concederConsentimentoPixel', () => {
  it('destrava mesmo com um revoke duplicado sobrando na fila', () => {
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    pixel.fbq('consent', 'revoke')
    pixel.carregar()
    expect(pixel.travado()).toBe(true)

    consentir(true)
    concederConsentimentoPixel()
    trackMeta('PageView')
    trackMeta('ViewContent', { value: 2100 })

    expect(pixel.travado()).toBe(false)
    expect(eventos(pixel.enviados)).toEqual(['PageView', 'ViewContent'])
    expect(pixel.fbq.queue).toHaveLength(0)
  })

  it('funciona quando o visitante aceita antes de o fbevents carregar', () => {
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    consentir(true)
    concederConsentimentoPixel()
    trackMeta('PageView')
    trackMeta('ViewContent', { value: 2100 })
    pixel.carregar()

    expect(pixel.travado()).toBe(false)
    expect(eventos(pixel.enviados)).toEqual(['PageView', 'ViewContent'])
  })

  it('preserva a ordem dos eventos que já estavam na fila', () => {
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    pixel.fbq('track', 'Antigo')
    pixel.fbq('consent', 'revoke')
    pixel.carregar()
    consentir(true)
    concederConsentimentoPixel()
    trackMeta('Novo')
    expect(eventos(pixel.enviados)).toEqual(['Antigo', 'Novo'])
  })

  it('trackMeta destrava o pixel se o aceite veio de outra aba', () => {
    pixel.carregar()
    pixel.fbq('consent', 'revoke')
    consentir(true)
    trackMeta('ViewContent', { value: 2100 })
    expect(eventos(pixel.enviados)).toEqual(['ViewContent'])
  })

  it('sem consentimento trackMeta não destrava nem envia', () => {
    pixel.carregar()
    pixel.fbq('consent', 'revoke')
    trackMeta('ViewContent', { value: 2100 })
    expect(pixel.travado()).toBe(true)
    expect(pixel.enviados).toHaveLength(0)
  })

  it('não quebra sem fbq', () => {
    vi.stubGlobal('window', {})
    expect(() => concederConsentimentoPixel()).not.toThrow()
  })
})

describe('revogarConsentimentoPixel', () => {
  const aceitarEEnviar = () => {
    consentir(true)
    concederConsentimentoPixel()
    trackMeta('PageView')
    trackMeta('ViewContent', { value: 2100 })
  }

  it('recusa logo depois de aceitar, antes do fbevents carregar: nada vai ao Meta', () => {
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    aceitarEEnviar()
    consentir(false)
    revogarConsentimentoPixel()
    pixel.carregar()

    expect(pixel.travado()).toBe(true)
    expect(pixel.enviados.filter((a) => a[0] === 'track')).toHaveLength(0)
  })

  it('novo aceite depois da recusa entrega cada evento uma vez', () => {
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    aceitarEEnviar()
    consentir(false)
    revogarConsentimentoPixel()
    pixel.carregar()

    consentir(true)
    concederConsentimentoPixel()

    expect(pixel.travado()).toBe(false)
    expect(eventos(pixel.enviados)).toEqual(['PageView', 'ViewContent'])
    expect(pixel.fbq.queue).toHaveLength(0)
  })

  it('o revoke nunca entra antes do init', () => {
    pixel.fbq('init', '1')
    pixel.fbq('track', 'Antigo')
    revogarConsentimentoPixel()
    expect(pixel.fbq.queue.map((a) => a[0])).toEqual(['init', 'consent', 'track'])
  })

  it('com o fbevents carregado trava na hora', () => {
    pixel.fbq('init', '1')
    pixel.carregar()
    revogarConsentimentoPixel()
    pixel.fbq('track', 'Depois')
    expect(pixel.travado()).toBe(true)
    expect(eventos(pixel.enviados)).toEqual([])
  })

  it('não quebra sem fbq', () => {
    vi.stubGlobal('window', {})
    expect(() => revogarConsentimentoPixel()).not.toThrow()
  })
})
