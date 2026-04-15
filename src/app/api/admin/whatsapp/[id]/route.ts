import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { id } = await params
  const body = await req.json()
  if (body.ehPadrao) await prisma.whatsappNumero.updateMany({ data: { ehPadrao: false } })
  const num = await prisma.whatsappNumero.update({
    where: { id },
    data: {
      ...(body.nome       !== undefined && { nome: body.nome }),
      ...(body.instanceId !== undefined && { instanceId: body.instanceId }),
      ...(body.apiUrl     !== undefined && { apiUrl: body.apiUrl }),
      ...(body.apiKey     !== undefined && { apiKey: body.apiKey }),
      ...(body.ativo      !== undefined && { ativo: body.ativo }),
      ...(body.ehPadrao   !== undefined && { ehPadrao: body.ehPadrao }),
      ...(body.status     !== undefined && { status: body.status }),
    },
  })
  return NextResponse.json(num)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { id } = await params
  await prisma.whatsappNumero.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
