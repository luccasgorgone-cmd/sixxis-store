import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'

const MAX_BYTES = 2 * 1024 * 1024 // 2MB

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const variant = (formData.get('variant') as string | null) ?? 'desktop'

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Use PNG, JPG ou WEBP' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Imagem maior que 2MB' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeVariant = variant === 'mobile' ? 'mobile' : variant === 'tablet' ? 'tablet' : 'desktop'
  const key = `popups/${Date.now()}-${safeVariant}-${Math.random().toString(36).slice(2, 9)}.${ext}`
  const url = await uploadToR2(buffer, key, file.type)

  await auditLog({
    req: request,
    action: 'popup.upload-banner',
    target: key,
    metadata: { variant: safeVariant, size: file.size },
  })

  return NextResponse.json({ url, variant: safeVariant })
}
