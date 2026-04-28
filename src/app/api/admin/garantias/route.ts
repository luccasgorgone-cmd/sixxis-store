import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const url = request.nextUrl
  const status = url.searchParams.get('status') || undefined
  const produtoId = url.searchParams.get('produtoId') || undefined
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)
  const offset = Number(url.searchParams.get('offset') ?? 0)

  const where = {
    ...(status ? { status } : {}),
    ...(produtoId ? { produtoId } : {}),
  }

  const [garantias, total, agg] = await Promise.all([
    prisma.garantiaEstendida.findMany({
      where,
      include: {
        produto: { select: { id: true, nome: true, slug: true } },
        pedido: { select: { id: true, clienteId: true, cliente: { select: { nome: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.garantiaEstendida.count({ where }),
    prisma.garantiaEstendida.aggregate({
      _sum: { valorPago: true },
      where: { status: 'ativa' },
    }),
  ])

  const em30Dias = new Date()
  em30Dias.setDate(em30Dias.getDate() + 30)
  const aVencer = await prisma.garantiaEstendida.count({
    where: { status: 'ativa', fimVigencia: { lte: em30Dias, gte: new Date() } },
  })

  return NextResponse.json({
    garantias,
    total,
    stats: {
      totalAtivas: await prisma.garantiaEstendida.count({ where: { status: 'ativa' } }),
      totalFaturado: Number(agg._sum.valorPago ?? 0),
      aVencer30Dias: aVencer,
    },
  })
}
