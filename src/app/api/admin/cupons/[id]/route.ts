import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const cupom = await prisma.cupom.findUnique({
    where: { id },
    include: {
      usos: {
        orderBy: { usadoEm: 'desc' },
        include: {
          cliente: { select: { nome: true, email: true } },
        },
      },
    },
  })
  if (!cupom) return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
  return NextResponse.json(cupom)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await req.json()
  const { codigo, tipo, valor, usoMaximo, pedidoMinimo, validade, ativo, descricao, primeiraCompra } = body

  if (codigo) {
    const existe = await prisma.cupom.findFirst({
      where: { codigo: codigo.toUpperCase(), id: { not: id } },
    })
    if (existe) return NextResponse.json({ error: 'Código já existe em outro cupom' }, { status: 409 })
  }

  const cupom = await prisma.cupom.update({
    where: { id },
    data: {
      ...(codigo         !== undefined && { codigo: codigo.toUpperCase().trim() }),
      ...(tipo           !== undefined && { tipo }),
      ...(valor          !== undefined && { valor: Number(valor) }),
      ...(usoMaximo      !== undefined && { usoMaximo: usoMaximo ? Number(usoMaximo) : null }),
      ...(pedidoMinimo   !== undefined && { pedidoMinimo: Number(pedidoMinimo) }),
      ...(validade       !== undefined && { validade: validade ? new Date(validade) : null }),
      ...(ativo          !== undefined && { ativo }),
      ...(descricao      !== undefined && { descricao }),
      ...(primeiraCompra !== undefined && { primeiraCompra }),
    },
  })
  return NextResponse.json(cupom)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  await prisma.cupom.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
