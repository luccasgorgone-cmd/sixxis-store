import { describe, expect, it } from 'vitest'
import { capaVitrine, galeriaVitrine } from './capa-vitrine'

const LATERAL = 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1785262376861-8vi6jj4.jpg'
const SX120_3Q = 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/catalog/sx120-card-cover-2026-11-25/sx120-prime/4b3c4e95be63322c-sx120-prime-branco-3q-card-1600.jpg'

describe('capaVitrine', () => {
  it('usa a lateral oficial do SX100 quando ela está na galeria', () => {
    expect(capaVitrine('sx100-trend', ['frontal.jpg', LATERAL])).toBe(LATERAL)
  })

  it('não usa a lateral se ela saiu da galeria do produto', () => {
    expect(capaVitrine('sx100-trend', ['frontal.jpg'])).toBe('frontal.jpg')
  })

  it('mantém a primeira foto dos demais produtos', () => {
    expect(capaVitrine('sx060-prime', ['a.jpg', LATERAL])).toBe('a.jpg')
  })

  it('usa o ângulo oficial do SX120 quando ele está na galeria', () => {
    expect(capaVitrine('sx120-prime', ['frontal.jpg', SX120_3Q])).toBe(SX120_3Q)
  })

  it('mantém a frontal do SX120 se o ângulo saiu da galeria', () => {
    expect(capaVitrine('sx120-prime', ['frontal.jpg'])).toBe('frontal.jpg')
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
    expect(galeriaVitrine('sx060-prime', fotos)).toBe(fotos)
  })

  it('abre a galeria do SX120 no ângulo sem duplicar a capa', () => {
    expect(galeriaVitrine('sx120-prime', ['frontal.jpg', SX120_3Q, 'detalhe.jpg', SX120_3Q])).toEqual([
      SX120_3Q,
      'frontal.jpg',
      'detalhe.jpg',
    ])
  })
})
