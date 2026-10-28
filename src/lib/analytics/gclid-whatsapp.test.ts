import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  gclidValido,
  montarTagGclid,
  anexarGclidAoTexto,
  montarLinkWhatsApp,
  gclidDeGclAw,
  lerGclidClient,
} from './gclid-whatsapp'

const GCLID = 'CjwKCAjw_eLVBhBEEiwAeaYZfPn2pQ49T6n9HL2PTo0Y7J9gSSyWW8sr1cYQ'

describe('gclidValido', () => {
  it('aceita gclid base64url', () => {
    expect(gclidValido(GCLID)).toBe(true)
    expect(gclidValido('abc-123_XYZ')).toBe(true)
  })
  it('aceita ponto no charset (acordo CRM v1 [A-Za-z0-9_.-])', () => {
    expect(gclidValido('abc.def-123_XYZ')).toBe(true)
  })
  it('rejeita vazio, nulo e com caracteres perigosos', () => {
    expect(gclidValido('')).toBe(false)
    expect(gclidValido(null)).toBe(false)
    expect(gclidValido(undefined)).toBe(false)
    expect(gclidValido('tem espaco')).toBe(false)
    expect(gclidValido('quebra\nlinha')).toBe(false)
    expect(gclidValido('com]colchete')).toBe(false)
  })
})

describe('montarTagGclid', () => {
  it('monta marcador parseável', () => {
    expect(montarTagGclid(GCLID)).toBe(`[#g:${GCLID}]`)
  })
  it('gclid ausente/inválido → string vazia', () => {
    expect(montarTagGclid(undefined)).toBe('')
    expect(montarTagGclid('x y')).toBe('')
  })
})

describe('anexarGclidAoTexto', () => {
  const base = 'Olá! Vim pelo site Sixxis.'
  it('anexa com 2 quebras quando há gclid', () => {
    expect(anexarGclidAoTexto(base, GCLID)).toBe(`${base}\n\n[#g:${GCLID}]`)
  })
  it('mantém texto intacto sem gclid', () => {
    expect(anexarGclidAoTexto(base, undefined)).toBe(base)
    expect(anexarGclidAoTexto(base, '')).toBe(base)
  })
})

describe('montarLinkWhatsApp', () => {
  it('monta wa.me com texto url-encoded + tag', () => {
    const url = montarLinkWhatsApp('5518997474701', 'Olá!', GCLID)
    expect(url.startsWith('https://wa.me/5518997474701?text=')).toBe(true)
    const texto = decodeURIComponent(url.split('text=')[1])
    expect(texto).toBe(`Olá!\n\n[#g:${GCLID}]`)
  })
  it('sem gclid → wa.me só com o texto base', () => {
    const url = montarLinkWhatsApp('5518997474701', 'Olá!')
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Olá!')
  })
})

describe('gclidDeGclAw', () => {
  it('extrai gclid do formato GCL.<ts>.<gclid>', () => {
    expect(gclidDeGclAw(`GCL.1700000000.${GCLID}`)).toBe(GCLID)
  })
  it('formato inválido → undefined', () => {
    expect(gclidDeGclAw('GCL.123')).toBeUndefined()
    expect(gclidDeGclAw('')).toBeUndefined()
    expect(gclidDeGclAw(null)).toBeUndefined()
    expect(gclidDeGclAw(undefined)).toBeUndefined()
  })
})

// ── lerGclidClient: leitura client em 3 fontes, ordem de confiança ──────────
// Em env node o window/document não existem → stub por teste, limpo no afterEach.
function stubBrowser(opts: { search?: string; cookie?: string; session?: string | null }) {
  const { search = '', cookie = '', session = null } = opts
  vi.stubGlobal('window', {
    location: { search },
    sessionStorage: {
      getItem: (k: string) => (k === 'sixxis_utms' ? session : null),
    },
  })
  vi.stubGlobal('document', { cookie })
}

describe('lerGclidClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fonte 1: param gclid da URL vence as demais', () => {
    stubBrowser({
      search: `?gclid=${GCLID}`,
      cookie: `_gcl_aw=GCL.1700000000.CjwKoutroCOOKIE`,
      session: JSON.stringify({ gclid: 'sessaoOUTRO' }),
    })
    expect(lerGclidClient()).toBe(GCLID)
  })

  it('fonte 2: cookie _gcl_aw quando a URL não tem gclid', () => {
    stubBrowser({ cookie: `foo=bar; _gcl_aw=GCL.1700000000.${GCLID}; baz=1` })
    expect(lerGclidClient()).toBe(GCLID)
  })

  it('fonte 3: sessionStorage sixxis_utms quando URL e cookie faltam', () => {
    stubBrowser({ session: JSON.stringify({ gclid: GCLID }) })
    expect(lerGclidClient()).toBe(GCLID)
  })

  it('gclid inválido na URL é ignorado e cai pro cookie', () => {
    stubBrowser({
      search: '?gclid=tem%20espaco',
      cookie: `_gcl_aw=GCL.1700000000.${GCLID}`,
    })
    expect(lerGclidClient()).toBe(GCLID)
  })

  it('sessionStorage corrompido não explode → undefined (fontes vazias)', () => {
    stubBrowser({ session: '{not json' })
    expect(lerGclidClient()).toBeUndefined()
  })

  it('nenhuma fonte válida → undefined', () => {
    stubBrowser({ search: '', cookie: '', session: null })
    expect(lerGclidClient()).toBeUndefined()
  })

  it('fora do browser (sem window) → undefined', () => {
    // sem stub: env node não tem window
    expect(lerGclidClient()).toBeUndefined()
  })
})
