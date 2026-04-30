import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const formas = await prisma.formaPagamento.findMany({
    orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ formas }, { headers: NO_CACHE })
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

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

  const forma = await prisma.formaPagamento.create({
    data: {
      nome:     nome.trim(),
      iconeUrl: iconeUrl.trim(),
      ordem:    Number(ordem) || 0,
      ativo:    ativo !== false,
    },
  })

  return NextResponse.json({ forma }, { status: 201, headers: NO_CACHE })
}
