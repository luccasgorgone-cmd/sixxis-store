import { describe, expect, it } from 'vitest'
import { textoMontagemProduto } from './produto-montagem'

describe('textoMontagemProduto', () => {
  it('explica a montagem dos climatizadores sem dizer que chegam montados', () => {
    const texto = textoMontagemProduto('climatizadores')

    expect(texto).toBe('Chega quase pronto: é só encaixar as rodinhas.')
    expect(texto).not.toMatch(/chega montado|pronto para usar/i)
  })

  it('explica a montagem simples das bikes sem prometer ausência de ferramentas', () => {
    const texto = textoMontagemProduto('spinning')

    expect(texto).toContain('Montagem simples')
    expect(texto).not.toMatch(/sem ferramentas?|chega montado|pronto para usar/i)
  })

  it('não mostra aviso para categorias fora do escopo confirmado', () => {
    expect(textoMontagemProduto('aspiradores')).toBeNull()
    expect(textoMontagemProduto(null)).toBeNull()
  })
})
