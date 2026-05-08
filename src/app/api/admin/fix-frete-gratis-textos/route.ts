import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

// Substitui textos com menção a "frete grátis acima de R$ 500" no DB Configuracao
// pelos textos novos focados em despacho rápido (regra de R$ 500 removida pré-launch).
// Uso: POST manual 1x após deploy.
const FIXES: Record<string, string> = {
  trust_1_titulo: 'Entrega para todo o Brasil',
  trust_1_sub:    'Despacho em 24h',
  anuncio_2:      '🚚 Envio em até 24h para todo Brasil',
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const entries = Object.entries(FIXES)

  await Promise.all(
    entries.map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where:  { chave },
        create: { chave, valor },
        update: { valor },
      }),
    ),
  )

  return NextResponse.json(
    { ok: true, atualizadas: entries.length, chaves: entries.map(([k]) => k) },
    { headers: NO_CACHE },
  )
}
