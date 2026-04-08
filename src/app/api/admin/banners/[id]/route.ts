import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      titulo:    titulo || null,
      subtitulo: subtitulo || null,
      link:      link || null,
      ordem:     Number(ordem) || 0,
      ativo:     ativo !== false,
      tempoCads: Number(tempoCads) || 5,
    },
  })

  return NextResponse.json({ banner })
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

  return NextResponse.json({ banner })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await prisma.banner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
