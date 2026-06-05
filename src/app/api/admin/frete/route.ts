import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { UFS } from '@/lib/ufs'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export const dynamic = 'force-dynamic'

const TOTAL_UFS = UFS.length // 27

// Lista todos os produtos com um resumo da cobertura de frete, para montar o
// seletor e o indicador "X/27 configurados — Y estados bloqueiam venda".
export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const produtos = await prisma.produto.findMany({
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      sku: true,
      ativo: true,
      freteRegras: { select: { uf: true, bloqueado: true } },
    },
  })

  const lista = produtos.map((p) => {
    const configurados = p.freteRegras.length
    // "Vende" = tem regra e não está bloqueada. Bloqueiam = resto (inclui UFs sem regra).
    const vende = p.freteRegras.filter((r) => !r.bloqueado).length
    return {
      id: p.id,
      nome: p.nome,
      sku: p.sku,
      ativo: p.ativo,
      totalUfs: TOTAL_UFS,
      configurados,
      bloqueiam: TOTAL_UFS - vende,
    }
  })

  return NextResponse.json({ produtos: lista, totalUfs: TOTAL_UFS }, { headers: NO_CACHE })
}
