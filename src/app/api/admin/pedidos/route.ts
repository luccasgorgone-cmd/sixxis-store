import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''
  const pagamento = searchParams.get('pagamento') ?? ''
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 20

  const where = {
    ...(status && { status }),
    ...(pagamento && { formaPagamento: pagamento }),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
            ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
          },
        }
      : {}),
    ...(q && {
      OR: [
        { id: { contains: q } },
        { cliente: { nome: { contains: q } } },
        { cliente: { email: { contains: q } } },
      ],
    }),
  }

  const [pedidos, total, statsPendentes, statsEnviados, statsReceita] = await Promise.all([
    prisma.pedido.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { nome: true, email: true, telefone: true } },
        endereco: true,
        itens: {
          include: {
            produto: { select: { nome: true, sku: true, imagens: true } },
          },
        },
      },
    }),
    prisma.pedido.count({ where }),
    prisma.pedido.count({ where: { ...where, status: 'pendente' } }),
    prisma.pedido.count({ where: { ...where, status: 'enviado' } }),
    prisma.pedido.aggregate({ where, _sum: { total: true } }),
  ])

  return NextResponse.json({
    pedidos, total, page, limit,
    stats: {
      total,
      pendentes: statsPendentes,
      enviados:  statsEnviados,
      receita:   Number(statsReceita._sum.total ?? 0),
    },
  })
}
