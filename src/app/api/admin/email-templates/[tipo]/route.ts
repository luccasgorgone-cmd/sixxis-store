import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { tipo } = await params
  const template = await prisma.emailTemplate.findUnique({ where: { tipo } })
  if (!template) return Response.json({ error: 'Template não encontrado' }, { status: 404 })

  return Response.json({ template })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

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
