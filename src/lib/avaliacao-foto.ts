// Regras de upload de foto de avaliação (rota pública /api/avaliacoes/fotos).
//
// A rota é anônima por design (quem avalia não precisa de conta), então ela
// precisa se defender sozinha: só aceita imagem real (assinatura de bytes, não
// o Content-Type/extensão enviados pelo cliente), com teto de tamanho, e só
// para uma avaliação RECÉM-criada, ainda não aprovada e com menos de
// MAX_FOTOS_POR_AVALIACAO fotos. Sem isso, qualquer pessoa sobe arquivo
// arbitrário (HTML, executável, tamanho ilimitado) no bucket público.
//
// Módulo puro (sem prisma/R2) para ser testável em isolamento.

export const MAX_BYTES_FOTO_AVALIACAO = 10 * 1024 * 1024 // 10 MB (foto de celular)
export const MAX_FOTOS_POR_AVALIACAO = 5 // mesmo teto da UI (AvaliacoesProduto)
export const JANELA_UPLOAD_FOTO_MS = 60 * 60 * 1000 // 1 h após criar a avaliação

export type TipoImagem = { ext: 'jpg' | 'png' | 'webp'; contentType: string }

/** Detecta o tipo real pela assinatura (magic bytes). null = não é imagem aceita. */
export function detectarTipoImagem(buf: Uint8Array): TipoImagem | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', contentType: 'image/jpeg' }
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return { ext: 'png', contentType: 'image/png' }
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && // RIFF
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50 // WEBP
  ) {
    return { ext: 'webp', contentType: 'image/webp' }
  }
  return null
}

export type MotivoRecusaFoto =
  | 'AVALIACAO_INEXISTENTE'
  | 'AVALIACAO_JA_APROVADA'
  | 'JANELA_EXPIRADA'
  | 'LIMITE_FOTOS'

/** Decide se a avaliação ainda aceita foto. null = pode. */
export function recusaUploadFoto(
  avaliacao: { aprovada: boolean; createdAt: Date; totalFotos: number } | null,
  agora: Date = new Date(),
): MotivoRecusaFoto | null {
  if (!avaliacao) return 'AVALIACAO_INEXISTENTE'
  if (avaliacao.aprovada) return 'AVALIACAO_JA_APROVADA'
  if (agora.getTime() - avaliacao.createdAt.getTime() > JANELA_UPLOAD_FOTO_MS) return 'JANELA_EXPIRADA'
  if (avaliacao.totalFotos >= MAX_FOTOS_POR_AVALIACAO) return 'LIMITE_FOTOS'
  return null
}
