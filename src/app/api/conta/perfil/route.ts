import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({
    where: { id: session.user.id },
    select: {
      nome: true, email: true, cpf: true, telefone: true,
      dataNascimento: true, genero: true,
      avatar: true, avatarGradiente: true,
      notifEmail: true, notifWhatsapp: true,
    },
  })

  return NextResponse.json({ cliente })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json() as {
    nome?: string
    telefone?: string
    dataNascimento?: string | null
    genero?: string | null
    avatar?: string | null
    avatarGradiente?: string | null
    notifEmail?: boolean
    notifWhatsapp?: boolean
  }

  const data: Record<string, unknown> = {}
  if (body.nome !== undefined)            data.nome = body.nome
  if (body.telefone !== undefined)        data.telefone = body.telefone
  if (body.dataNascimento !== undefined)  data.dataNascimento = body.dataNascimento ? new Date(body.dataNascimento) : null
  if (body.genero !== undefined)          data.genero = body.genero ?? null
  if (body.avatar !== undefined)          data.avatar = body.avatar ?? null
  if (body.avatarGradiente !== undefined) data.avatarGradiente = body.avatarGradiente ?? 'tiffany'
  if (body.notifEmail !== undefined)      data.notifEmail = body.notifEmail
  if (body.notifWhatsapp !== undefined)   data.notifWhatsapp = body.notifWhatsapp

  const cliente = await prisma.cliente.update({
    where: { id: session.user.id },
    data,
    select: { id: true, nome: true, email: true },
  })

  return NextResponse.json({ cliente })
}
