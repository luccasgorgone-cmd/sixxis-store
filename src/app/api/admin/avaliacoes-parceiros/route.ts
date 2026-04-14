import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function verificarAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === process.env.ADMIN_SECRET
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
