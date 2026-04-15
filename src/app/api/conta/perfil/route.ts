import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({
    where:  { id: session.user.id },
    select: { nome: true, email: true, cpf: true, telefone: true },
  })

  return NextResponse.json({ cliente })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { nome, telefone } = await req.json() as { nome?: string; telefone?: string }
  const data: Record<string, string> = {}
  if (nome)     data.nome     = nome
  if (telefone) data.telefone = telefone

  const cliente = await prisma.cliente.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ cliente })
}
