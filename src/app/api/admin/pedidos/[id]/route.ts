import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json()
  const { status, codigoRastreio } = body

  const data: Record<string, string> = {}
  if (status) data.status = status
  if (codigoRastreio !== undefined) data.codigoRastreio = codigoRastreio

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const antes = await prisma.pedido.findUnique({
    where: { id },
    select: { status: true, codigoRastreio: true },
  })

  const pedido = await prisma.pedido.update({
    where: { id },
    data,
  })

  await auditLog({
    req: request,
    action: 'pedido.update',
    target: id,
    metadata: {
      antes: { status: antes?.status ?? null, codigoRastreio: antes?.codigoRastreio ?? null },
      depois: { status: pedido.status, codigoRastreio: pedido.codigoRastreio },
    },
  })

  return NextResponse.json({ pedido })
}
