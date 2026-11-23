import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from './adminToken'

// Rotas de API liberadas para o papel 'pedidos' (colaborador restrito à aba
// Pedidos — cotação de frete). Todo o resto de /api/admin/* é só 'admin'.
const PEDIDOS_API_ALLOW: RegExp[] = [
  /^\/api\/admin\/pedidos(\/|$)/,
  /^\/api\/admin\/me$/,
  /^\/api\/admin\/logout$/,
]

/**
 * Guarda de rota admin. Verifica o token (HMAC) e, para papéis não-admin,
 * restringe o acesso por path. É a BARREIRA de segurança real (o proxy só checa
 * presença do cookie). Toda rota /api/admin/* deve chamá-la.
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get('admin_token')?.value
  const payload = verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  // Colaborador restrito (ex.: vitor, role 'pedidos'): só as rotas de Pedidos.
  if (payload.role !== 'admin') {
    const path = request.nextUrl.pathname
    const liberado = PEDIDOS_API_ALLOW.some((re) => re.test(path))
    if (!liberado) {
      return NextResponse.json(
        { error: 'Acesso restrito: seu usuário só tem acesso à aba Pedidos.' },
        { status: 403 },
      )
    }
  }
  return null
}
