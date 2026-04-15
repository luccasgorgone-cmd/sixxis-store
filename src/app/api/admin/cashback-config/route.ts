import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const config = await prisma.configuracao.findUnique({ where: { chave: 'cashback_config' } })

  const defaults = {
    Bronze:   0.02,
    Prata:    0.03,
    Ouro:     0.04,
    Diamante: 0.05,
    Black:    0.06,
    valorMinimo:       10,
    limitePorcentagem: 20,
  }

  if (!config) return NextResponse.json(defaults)

  try {
    return NextResponse.json(JSON.parse(config.valor))
  } catch {
    return NextResponse.json(defaults)
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()

  await prisma.configuracao.upsert({
    where:  { chave: 'cashback_config' },
    create: { chave: 'cashback_config', valor: JSON.stringify(body) },
    update: { valor: JSON.stringify(body) },
  })

  return NextResponse.json({ ok: true })
}
