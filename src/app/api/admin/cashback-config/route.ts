import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const config = await prisma.configuracao.findUnique({ where: { chave: 'cashback_config' } })

  const defaults = {
    Cristal:    0.02,
    Topázio:    0.03,
    Safira:     0.04,
    Diamante:   0.05,
    Esmeralda:  0.07,
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
