import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { requireAdmin } from '@/lib/adminAuth'

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ erro: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ erro: 'Arquivo muito grande. Máximo: 10MB' }, { status: 400 })
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ erro: 'Formato inválido. Use PNG, JPG ou WebP' }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const key = `backgrounds/bg-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const url = await uploadToR2(buffer, key, file.type)

  return NextResponse.json({ ok: true, url })
}
