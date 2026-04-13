import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbConfig = await prisma.configuracao.findUnique({ where: { chave: 'admin_secret' } })
  const secret = dbConfig?.valor ?? process.env.ADMIN_SECRET

  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return null
}
