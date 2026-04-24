import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/adminToken'

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get('admin_token')?.value
  const payload = verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  return null
}
