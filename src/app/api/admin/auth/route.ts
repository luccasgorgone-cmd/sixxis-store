import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/adminToken'
import { autenticarAdmin } from '@/lib/admin-usuarios'
import {
  verificarBloqueio,
  registrarTentativaFalha,
  registrarTentativaSucesso,
} from '@/lib/bruteforce'
import { auditLog } from '@/lib/audit'

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

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const raw = body.senha ?? body.password
  const usuario = typeof body.usuario === 'string' ? body.usuario
    : typeof body.login === 'string' ? body.login : undefined
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 200) {
    await registrarTentativaFalha(request)
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const auth = await autenticarAdmin(usuario, raw)
  if (!auth.ok || !auth.role) {
    await registrarTentativaFalha(request)
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  await registrarTentativaSucesso(request)
  await auditLog({ req: request, action: 'admin.login', metadata: { role: auth.role } })

  const token = signAdminToken(auth.role)
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
