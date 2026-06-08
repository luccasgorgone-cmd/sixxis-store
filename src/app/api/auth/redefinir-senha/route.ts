import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { lerResetToken, resetTokenValido } from '@/lib/reset-token'

export const dynamic = 'force-dynamic'

const ERRO_TOKEN = 'Link inválido ou expirado. Solicite uma nova redefinição.'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { token?: string; senha?: string } | null
  const token = body?.token
  const senha = body?.senha ?? ''

  if (!token) {
    return NextResponse.json({ error: ERRO_TOKEN }, { status: 400 })
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter ao menos 6 caracteres.' }, { status: 400 })
  }

  const lido = lerResetToken(token)
  if (!lido) {
    return NextResponse.json({ error: ERRO_TOKEN }, { status: 400 })
  }

  const cliente = await prisma.cliente.findUnique({
    where:  { id: lido.cid },
    select: { id: true, senha: true },
  })
  // Sem senha local (OAuth-first) → não há o que redefinir; token também não valida.
  if (!cliente || !cliente.senha || !resetTokenValido(lido, cliente.senha)) {
    return NextResponse.json({ error: ERRO_TOKEN }, { status: 400 })
  }

  const hash = await bcrypt.hash(senha, 10)
  await prisma.cliente.update({ where: { id: cliente.id }, data: { senha: hash } })

  return NextResponse.json({ ok: true })
}
