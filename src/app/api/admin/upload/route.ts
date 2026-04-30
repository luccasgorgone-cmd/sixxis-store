import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { requireAdmin } from '@/lib/adminAuth'

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string | null)?.replace(/[^a-z0-9-_/]/gi, '') || 'produtos'

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop() ?? 'jpg'
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const url = await uploadToR2(buffer, key, file.type)

  return NextResponse.json({ url })
}
