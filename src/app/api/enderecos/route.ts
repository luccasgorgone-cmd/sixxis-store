import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const enderecoSchema = z.object({
  cep: z.string().regex(/^\d{8}$/),
  logradouro: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  principal: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const enderecos = await prisma.endereco.findMany({
    where: { clienteId: session.user.id },
    orderBy: [{ principal: 'desc' }, { id: 'asc' }],
  })

  return Response.json({ enderecos })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = enderecoSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  if (parsed.data.principal) {
    await prisma.endereco.updateMany({
      where: { clienteId: session.user.id },
      data: { principal: false },
    })
  }

  const endereco = await prisma.endereco.create({
    data: { ...parsed.data, clienteId: session.user.id },
  })

  return Response.json({ enderecoId: endereco.id }, { status: 201 })
}
