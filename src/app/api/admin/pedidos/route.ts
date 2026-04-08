import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 20

  const where = {
    ...(status && { status }),
  }

  const [pedidos, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { nome: true, email: true } },
        itens: {
          include: {
            produto: { select: { nome: true, imagens: true } },
          },
        },
      },
    }),
    prisma.pedido.count({ where }),
  ])

  return NextResponse.json({ pedidos, total, page, limit })
}
