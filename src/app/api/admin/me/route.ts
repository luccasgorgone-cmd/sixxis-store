import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/adminToken'

export const dynamic = 'force-dynamic'

// Retorna o papel do admin logado (para a UI decidir quais abas mostrar).
// Verifica o token (HMAC); não expõe nada além do role.
export async function GET(request: NextRequest) {
  const payload = verifyAdminToken(request.cookies.get('admin_token')?.value)
  if (!payload) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  return NextResponse.json({ role: payload.role })
}
