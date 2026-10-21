import { describe, it, expect } from 'vitest'
import {
  gclidValido,
  montarTagGclid,
  anexarGclidAoTexto,
  montarLinkWhatsApp,
  gclidDeGclAw,
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
