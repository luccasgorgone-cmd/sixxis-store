import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

// Substitui textos globais com menção a "produto original" e "instalação"
// pelos novos focados em qualidade premium e suporte de uso/operação.
// Uso: POST manual 1x após deploy.
const FIXES: Record<string, string> = {
  hero_subtitulo:    'Climatizadores, aspiradores e spinning de qualidade premium com entrega rápida para todo o Brasil.',
  loja_descricao:    'Loja oficial Sixxis. Climatizadores, aspiradores, spinning e peças de reposição com qualidade comprovada.',
  pq_sixxis_3_texto: 'Equipe pronta para tirar dúvidas sobre uso, operação e pós-venda dos produtos.',
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
