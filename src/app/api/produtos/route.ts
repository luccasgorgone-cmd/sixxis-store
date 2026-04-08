import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const categoria = searchParams.get('categoria')
  const q = searchParams.get('q')
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Number(searchParams.get('limit') ?? '20')

  const where = {
    ativo: true,
    ...(categoria && { categoria }),
    ...(q && {
      OR: [
        { nome: { contains: q } },
        { descricao: { contains: q } },
      ],
    }),
  }

  const [produtos, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome: 'asc' },
    }),
    prisma.produto.count({ where }),
  ])

  return Response.json({ produtos, total, page, limit })
}
