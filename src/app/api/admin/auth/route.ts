import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Busca senha salva no banco (via painel de configurações); fallback para env var
  const dbConfig = await prisma.configuracao.findUnique({ where: { chave: 'admin_secret' } })
  const secret = dbConfig?.valor ?? process.env.ADMIN_SECRET

  // Debug — visível nos logs do Railway
  console.log('[admin/auth] secret source:', dbConfig ? 'banco' : 'env')
  console.log('[admin/auth] ADMIN_SECRET:', secret ? `definido (${secret.length} chars)` : 'NÃO DEFINIDO')

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

  console.log('[admin/auth] tentativa de login, senha recebida:', senha ? `${senha.length} chars` : 'vazia')

  if (!senha || senha !== secret) {
    console.log('[admin/auth] senha incorreta')
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  console.log('[admin/auth] login bem-sucedido, setando cookie')

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
