import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const uploadToR2 = vi.fn(async (_b: Buffer, key: string) => `https://cdn.example/${key}`)
const prismaFake = {
  avaliacao: { findUnique: vi.fn() },
  avaliacaoFoto: { create: vi.fn(async () => ({ id: 'foto_1' })) },
}
vi.mock('@/lib/r2', () => ({ uploadToR2 }))
vi.mock('@/lib/prisma', () => ({ prisma: prismaFake }))

const { POST } = await import('./route')

function req(conteudo: BlobPart, nome: string, tipo: string, avaliacaoId = 'av_1') {
  const fd = new FormData()
  fd.append('file', new File([conteudo], nome, { type: tipo }))
  fd.append('avaliacaoId', avaliacaoId)
  return new NextRequest('http://localhost/api/avaliacoes/fotos', { method: 'POST', body: fd })
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]) as unknown as BlobPart

describe('POST /api/avaliacoes/fotos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaFake.avaliacao.findUnique.mockResolvedValue({
      aprovada: false, createdAt: new Date(), _count: { fotos: 0 },
    })
  })

  it('não sobe HTML para o bucket mesmo com nome/tipo de imagem', async () => {
    const res = await POST(req('<html><script>alert(1)</script></html>', 'x.html', 'text/html'))
    expect(res.status).toBe(415)
    expect(uploadToR2).not.toHaveBeenCalled()
  })

  it('não sobe nada para avaliação inexistente', async () => {
    prismaFake.avaliacao.findUnique.mockResolvedValue(null)
    const res = await POST(req(JPEG, 'a.jpg', 'image/jpeg', 'nao-existe'))
    expect(res.status).toBe(403)
    expect(uploadToR2).not.toHaveBeenCalled()
  })

  it('aceita JPEG real e grava com extensão/tipo detectados (não os do cliente)', async () => {
    const res = await POST(req(JPEG, 'foto.exe', 'application/octet-stream'))
    expect(res.status).toBe(200)
    expect(uploadToR2).toHaveBeenCalledTimes(1)
    const [, key, contentType] = uploadToR2.mock.calls[0] as unknown as [Buffer, string, string]
    expect(key).toMatch(/^avaliacoes\/av_1\/\d+-[0-9a-f-]+\.jpg$/)
    expect(contentType).toBe('image/jpeg')
  })
})
