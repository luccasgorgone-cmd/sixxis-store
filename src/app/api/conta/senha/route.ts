import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { senhaAtual, novaSenha } = await req.json() as { senhaAtual: string; novaSenha: string }

  if (!senhaAtual || !novaSenha || novaSenha.length < 6) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: session.user.id }, select: { senha: true } })
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const valida = await bcrypt.compare(senhaAtual, cliente.senha)
  if (!valida) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })

  const hash = await bcrypt.hash(novaSenha, 12)
  await prisma.cliente.update({ where: { id: session.user.id }, data: { senha: hash } })

  return NextResponse.json({ ok: true })
}
