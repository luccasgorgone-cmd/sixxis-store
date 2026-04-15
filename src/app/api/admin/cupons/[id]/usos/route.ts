import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id: cupomId } = await params
  const page  = Math.max(1, Number(req.nextUrl.searchParams.get('page')  || 1))
  const limit = Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 20))

  const [usos, total, economia] = await Promise.all([
    prisma.cupomUso.findMany({
      where: { cupomId },
      orderBy: { usadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cliente: { select: { nome: true, email: true } },
      },
    }),
    prisma.cupomUso.count({ where: { cupomId } }),
    prisma.cupomUso.aggregate({
      where: { cupomId },
      _sum: { valorDesconto: true },
      _avg: { valorDesconto: true },
    }),
  ])

  return NextResponse.json({
    usos,
    total,
    totalPages:    Math.ceil(total / limit),
    page,
    economiaTotal: Number(economia._sum.valorDesconto ?? 0),
    mediaDesconto: Number(economia._avg.valorDesconto ?? 0),
  })
}
