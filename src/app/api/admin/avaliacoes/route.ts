import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const aprovada = searchParams.get('aprovada')
  const produtoId = searchParams.get('produtoId')

  const avaliacoes = await prisma.avaliacao.findMany({
    where: {
      ...(aprovada !== null ? { aprovada: aprovada === 'true' } : {}),
      ...(produtoId ? { produtoId } : {}),
    },
    include: {
      cliente: { select: { nome: true, email: true } },
      produto: { select: { nome: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ avaliacoes })
}

export async function PATCH(request: NextRequest) {
  const { id, aprovada } = await request.json()

  const avaliacao = await prisma.avaliacao.update({
    where: { id },
    data:  { aprovada },
  })

  return NextResponse.json({ avaliacao })
}
