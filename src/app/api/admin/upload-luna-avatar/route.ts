import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    const formData = await req.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Apenas PNG, JPG, WebP ou GIF são aceitos' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext =
      file.type === 'image/png'  ? 'png'  :
      file.type === 'image/gif'  ? 'gif'  :
      file.type === 'image/webp' ? 'webp' : 'jpg'
    const key = `sistema/luna-avatar-${Date.now()}.${ext}`

    const url = await uploadToR2(buffer, key, file.type)

    await prisma.configuracao.upsert({
      where:  { chave: 'agente_avatar_url' },
      create: { chave: 'agente_avatar_url', valor: url },
      update: { valor: url },
    })
    await prisma.configuracao.upsert({
      where:  { chave: 'agente_avatar_tipo' },
      create: { chave: 'agente_avatar_tipo', valor: 'imagem' },
      update: { valor: 'imagem' },
    })

    return NextResponse.json({ url, key })
  } catch (error) {
    console.error('[Upload Luna Avatar]', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}
