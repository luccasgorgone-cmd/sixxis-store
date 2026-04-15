import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page     = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit    = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')))
  const busca    = searchParams.get('busca')?.trim() || ''
  const status   = searchParams.get('status') || '' // 'bloqueado' | 'ativo' | ''
  const orderBy  = searchParams.get('orderBy') || 'createdAt'
  const order    = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
  const skip     = (page - 1) * limit

  // Build where — MySQL, no mode: insensitive
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

  const [total, clientes] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ [orderBy]: order }],
      select: {
        id:            true,
        nome:          true,
        email:         true,
        cpf:           true,
        telefone:      true,
        createdAt:     true,
        bloqueado:     true,
        motivoBloqueio:true,
        cashbackSaldo: true,
        totalGasto:    true,
        totalPedidos:  true,
        ultimaCompra:  true,
        _count: { select: { pedidos: true } },
      },
    }),
  ])

  return NextResponse.json({
    clientes,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}
