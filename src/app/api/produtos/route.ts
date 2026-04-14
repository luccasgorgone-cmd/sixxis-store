import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const categoria = searchParams.get('categoria')
  const q        = searchParams.get('q') || searchParams.get('busca')
  const ordem    = searchParams.get('ordem') || 'nome'
  const page     = Number(searchParams.get('page')  ?? '1')
  const limit    = Number(searchParams.get('limit') ?? '20')
  const precoMin = searchParams.get('precoMin')
  const precoMax = searchParams.get('precoMax')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    ativo: true,
    ...(categoria && { categoria }),
    ...(q && {
      OR: [
        { nome:      { contains: q } },
        { descricao: { contains: q } },
      ],
    }),
    ...((precoMin || precoMax) && {
      preco: {
        ...(precoMin                                && { gte: Number(precoMin) }),
        ...(precoMax && Number(precoMax) < 999999  && { lte: Number(precoMax) }),
      },
    }),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any =
    ordem === 'preco-asc'  ? { preco:     'asc'  } :
    ordem === 'preco-desc' ? { preco:     'desc' } :
    ordem === 'recentes'   ? { createdAt: 'desc' } :
    ordem === 'vendidos'   ? { vendidos:  'desc' } :
    ordem === 'nome'       ? { nome:      'asc'  } :
    /* relevancia default */ { createdAt: 'desc' }

  const [produtos, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        variacoes: {
          where: { ativo: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.produto.count({ where }),
  ])

  return Response.json({ produtos, total, page, limit })
}
