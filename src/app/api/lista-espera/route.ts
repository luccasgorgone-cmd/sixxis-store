import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { produtoId, email } = await request.json()

  if (!produtoId || !email) {
    return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 })
  }

  const existente = await prisma.listaEspera.findFirst({
    where: { produtoId, email: email.toLowerCase().trim() },
  })

  if (existente) {
    return NextResponse.json({ ok: true, mensagem: 'E-mail já cadastrado na lista de espera' })
  }

  await prisma.listaEspera.create({
    data: { produtoId, email: email.toLowerCase().trim() },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
