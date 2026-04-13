import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.id) return false
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && session.user.email !== adminEmail) return false
  return true
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  if (!(await checkAdmin())) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { tipo } = await params
  const template = await prisma.emailTemplate.findUnique({ where: { tipo } })
  if (!template) return Response.json({ error: 'Template não encontrado' }, { status: 404 })

  return Response.json({ template })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  if (!(await checkAdmin())) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { tipo } = await params
  const body = await request.json()
  const { ativo, assunto, corpo, prazo, unidadePrazo } = body

  const template = await prisma.emailTemplate.update({
    where: { tipo },
    data: {
      ...(ativo !== undefined && { ativo }),
      ...(assunto !== undefined && { assunto }),
      ...(corpo !== undefined && { corpo }),
      ...(prazo !== undefined && { prazo: Number(prazo) }),
      ...(unidadePrazo !== undefined && { unidadePrazo }),
    },
  })

  return Response.json({ template })
}
