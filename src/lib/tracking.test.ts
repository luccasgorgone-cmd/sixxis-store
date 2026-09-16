import { describe, expect, it } from 'vitest'
import { extrairUTMs, lerLandingPageSessao, obterLandingPageSessao } from './tracking'

function storageFake() {
  const dados = new Map<string, string>()
  return {
    getItem: (key: string) => dados.get(key) ?? null,
    setItem: (key: string, value: string) => { dados.set(key, value) },
  }
}

describe('extrairUTMs', () => {
  it('lê os utm_* normalmente quando presentes (Meta/UTM manual)', () => {
    const r = extrairUTMs('https://sixxis.com.br/?utm_source=facebook&utm_medium=cpc&utm_campaign=camp1')
    expect(r).toMatchObject({ utmSource: 'facebook', utmMedium: 'cpc', utmCampaign: 'camp1' })
  })

  it('fallback: gclid sem utm_source vira source=google/medium=cpc e persiste o gclid', () => {
    const r = extrairUTMs('https://sixxis.com.br/produtos/sx040?gclid=Cj0KCQjw123abc')
    expect(r).toMatchObject({ utmSource: 'google', utmMedium: 'cpc', gclid: 'Cj0KCQjw123abc' })
  })

  it('não sintetiza source/medium quando já há utm_source, mesmo com gclid presente', () => {
    const r = extrairUTMs('https://sixxis.com.br/?utm_source=google&utm_medium=email&gclid=abc123')
    expect(r).toMatchObject({ utmSource: 'google', utmMedium: 'email', gclid: 'abc123' })
  })

  it('sem utm_source e sem gclid: utmSource/utmMedium ficam undefined (comportamento antigo)', () => {
    const r = extrairUTMs('https://sixxis.com.br/produtos/sx040')
    expect(r.utmSource).toBeUndefined()
    expect(r.utmMedium).toBeUndefined()
    expect(r.gclid).toBeUndefined()
  })

  it('URL inválida retorna objeto vazio, sem lançar', () => {
    expect(extrairUTMs('não-é-uma-url')).toEqual({})
  })

  it('persiste a URL completa do primeiro contato da sessão', () => {
    const storage = storageFake()
    const primeira = 'https://sixxis.com.br/produtos/sx040?gclid=primeiro&utm_campaign=pmax'

    expect(obterLandingPageSessao(storage, 'sid-1', primeira)).toBe(primeira)
    expect(lerLandingPageSessao(storage, 'sid-1')).toBe(primeira)
  })

  it('não sobrescreve o primeiro contato em eventos ou navegações duplicadas', () => {
    const storage = storageFake()
    const primeira = 'https://sixxis.com.br/?gclid=primeiro'
    obterLandingPageSessao(storage, 'sid-1', primeira)

    expect(obterLandingPageSessao(storage, 'sid-1', 'https://sixxis.com.br/produtos/sx040?gclid=segundo')).toBe(primeira)
    expect(lerLandingPageSessao(storage, 'sid-1')).toBe(primeira)
  })
})
