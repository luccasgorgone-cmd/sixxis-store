import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

// Upload da logo DEDICADA da NF (texto escuro p/ o fundo claro do PDF). Reusa o
// mesmo pipeline do R2 das fotos de produto (uploadToR2) e persiste a URL na
// config nf_logo_url — mesmo padrão do upload-luna-avatar.
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Apenas PNG ou JPG são aceitos' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const key = `sistema/nf-logo-${Date.now()}.${ext}`

    const url = await uploadToR2(buffer, key, file.type)

    await prisma.configuracao.upsert({
      where: { chave: 'nf_logo_url' },
      create: { chave: 'nf_logo_url', valor: url },
      update: { valor: url },
    })

    return NextResponse.json({ url, key })
  } catch (error) {
    console.error('[upload-nf-logo]', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}
