import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page      = Math.max(1, Number(sp.get('page') || '1'))
  const limit     = Math.min(50, Math.max(1, Number(sp.get('limit') || '20')))
  const busca     = sp.get('busca')?.trim() || ''
  const status    = sp.get('status') || ''
  const gastoMin  = sp.get('gastoMin')
  const gastoMax  = sp.get('gastoMax')
  const pedidosMin = sp.get('pedidosMin')
  const pedidosMax = sp.get('pedidosMax')
  const estado    = sp.get('estado')
  const ordenar   = sp.get('ordenar') || 'createdAt'
  const skip      = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (busca) {
    where.OR = [
      { nome:  { contains: busca } },
      { email: { contains: busca } },
      { cpf:   { contains: busca } },
    ]
  }
  if (status === 'bloqueado') where.bloqueado = true
  if (status === 'ativo')     where.bloqueado = false

  if (gastoMin || gastoMax) {
    where.totalGasto = {
      ...(gastoMin ? { gte: Number(gastoMin) } : {}),
      ...(gastoMax ? { lte: Number(gastoMax) } : {}),
    }
  }
  if (pedidosMin || pedidosMax) {
    where.totalPedidos = {
      ...(pedidosMin ? { gte: Number(pedidosMin) } : {}),
      ...(pedidosMax ? { lte: Number(pedidosMax) } : {}),
    }
  }
  if (estado) {
    where.enderecos = { some: { estado } }
  }

  const validOrdenar = ['totalGasto', 'totalPedidos', 'ultimaCompra', 'createdAt']
  const orderField = validOrdenar.includes(ordenar) ? ordenar : 'createdAt'

  const [total, clientes, estadosRaw] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ [orderField]: 'desc' }],
      select: {
        id:             true,
        nome:           true,
        email:          true,
        cpf:            true,
        telefone:       true,
        createdAt:      true,
        bloqueado:      true,
        motivoBloqueio: true,
        cashbackSaldo:  true,
        totalGasto:     true,
        totalPedidos:   true,
        ultimaCompra:   true,
        _count: { select: { pedidos: true } },
      },
    }),
    prisma.endereco.findMany({
      distinct: ['estado'],
      select:   { estado: true },
      where:    { estado: { not: null } },
      orderBy:  { estado: 'asc' },
    }),
  ])

  return NextResponse.json({
    clientes,
    total,
    page,
    limit,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    estados: estadosRaw.map(e => e.estado).filter(Boolean),
  })
}
