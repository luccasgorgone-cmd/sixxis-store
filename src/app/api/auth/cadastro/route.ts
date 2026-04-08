import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const cadastroSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().regex(/^\d{11}$/),
  telefone: z.string().min(10),
  senha: z.string().min(6),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = cadastroSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { nome, email, cpf, telefone, senha } = parsed.data

  const existente = await prisma.cliente.findFirst({
    where: { OR: [{ email }, { cpf }] },
    select: { id: true },
  })

  if (existente) {
    return Response.json({ error: 'Email ou CPF já cadastrado.' }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(senha, 12)

  await prisma.cliente.create({
    data: { nome, email, cpf, telefone, senha: senhaHash },
  })

  return Response.json({ ok: true }, { status: 201 })
}
