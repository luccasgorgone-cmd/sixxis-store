import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json()
  const { nome, iconeUrl, ordem, ativo } = body as {
    nome?: string
    iconeUrl?: string
    ordem?: number
    ativo?: boolean
  }

  if (!nome?.trim() || !iconeUrl?.trim()) {
    return NextResponse.json({ error: 'Nome e ícone são obrigatórios' }, { status: 400 })
  }

  const forma = await prisma.formaPagamento.update({
    where: { id },
    data: {
      nome:     nome.trim(),
      iconeUrl: iconeUrl.trim(),
      ordem:    Number(ordem) || 0,
      ativo:    ativo !== false,
    },
  })

  return NextResponse.json({ forma }, { headers: NO_CACHE })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json()

  const forma = await prisma.formaPagamento.update({
    where: { id },
    data: body,
  })

  return NextResponse.json({ forma }, { headers: NO_CACHE })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  await prisma.formaPagamento.delete({ where: { id } })
  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
