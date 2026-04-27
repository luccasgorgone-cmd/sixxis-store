import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') ?? ''
  const metodo = searchParams.get('metodo') ?? ''
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const minRaw = searchParams.get('min')
  const maxRaw = searchParams.get('max')
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 25

  const where: Prisma.PagamentoWhereInput = {}
  if (status) where.mpStatus = status
  if (metodo) where.metodo = metodo
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
      ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
    }
  }
  const min = minRaw ? Math.round(Number(minRaw) * 100) : null
  const max = maxRaw ? Math.round(Number(maxRaw) * 100) : null
  if (min !== null || max !== null) {
    where.valor = {
      ...(min !== null ? { gte: min } : {}),
      ...(max !== null ? { lte: max } : {}),
    }
  }
  if (q) {
    where.OR = [
      { mpPaymentId: { contains: q } },
      { payerEmail: { contains: q } },
      { payerNome: { contains: q } },
      { pedidoId: { contains: q } },
    ]
  }

  const [pagamentos, total, somaAprov, somaRejeit, totalAprov, totalRejeit] = await Promise.all([
    prisma.pagamento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        pedido: {
          select: {
            id: true,
            status: true,
            cliente: { select: { nome: true, email: true } },
          },
        },
      },
    }),
    prisma.pagamento.count({ where }),
    prisma.pagamento.aggregate({
      where: { ...where, mpStatus: 'approved' },
      _sum: { valor: true },
    }),
    prisma.pagamento.aggregate({
      where: { ...where, mpStatus: 'rejected' },
      _sum: { valor: true },
    }),
    prisma.pagamento.count({ where: { ...where, mpStatus: 'approved' } }),
    prisma.pagamento.count({ where: { ...where, mpStatus: 'rejected' } }),
  ])

  const totalAprovOuRejeit = totalAprov + totalRejeit
  const taxa = totalAprovOuRejeit > 0 ? (totalAprov / totalAprovOuRejeit) * 100 : 0

  return NextResponse.json({
    pagamentos,
    total,
    page,
    limit,
    stats: {
      totalAprovado: (somaAprov._sum.valor ?? 0) / 100,
      totalRejeitado: (somaRejeit._sum.valor ?? 0) / 100,
      taxaAprovacao: Number(taxa.toFixed(2)),
      qtdAprovado: totalAprov,
      qtdRejeitado: totalRejeit,
    },
  })
}
