import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import vm from 'node:vm'
import { scriptBasePixel } from './meta-pixel-snippet'
import { criarSincronizadorPixel, trackMetaPageView } from './meta-pixel'
import { serializeConsent } from '../consent'

vi.mock('@/lib/consent', () => import('../consent'))

// Modelo das regras do fbevents.js 2.9.441 que importam aqui (lidas no código real):
//  • ao carregar, se fbq.disablePushState !== true, envolve history.pushState,
//    replaceState e popstate e, a cada troca de URL, manda um PageView AUTOMÁTICO
//    (trackCustom PageView com allowDuplicatePageViews), que respeita só o lock de
//    consentimento do próprio fbq, não o nosso cookie;
//  • fbq('track','PageView') depois do primeiro PageView da página é descartado,
//    a não ser que fbq.allowDuplicatePageViews seja true;
//  • com lock (consent revoke) só 'consent' passa; o resto espera na fila.
type Envio = { evento: string; automatico: boolean }

function montarPagina(consentimentoInicial: boolean) {
  const enviados: Envio[] = []
  const docFake = {
    cookie: `sixxis_consent=${serializeConsent({ analytics: consentimentoInicial, marketing: consentimentoInicial })}`,
    createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: () => {} } }],
  }
  const loc = { href: 'https://www.sixxis.com.br/' }
  const historico = {
    pushState: (_s: unknown, _t: string, url: string) => { loc.href = `https://www.sixxis.com.br${url}` },
    replaceState: (_s: unknown, _t: string, url: string) => { loc.href = `https://www.sixxis.com.br${url}` },
  }
  const win: Record<string, unknown> = { document: docFake, location: loc, history: historico }
  win.window = win
  vm.runInNewContext(scriptBasePixel('500285526352954'), win)

  type Fbq = ((...a: unknown[]) => void) & {
    queue: unknown[][]; callMethod?: (...a: unknown[]) => void
    disablePushState?: boolean; allowDuplicatePageViews?: boolean
  }
  const fbq = win.fbq as Fbq
  let travado = false
  let pageViewJaSaiu = false
  const enviar = (evento: string, automatico: boolean) => {
    if (evento === 'PageView' && pageViewJaSaiu && !automatico && fbq.allowDuplicatePageViews !== true) return
    if (evento === 'PageView') pageViewJaSaiu = true
    enviados.push({ evento, automatico })
  }
  const executar = (a: unknown[], automatico = false) => {
    if (travado && a[0] !== 'consent') { fbq.queue.push(a); return }
    if (a[0] === 'consent') { travado = a[1] === 'revoke'; if (!travado) drenar(); return }
    if (a[0] === 'track' || a[0] === 'trackCustom') enviar(String(a[1]), automatico)
  }
  const drenar = () => { while (fbq.queue.length && !travado) executar(fbq.queue.shift()!) }

  // "Carrega" o fbevents.js.
  fbq.callMethod = (...a: unknown[]) => executar(a)
  drenar()
  if (fbq.disablePushState !== true) {
    const original = historico.pushState
    historico.pushState = (s, t, url) => {
      const antes = loc.href
      original(s, t, url)
      if (loc.href !== antes) executar(['trackCustom', 'PageView'], true)
    }
  }

  vi.stubGlobal('window', win)
  vi.stubGlobal('document', docFake)
  return {
    enviados,
    navegar: (url: string) => historico.pushState(null, '', url),
    gravarConsentimento: (marketing: boolean) => {
      docFake.cookie = `sixxis_consent=${serializeConsent({ analytics: marketing, marketing })}`
    },
    pageViews: () => enviados.filter((e) => e.evento === 'PageView').length,
  }
}

// O <MetaPixelRouter/> chama trackMetaPageView() a cada troca de pathname (pula a 1ª).
function navegarComRouter(p: ReturnType<typeof montarPagina>, url: string) {
  p.navegar(url)
  trackMetaPageView()
}

beforeEach(() => vi.unstubAllGlobals())
afterEach(() => vi.unstubAllGlobals())

describe('PageView de rota (fbevents real tem gancho em pushState)', () => {
  it('recusa em OUTRA aba (sem aviso a esta): a navegação seguinte não envia PageView', () => {
    const p = montarPagina(true)
    criarSincronizadorPixel() // aba aberta com consentimento: fbq destravado
    expect(p.pageViews()).toBe(1) // PageView do load

    p.gravarConsentimento(false) // outra aba recusou; nenhum evento chegou aqui
    navegarComRouter(p, '/produtos/sx100-trend')
    navegarComRouter(p, '/carrinho')

    expect(p.pageViews()).toBe(1)
  })

  it('com consentimento: exatamente 1 PageView por rota, nenhum automático', () => {
    const p = montarPagina(true)
    navegarComRouter(p, '/produtos')
    navegarComRouter(p, '/produtos/sx100-trend')
    navegarComRouter(p, '/carrinho')

    expect(p.pageViews()).toBe(4) // load + 3 rotas
    expect(p.enviados.filter((e) => e.automatico)).toHaveLength(0)
  })

  it('sem consentimento: nenhuma rota envia PageView', () => {
    const p = montarPagina(false)
    navegarComRouter(p, '/produtos')
    navegarComRouter(p, '/carrinho')
    expect(p.pageViews()).toBe(0)
  })

  it('o código base liga os dois flags antes do init', () => {
    const s = scriptBasePixel('1')
    const init = s.indexOf("fbq('init'")
    expect(s.indexOf('fbq.disablePushState=true')).toBeGreaterThan(-1)
    expect(s.indexOf('fbq.disablePushState=true')).toBeLessThan(init)
    expect(s.indexOf('fbq.allowDuplicatePageViews=true')).toBeGreaterThan(-1)
    expect(s.indexOf('fbq.allowDuplicatePageViews=true')).toBeLessThan(init)
  })
})
