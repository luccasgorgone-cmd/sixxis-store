import { describe, expect, it } from 'vitest'
import { extrairGaSessionId } from './ga-attribution'

describe('extrairGaSessionId', () => {
  it('lê o session_id do cookie GA4 legado GS1', () => {
    expect(extrairGaSessionId('GS1.1.1758012345.7.1.1758012399.0.0.0')).toBe('1758012345')
  })

  it('lê o session_id do cookie GA4 atual GS2', () => {
    expect(extrairGaSessionId('GS2.1.s1758012345$o7$g1$t1758012399$j0$l0$h0')).toBe('1758012345')
  })

  it('não inventa session_id para cookie inválido', () => {
    expect(extrairGaSessionId('invalido')).toBeUndefined()
  })
})
