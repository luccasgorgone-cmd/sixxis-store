import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CASHBACK_PERCENT } from '@/lib/cashback'

export const dynamic = 'force-dynamic'

// GET — saldo + extrato do cliente logado
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({
    where:  { id: session.user.id },
    select: { cashbackSaldo: true },
  })

  const extrato = await prisma.cashbackTransacao.findMany({
    where:   { clienteId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    30,
  })

  return NextResponse.json({ saldo: cliente?.cashbackSaldo ?? 0, extrato, percentual: CASHBACK_PERCENT })
}

// POST — aplicar cashback no checkout (valida e reserva)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { valor } = await req.json() as { valor: number }
  if (!valor || valor <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })

  const cliente = await prisma.cliente.findUnique({
    where:  { id: session.user.id },
    select: { cashbackSaldo: true },
  })

  if (!cliente || cliente.cashbackSaldo < valor) {
    return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, saldo: cliente.cashbackSaldo, valorDisponivel: Math.min(valor, cliente.cashbackSaldo) })
}
