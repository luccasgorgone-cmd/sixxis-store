import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// CPF e telefone são coletados/validados no checkout, não no cadastro.
const cadastroSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = cadastroSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { nome, email, senha } = parsed.data

  const existente = await prisma.cliente.findFirst({
    where: { email },
    select: { id: true },
  })

  if (existente) {
    return Response.json({ error: 'Email já cadastrado.' }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(senha, 12)

  try {
    await prisma.cliente.create({
      data: { nome, email, senha: senhaHash },
    })
  } catch (e) {
    // Corrida no unique (email) → 409 limpo.
    if ((e as { code?: string }).code === 'P2002') {
      return Response.json({ error: 'Email já cadastrado.' }, { status: 409 })
    }
    // Loga a causa REAL (ex.: falta de INSERT no usuário do banco) no Railway.
    console.error('[auth:cadastro] falha ao criar cliente:', (e as Error).message)
    return Response.json(
      { error: 'Não foi possível concluir o cadastro. Tente novamente.' },
      { status: 500 },
    )
  }

  return Response.json({ ok: true }, { status: 201 })
}
