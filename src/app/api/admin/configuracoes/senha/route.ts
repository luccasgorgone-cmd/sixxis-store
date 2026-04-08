import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { senhaAtual, novaSenha } = await request.json()

  // Busca senha salva no banco; fallback para env var
  const dbConfig = await prisma.configuracao.findUnique({ where: { chave: 'admin_secret' } })
  const currentSecret = dbConfig?.valor ?? process.env.ADMIN_SECRET

  if (!senhaAtual || senhaAtual !== currentSecret) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })
  }

  if (!novaSenha || novaSenha.length < 6) {
    return NextResponse.json(
      { error: 'Nova senha deve ter pelo menos 6 caracteres' },
      { status: 400 },
    )
  }

  await prisma.configuracao.upsert({
    where: { chave: 'admin_secret' },
    create: { chave: 'admin_secret', valor: novaSenha },
    update: { valor: novaSenha },
  })

  return NextResponse.json({ ok: true })
}
