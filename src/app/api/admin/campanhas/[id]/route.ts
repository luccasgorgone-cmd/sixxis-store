import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { id } = await params
  const campanha = await prisma.campanha.findUnique({
    where: { id },
    include: {
      destinatarios: { orderBy: { createdAt: 'desc' } },
      whatsappNumero: true,
    },
  })
  if (!campanha) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(campanha)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { id } = await params
  const body = await req.json()
  const campanha = await prisma.campanha.update({
    where: { id },
    data: {
      ...(body.nome      !== undefined && { nome: body.nome }),
      ...(body.assunto   !== undefined && { assunto: body.assunto }),
      ...(body.mensagem  !== undefined && { mensagem: body.mensagem }),
      ...(body.status    !== undefined && { status: body.status }),
      ...(body.agendadoPara !== undefined && { agendadoPara: body.agendadoPara ? new Date(body.agendadoPara) : null }),
      ...(body.whatsappNumeroId !== undefined && { whatsappNumeroId: body.whatsappNumeroId }),
    },
  })
  return NextResponse.json(campanha)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { id } = await params
  await prisma.campanha.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
