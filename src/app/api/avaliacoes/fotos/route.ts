import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'
import {
  MAX_BYTES_FOTO_AVALIACAO,
  detectarTipoImagem,
  recusaUploadFoto,
} from '@/lib/avaliacao-foto'

export const dynamic = 'force-dynamic'

// Rota pública (avaliação não exige conta). Defesas em src/lib/avaliacao-foto.ts:
// tipo real por assinatura de bytes, teto de tamanho, e só para avaliação
// recém-criada, pendente e abaixo do limite de fotos. O tipo/extensão gravados
// no bucket vêm da assinatura detectada — nunca do nome/Content-Type do cliente.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const avaliacaoId = formData.get('avaliacaoId')

    if (!(file instanceof File) || typeof avaliacaoId !== 'string' || !avaliacaoId) {
      return Response.json({ erro: 'file e avaliacaoId são obrigatórios' }, { status: 400 })
    }
    if (file.size === 0 || file.size > MAX_BYTES_FOTO_AVALIACAO) {
      return Response.json({ erro: 'Foto muito grande (máximo 10 MB).' }, { status: 413 })
    }

    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      select: { aprovada: true, createdAt: true, _count: { select: { fotos: true } } },
    })
    const recusa = recusaUploadFoto(
      avaliacao
        ? { aprovada: avaliacao.aprovada, createdAt: avaliacao.createdAt, totalFotos: avaliacao._count.fotos }
        : null,
    )
    if (recusa) {
      return Response.json({ erro: 'Não é possível anexar fotos a esta avaliação.' }, { status: 403 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const tipo = detectarTipoImagem(buffer)
    if (!tipo) {
      return Response.json({ erro: 'Formato não suportado. Envie JPG, PNG ou WebP.' }, { status: 415 })
    }

    const key = `avaliacoes/${avaliacaoId}/${Date.now()}-${randomUUID()}.${tipo.ext}`
    const url = await uploadToR2(buffer, key, tipo.contentType)

    const foto = await prisma.avaliacaoFoto.create({
      data: { avaliacaoId, url },
    })

    return Response.json({ ok: true, url, foto })
  } catch (err) {
    console.error('[FOTO AVALIACAO ERROR]', err)
    return Response.json({ erro: 'Erro ao fazer upload da foto' }, { status: 500 })
  }
}
