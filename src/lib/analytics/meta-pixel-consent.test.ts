import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  concederConsentimentoPixel,
  criarSincronizadorPixel,
  observarConsentimentoPixel,
  revogarConsentimentoPixel,
  trackMeta,
} from './meta-pixel'
import { CONSENT_EVENT, gravarConsentClient, serializeConsent } from '../consent'

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

// window/document que despacham eventos, para exercitar os listeners reais.
function ambienteComEventos() {
  const win = Object.assign(new EventTarget(), { fbq: pixel.fbq })
  const doc = Object.assign(new EventTarget(), { cookie: '', visibilityState: 'visible' })
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', doc)
  return { win, doc }
}
// PageView que o próprio fbevents manda numa navegação SPA (pushState), sem
// passar pelo trackMeta. Só o lock de consentimento o segura.
const pageViewAutomaticoDoFbevents = () => pixel.fbq('track', 'PageView')

describe('criarSincronizadorPixel + observarConsentimentoPixel', () => {
  // Fecha todos os observadores: um BroadcastChannel aberto receberia mensagens do próximo teste.
  const paradas: Array<() => void> = []
  const observar = (sync: () => void) => {
    const parar = observarConsentimentoPixel(sync)
    paradas.push(parar)
    return parar
  }
  afterEach(() => { while (paradas.length) paradas.pop()!() })
  const proximaMensagem = () => new Promise((r) => setTimeout(r, 30))

  const abaAceitaAoVivo = () => {
    const amb = ambienteComEventos()
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    pixel.carregar()
    const sync = criarSincronizadorPixel()
    sync()
    const parar = observar(sync)
    consentir(true)
    amb.win.dispatchEvent(new Event(CONSENT_EVENT))
    return { ...amb, parar }
  }

  it('aceite ao vivo libera e manda o PageView inicial uma vez', () => {
    const { win } = abaAceitaAoVivo()
    win.dispatchEvent(new Event(CONSENT_EVENT))
    win.dispatchEvent(new Event('focus'))
    expect(pixel.travado()).toBe(false)
    expect(eventos(pixel.enviados)).toEqual(['PageView'])
  })

  it('recusa em outra aba: ao ganhar foco a aba trava antes da navegação', () => {
    const { win } = abaAceitaAoVivo()
    const antes = pixel.enviados.length
    consentir(false) // cookie mudou na outra aba, sem CONSENT_EVENT aqui
    win.dispatchEvent(new Event('focus'))
    pageViewAutomaticoDoFbevents()
    trackMeta('AddToCart')
    expect(pixel.travado()).toBe(true)
    expect(pixel.enviados.slice(antes)).toEqual([])
  })

  it('recusa em outra aba: voltar a aba visível também trava', () => {
    const { doc } = abaAceitaAoVivo()
    const antes = pixel.enviados.length
    consentir(false)
    doc.dispatchEvent(new Event('visibilitychange'))
    pageViewAutomaticoDoFbevents()
    expect(pixel.enviados.slice(antes)).toEqual([])
  })

  it('aba ficando oculta não ressincroniza', () => {
    const { doc } = abaAceitaAoVivo()
    consentir(false)
    doc.visibilityState = 'hidden'
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(pixel.travado()).toBe(false)
  })

  it('aceite em outra aba: ao ganhar foco libera e manda o PageView inicial', () => {
    const { win } = ambienteComEventos()
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    pixel.carregar()
    const sync = criarSincronizadorPixel()
    sync()
    observar(sync)
    consentir(true)
    win.dispatchEvent(new Event('focus'))
    expect(pixel.travado()).toBe(false)
    expect(eventos(pixel.enviados)).toEqual(['PageView'])
  })

  it('já consentido no load não repete o PageView do snippet', () => {
    const { win } = ambienteComEventos()
    consentir(true)
    pixel.fbq('init', '1')
    pixel.carregar()
    const sync = criarSincronizadorPixel()
    sync()
    observar(sync)
    win.dispatchEvent(new Event('focus'))
    expect(eventos(pixel.enviados)).toEqual([])
  })

  it('a limpeza remove todos os listeners', () => {
    const { win, doc, parar } = abaAceitaAoVivo()
    parar()
    consentir(false)
    win.dispatchEvent(new Event('focus'))
    win.dispatchEvent(new Event('pageshow'))
    win.dispatchEvent(new Event(CONSENT_EVENT))
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(pixel.travado()).toBe(false)
  })

  it('recusa em outra aba: a aba em segundo plano trava pelo canal, sem foco', async () => {
    abaAceitaAoVivo()
    const antes = pixel.enviados.length
    gravarConsentClient({ analytics: false, marketing: false }) // a outra aba grava e avisa
    await proximaMensagem()
    pageViewAutomaticoDoFbevents() // ex.: Pix aprovado faz router.push com a aba oculta
    expect(pixel.travado()).toBe(true)
    expect(pixel.enviados.slice(antes)).toEqual([])
  })

  it('aceite em outra aba chega pelo canal e manda o PageView inicial uma vez', async () => {
    ambienteComEventos()
    pixel.fbq('init', '1')
    pixel.fbq('consent', 'revoke')
    pixel.carregar()
    const sync = criarSincronizadorPixel()
    sync()
    observar(sync)
    gravarConsentClient({ analytics: true, marketing: true })
    await proximaMensagem()
    gravarConsentClient({ analytics: true, marketing: true })
    await proximaMensagem()
    expect(pixel.travado()).toBe(false)
    expect(eventos(pixel.enviados)).toEqual(['PageView'])
  })

  it('a limpeza fecha o canal', async () => {
    const { parar } = abaAceitaAoVivo()
    parar()
    gravarConsentClient({ analytics: false, marketing: false })
    await proximaMensagem()
    expect(pixel.travado()).toBe(false)
  })
})
