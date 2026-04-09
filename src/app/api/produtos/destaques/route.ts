import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const secao = searchParams.get('secao') ?? 'mais-vendidos'

  const destaques = await prisma.produtoDestaque.findMany({
    where:   { secao },
    orderBy: { ordem: 'asc' },
    include: {
      produto: {
        include: {
          variacoes: {
            where:   { ativo: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  const produtos = destaques
    .filter((d) => d.produto?.ativo)
    .map((d) => d.produto)

  return NextResponse.json({ produtos })
}
