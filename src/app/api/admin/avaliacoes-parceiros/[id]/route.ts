import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/adminToken'

export const dynamic = 'force-dynamic'

async function verificarAdmin() {
  const cookieStore = await cookies()
  return !!verifyAdminToken(cookieStore.get('admin_token')?.value)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verificarAdmin())) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const data = await req.json()
  const updated = await prisma.avaliacaoParceiro.update({ where: { id }, data })
  return Response.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verificarAdmin())) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  await prisma.avaliacaoParceiro.delete({ where: { id } })
  return Response.json({ ok: true })
}
