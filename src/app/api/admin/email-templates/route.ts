import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { tipo: 'asc' },
  })

  return Response.json({ templates })
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const { tipo, ativo, assunto, corpo, prazo, unidadePrazo } = body

  if (!tipo || !assunto || !corpo) {
    return Response.json({ error: 'Campos obrigatórios: tipo, assunto, corpo' }, { status: 400 })
  }

  const template = await prisma.emailTemplate.upsert({
    where: { tipo },
    update: { ativo, assunto, corpo, prazo: Number(prazo) ?? 0, unidadePrazo },
    create: { tipo, ativo: ativo ?? true, assunto, corpo, prazo: Number(prazo) ?? 0, unidadePrazo: unidadePrazo ?? 'horas' },
  })

  return Response.json({ template })
}
