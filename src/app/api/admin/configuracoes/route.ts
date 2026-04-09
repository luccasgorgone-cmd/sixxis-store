import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = await prisma.configuracao.findMany()
  const result = Object.fromEntries(rows.map((r) => [r.chave, r.valor]))
  return NextResponse.json(result, { headers: NO_CACHE })
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
        where:  { chave },
        create: { chave, valor },
        update: { valor },
      }),
    ),
  )

  console.log('[ADMIN] configuracoes salvas:', entries.map(([k]) => k).join(', '))

  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
