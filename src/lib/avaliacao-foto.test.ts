import { describe, expect, it } from 'vitest'
import {
  JANELA_UPLOAD_FOTO_MS,
  MAX_FOTOS_POR_AVALIACAO,
  detectarTipoImagem,
  recusaUploadFoto,
} from './avaliacao-foto'

const bytes = (...b: number[]) => Uint8Array.from(b)

describe('detectarTipoImagem', () => {
  it('reconhece JPEG, PNG e WebP pela assinatura', () => {
    expect(detectarTipoImagem(bytes(0xff, 0xd8, 0xff, 0xe0))?.contentType).toBe('image/jpeg')
    expect(detectarTipoImagem(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe('png')
    const webp = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)
    expect(detectarTipoImagem(webp)?.contentType).toBe('image/webp')
  })

  it('recusa HTML/SVG/executável mesmo que o cliente diga que é imagem', () => {
    const html = new TextEncoder().encode('<html><script>alert(1)</script></html>')
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    const elf = bytes(0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0)
    expect(detectarTipoImagem(html)).toBeNull()
    expect(detectarTipoImagem(svg)).toBeNull()
    expect(detectarTipoImagem(elf)).toBeNull()
    expect(detectarTipoImagem(bytes())).toBeNull()
  })
})

describe('recusaUploadFoto', () => {
  const agora = new Date('2026-11-16T12:00:00Z')
  const recente = new Date(agora.getTime() - 5 * 60 * 1000)

  it('aceita avaliação recém-criada, pendente e abaixo do limite', () => {
    expect(recusaUploadFoto({ aprovada: false, createdAt: recente, totalFotos: 0 }, agora)).toBeNull()
  })

  it('recusa avaliação inexistente (id arbitrário)', () => {
    expect(recusaUploadFoto(null, agora)).toBe('AVALIACAO_INEXISTENTE')
  })

  it('recusa avaliação já aprovada (não deixa trocar foto de avaliação pública)', () => {
    expect(recusaUploadFoto({ aprovada: true, createdAt: recente, totalFotos: 0 }, agora)).toBe('AVALIACAO_JA_APROVADA')
  })

  it('recusa fora da janela de upload', () => {
    const antiga = new Date(agora.getTime() - JANELA_UPLOAD_FOTO_MS - 1)
    expect(recusaUploadFoto({ aprovada: false, createdAt: antiga, totalFotos: 0 }, agora)).toBe('JANELA_EXPIRADA')
  })

  it('recusa acima do limite de fotos', () => {
    expect(
      recusaUploadFoto({ aprovada: false, createdAt: recente, totalFotos: MAX_FOTOS_POR_AVALIACAO }, agora),
    ).toBe('LIMITE_FOTOS')
  })
})
