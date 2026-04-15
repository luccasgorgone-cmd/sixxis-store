import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Params { id: string }

// GET /api/admin/clientes/[id] — full profile
export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      pedidos: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, total: true, createdAt: true, formaPagamento: true },
      },
      cashback: { orderBy: { createdAt: 'desc' }, take: 20 },
      bloqueios: { orderBy: { createdAt: 'desc' }, take: 10 },
      enderecos: true,
    },
  })
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  return NextResponse.json({ cliente })
}

// PATCH /api/admin/clientes/[id] — update (block/unblock/cashback adj)
export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params
  const body = await req.json()

  const { bloqueado, motivoBloqueio, cashbackSaldo, nome, telefone } = body as {
    bloqueado?: boolean
    motivoBloqueio?: string
    cashbackSaldo?: number
    nome?: string
    telefone?: string
  }

  const data: Record<string, unknown> = {}
  if (bloqueado  !== undefined) { data.bloqueado = bloqueado; data.bloqueadoEm = bloqueado ? new Date() : null }
  if (motivoBloqueio !== undefined) data.motivoBloqueio = motivoBloqueio
  if (cashbackSaldo  !== undefined) data.cashbackSaldo  = cashbackSaldo
  if (nome           !== undefined) data.nome           = nome
  if (telefone       !== undefined) data.telefone       = telefone

  const cliente = await prisma.cliente.update({ where: { id }, data })
  return NextResponse.json({ cliente })
}
