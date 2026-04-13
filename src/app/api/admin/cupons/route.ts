import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const cupons = await prisma.cupom.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ cupons })
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const { codigo, tipo, valor, usoMaximo, valorMinimo, expiresAt, ativo } = body

  if (!codigo || !valor) return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const cupom = await prisma.cupom.create({
    data: {
      codigo:     codigo.toUpperCase().trim(),
      tipo:       tipo ?? 'percentual',
      valor:      Number(valor),
      usoMaximo:  usoMaximo ? Number(usoMaximo) : null,
      valorMinimo: valorMinimo ? Number(valorMinimo) : null,
      expiresAt:  expiresAt ? new Date(expiresAt) : null,
      ativo:      ativo !== false,
    },
  })

  return NextResponse.json({ cupom }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const { id, codigo, tipo, valor, usoMaximo, valorMinimo, expiresAt, ativo } = body

  const cupom = await prisma.cupom.update({
    where: { id },
    data: {
      codigo:     codigo.toUpperCase().trim(),
      tipo,
      valor:      Number(valor),
      usoMaximo:  usoMaximo ? Number(usoMaximo) : null,
      valorMinimo: valorMinimo ? Number(valorMinimo) : null,
      expiresAt:  expiresAt ? new Date(expiresAt) : null,
      ativo,
    },
  })

  return NextResponse.json({ cupom })
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.cupom.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
