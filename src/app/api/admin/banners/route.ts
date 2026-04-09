import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: { ordem: 'asc' } })
  return NextResponse.json({ banners })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { imagem, titulo, subtitulo, link, ordem, ativo, tempoCads } = body

  if (!imagem) return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 })

  const banner = await prisma.banner.create({
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

  revalidatePath('/', 'layout')
  revalidatePath('/')

  return NextResponse.json({ banner }, { status: 201 })
}
