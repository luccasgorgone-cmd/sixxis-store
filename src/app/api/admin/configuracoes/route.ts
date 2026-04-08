import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rows = await prisma.configuracao.findMany()
  const result = Object.fromEntries(rows.map((r) => [r.chave, r.valor]))
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Suporta { chave, valor } ou { configs: { chave: valor } }
  const entries: [string, string][] =
    body.configs
      ? Object.entries(body.configs as Record<string, string>)
      : [[body.chave as string, String(body.valor)]]

  await Promise.all(
    entries.map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where: { chave },
        create: { chave, valor },
        update: { valor },
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}
