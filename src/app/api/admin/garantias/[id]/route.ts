import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['ativa', 'acionada', 'expirada', 'cancelada']).optional(),
  acionamentos: z.array(z.object({
    data: z.string(),
    descricao: z.string(),
    autor: z.string().optional(),
  })).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized
  const { id } = await params

  const garantia = await prisma.garantiaEstendida.findUnique({
    where: { id },
    include: {
      produto: true,
      pedido: { include: { cliente: { select: { nome: true, email: true, cpf: true, telefone: true } } } },
    },
  })
  if (!garantia) {
    return NextResponse.json({ error: 'Garantia não encontrada' }, { status: 404 })
  }
  return NextResponse.json({ garantia })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized
  const { id } = await params

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const garantia = await prisma.garantiaEstendida.update({
    where: { id },
    data: {
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.acionamentos && { acionamentos: parsed.data.acionamentos }),
    },
  })

  await auditLog({
    req: request,
    action: 'garantia.update',
    target: id,
    metadata: { status: garantia.status },
  })

  return NextResponse.json({ garantia })
}
