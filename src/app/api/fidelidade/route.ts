import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { obterSaldo, resgatarPontos, pontosParaDesconto } from '@/lib/fidelidade'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const [saldo, historico] = await Promise.all([
    obterSaldo(cliente.id),
    prisma.historicoPontos.findMany({
      where:   { clienteId: cliente.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    }),
  ])

  const descontoDisponivel = await pontosParaDesconto(saldo)

  return NextResponse.json({ saldo, descontoDisponivel, historico })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { pontos } = await request.json()
  if (!pontos || pontos < 1) return NextResponse.json({ error: 'Pontos inválidos' }, { status: 400 })

  const cliente = await prisma.cliente.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  try {
    const cupomCodigo = await resgatarPontos(cliente.id, Number(pontos))
    const desconto = await pontosParaDesconto(Number(pontos))
    return NextResponse.json({ cupomCodigo, desconto })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao resgatar'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
