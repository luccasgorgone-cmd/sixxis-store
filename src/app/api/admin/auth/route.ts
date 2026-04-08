import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Busca senha salva no banco (via painel de configurações); fallback para env var
  const dbConfig = await prisma.configuracao.findUnique({ where: { chave: 'admin_secret' } })
  const secret = dbConfig?.valor ?? process.env.ADMIN_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET não configurado no servidor' },
      { status: 500 },
    )
  }

  let body: Record<string, string> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Aceita { senha } ou { password }
  const senha = body.senha ?? body.password ?? ''

  if (!senha || senha !== secret) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const isProduction = process.env.NODE_ENV === 'production'

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_token', secret, {
    httpOnly: true,
    maxAge: 8 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: isProduction,
  })

  return response
}
