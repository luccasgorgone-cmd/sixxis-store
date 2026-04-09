import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  const { id } = await params
  const body = await request.json()
  const { imagem, titulo, subtitulo, link, ordem, ativo, tempoCads } = body

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      imagem,
      titulo:    titulo    || null,
      subtitulo: subtitulo || null,
      link:      link      || null,
      ordem:     Number(ordem) || 0,
      ativo:     ativo !== false,
      tempoCads: Number(tempoCads) || 5,
    },
  })

  console.log('[ADMIN] banner atualizado:', id)

  return NextResponse.json({ banner }, { headers: NO_CACHE })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  const banner = await prisma.banner.update({
    where: { id },
    data: body,
  })

  return NextResponse.json({ banner }, { headers: NO_CACHE })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await prisma.banner.delete({ where: { id } })
  console.log('[ADMIN] banner deletado:', id)
  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
