import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/adminToken'

export const dynamic = 'force-dynamic'

async function verificarAdmin() {
  const cookieStore = await cookies()
  return !!verifyAdminToken(cookieStore.get('admin_token')?.value)
}

export async function GET() {
  if (!(await verificarAdmin())) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const avaliacoes = await prisma.avaliacaoParceiro.findMany({
    orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
  })
  return Response.json(avaliacoes)
}

export async function POST(req: NextRequest) {
  if (!(await verificarAdmin())) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const data = await req.json()
  const nova = await prisma.avaliacaoParceiro.create({ data })
  return Response.json(nova)
}
