import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import {
  STATUS_PAGO_TODOS,
  STATUS_PENDENTE_TODOS,
} from '@/lib/pedido-status'

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

  const [
    pedidos,
    total,
    statsPendentes,
    statsEnviados,
    statsReceitaConfirmada,
    statsReceitaPendente,
  ] = await Promise.all([
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
        pagamentos: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.pedido.count({ where }),
    prisma.pedido.count({ where: { ...where, status: { in: STATUS_PENDENTE_TODOS } } }),
    prisma.pedido.count({ where: { ...where, status: 'enviado' } }),
    prisma.pedido.aggregate({
      where: { ...where, status: { in: STATUS_PAGO_TODOS } },
      _sum: { total: true },
    }),
    prisma.pedido.aggregate({
      where: { ...where, status: { in: STATUS_PENDENTE_TODOS } },
      _sum: { total: true },
    }),
  ])

  return NextResponse.json({
    pedidos, total, page, limit,
    stats: {
      total,
      pendentes:         statsPendentes,
      enviados:          statsEnviados,
      // Stats de receita refletem APENAS pedidos pagos. Receita pendente
      // expõe o que pode entrar caso confirmem.
      receita:           Number(statsReceitaConfirmada._sum.total ?? 0),
      receitaConfirmada: Number(statsReceitaConfirmada._sum.total ?? 0),
      receitaPendente:   Number(statsReceitaPendente._sum.total ?? 0),
    },
  })
}
