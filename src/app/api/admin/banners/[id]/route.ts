import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json()
  const { imagem, imagemMobile, titulo, subtitulo, link, ordem, ativo, tempoCads } = body

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      imagem,
      imagemMobile: imagemMobile || null,
      titulo:    titulo    || null,
      subtitulo: subtitulo || null,
      link:      link      || null,
      ordem:     Number(ordem) || 0,
      ativo:     ativo !== false,
      tempoCads: Number(tempoCads) || 5,
    },
  })

  return NextResponse.json({ banner }, { headers: NO_CACHE })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json()

  const banner = await prisma.banner.update({
    where: { id },
    data: body,
  })

  return NextResponse.json({ banner }, { headers: NO_CACHE })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  await prisma.banner.delete({ where: { id } })
  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
