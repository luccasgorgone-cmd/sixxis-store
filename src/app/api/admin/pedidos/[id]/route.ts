import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()
  const { status, codigoRastreio } = body

  const data: Record<string, string> = {}
  if (status) data.status = status
  if (codigoRastreio !== undefined) data.codigoRastreio = codigoRastreio

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const pedido = await prisma.pedido.update({
    where: { id },
    data,
  })

  return NextResponse.json({ pedido })
}
