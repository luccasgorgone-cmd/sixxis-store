import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/produtos/garantia-info?ids=cuid1,cuid2,cuid3
// Retorna apenas os campos de garantia (não vaza nada sensível).
export async function GET(request: NextRequest) {
  const idsRaw = request.nextUrl.searchParams.get('ids') ?? ''
  const ids = idsRaw.split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) {
    return NextResponse.json({ produtos: [] })
  }

  const produtos = await prisma.produto.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      garantiaFabricaMeses: true,
      garantiaEstendida12Preco: true,
      garantiaEstendida24Preco: true,
    },
  })

  return NextResponse.json({ produtos })
}
