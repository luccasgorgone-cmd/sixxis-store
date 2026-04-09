import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: { ordem: 'asc' } })
  return NextResponse.json({ banners }, { headers: NO_CACHE })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { imagem, titulo, subtitulo, link, ordem, ativo, tempoCads } = body

  if (!imagem) return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 })

  const banner = await prisma.banner.create({
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

  console.log('[ADMIN] banner criado:', banner.id)

  return NextResponse.json({ banner }, { status: 201, headers: NO_CACHE })
}
