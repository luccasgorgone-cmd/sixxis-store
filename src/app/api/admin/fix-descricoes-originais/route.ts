import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

// Substitui menções a "peças originais" por "peças oficiais Sixxis" nas
// descrições dos produtos no DB. Idempotente — pode rodar várias vezes sem
// efeito colateral.
function fixDescricao(texto: string): string {
  return texto.replace(/\bpeças originais\b/gi, 'peças oficiais Sixxis')
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const produtos = await prisma.produto.findMany({
    where: { descricao: { contains: 'peças originais' } },
    select: { id: true, nome: true, descricao: true },
  })

  let atualizados = 0
  const detalhes: { id: string; nome: string }[] = []

  for (const p of produtos) {
    if (!p.descricao) continue
    const nova = fixDescricao(p.descricao)
    if (nova !== p.descricao) {
      await prisma.produto.update({
        where: { id: p.id },
        data:  { descricao: nova },
      })
      atualizados++
      detalhes.push({ id: p.id, nome: p.nome })
    }
  }

  return NextResponse.json(
    { ok: true, totalProcessados: produtos.length, atualizados, detalhes },
    { headers: NO_CACHE },
  )
}
