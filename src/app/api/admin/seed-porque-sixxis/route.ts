import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { pqSixxisDefaultEntries } from '@/lib/porque-sixxis-defaults'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

// Sobrescreve as 12 chaves pq_sixxis_* com os defaults atuais.
// Uso esperado: chamada manual 1x após deploy para substituir textos antigos
// (ex.: "100% originais Sixxis") pelos novos focados em qualidade premium e
// adicionar o card 4 (entrega nacional).
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const entries = Object.entries(pqSixxisDefaultEntries())

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
