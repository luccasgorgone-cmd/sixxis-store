import { describe, expect, it } from 'vitest'
import { capaVitrine, galeriaVitrine } from './capa-vitrine'

const LATERAL = 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1785262376861-8vi6jj4.jpg'

describe('capaVitrine', () => {
  it('usa a lateral oficial do SX100 quando ela está na galeria', () => {
    expect(capaVitrine('sx100-trend', ['frontal.jpg', LATERAL])).toBe(LATERAL)
  })

  it('não usa a lateral se ela saiu da galeria do produto', () => {
    expect(capaVitrine('sx100-trend', ['frontal.jpg'])).toBe('frontal.jpg')
  })

  it('mantém a primeira foto dos demais produtos', () => {
    expect(capaVitrine('sx120-prime', ['a.jpg', LATERAL])).toBe('a.jpg')
  })

  it('devolve null sem imagens válidas', () => {
    expect(capaVitrine('sx100-trend', null)).toBeNull()
    expect(capaVitrine('sx100-trend', [null, ''])).toBeNull()
  })

  it('abre a galeria na lateral sem perder nenhuma foto', () => {
    expect(galeriaVitrine('sx100-trend', ['frontal.jpg', LATERAL, 'tras.jpg'])).toEqual([LATERAL, 'frontal.jpg', 'tras.jpg'])
  })

  it('não mexe na galeria dos demais produtos', () => {
    const fotos = ['a.jpg', LATERAL]
    expect(galeriaVitrine('sx120-prime', fotos)).toBe(fotos)
  })
})
