import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'

async function loadPasswordHash(): Promise<string | null> {
  const dbConfig = await prisma.configuracao
    .findUnique({ where: { chave: 'admin_password_hash' } })
    .catch(() => null)
  return dbConfig?.valor ?? process.env.ADMIN_PASSWORD_HASH ?? null
}

export async function POST(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const { senhaAtual, novaSenha } = await request.json().catch(() => ({}))

  const hash = await loadPasswordHash()
  if (!hash) {
    return NextResponse.json(
      { error: 'Servidor mal configurado' },
      { status: 500 },
    )
  }

  if (typeof senhaAtual !== 'string' || !(await bcrypt.compare(senhaAtual, hash))) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })
  }

  if (typeof novaSenha !== 'string' || novaSenha.length < 12) {
    return NextResponse.json(
      { error: 'Nova senha deve ter pelo menos 12 caracteres' },
      { status: 400 },
    )
  }

  const novoHash = await bcrypt.hash(novaSenha, 12)
  await prisma.configuracao.upsert({
    where: { chave: 'admin_password_hash' },
    create: { chave: 'admin_password_hash', valor: novoHash },
    update: { valor: novoHash },
  })

  // Remove hash antigo se existir (compat)
  await prisma.configuracao
    .delete({ where: { chave: 'admin_secret' } })
    .catch(() => {})

  await auditLog({ req: request, action: 'admin.password.change' })

  return NextResponse.json({ ok: true })
}
