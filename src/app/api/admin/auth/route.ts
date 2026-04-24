import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAdminToken } from '@/lib/adminToken'
import {
  verificarBloqueio,
  registrarTentativaFalha,
  registrarTentativaSucesso,
} from '@/lib/bruteforce'
import { auditLog } from '@/lib/audit'

async function loadPasswordHash(): Promise<string | null> {
  const dbConfig = await prisma.configuracao
    .findUnique({ where: { chave: 'admin_password_hash' } })
    .catch(() => null)
  return dbConfig?.valor ?? process.env.ADMIN_PASSWORD_HASH ?? null
}

export async function POST(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: 'Servidor mal configurado: JWT_SECRET ausente' },
      { status: 500 },
    )
  }

  if (await verificarBloqueio(request)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 30 minutos.' },
      { status: 429 },
    )
  }

  const hash = await loadPasswordHash()
  if (!hash) {
    return NextResponse.json(
      { error: 'Servidor mal configurado: ADMIN_PASSWORD_HASH ausente' },
      { status: 500 },
    )
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const raw = body.senha ?? body.password
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 200) {
    await registrarTentativaFalha(request)
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const ok = await bcrypt.compare(raw, hash)
  if (!ok) {
    await registrarTentativaFalha(request)
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  await registrarTentativaSucesso(request)
  await auditLog({ req: request, action: 'admin.login' })

  const token = signAdminToken()
  const isProduction = process.env.NODE_ENV === 'production'
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    maxAge: 8 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: isProduction,
  })
  return response
}
