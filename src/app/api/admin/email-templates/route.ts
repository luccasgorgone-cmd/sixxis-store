import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.id) return false
  // Verificação simples — em produção adicione uma role de admin
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && session.user.email !== adminEmail) return false
  return true
}

export async function GET() {
  if (!(await checkAdmin())) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { tipo: 'asc' },
  })

  return Response.json({ templates })
}

export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

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
