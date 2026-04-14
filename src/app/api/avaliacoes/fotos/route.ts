import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const avaliacaoId = formData.get('avaliacaoId') as string | null

    if (!file || !avaliacaoId) {
      return Response.json({ erro: 'file e avaliacaoId são obrigatórios' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const key = `avaliacoes/${avaliacaoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const contentType = file.type || 'image/jpeg'

    const url = await uploadToR2(buffer, key, contentType)

    const foto = await prisma.avaliacaoFoto.create({
      data: { avaliacaoId, url },
    })

    return Response.json({ ok: true, url, foto })
  } catch (err) {
    console.error('[FOTO AVALIACAO ERROR]', err)
    return Response.json({ erro: 'Erro ao fazer upload da foto' }, { status: 500 })
  }
}
