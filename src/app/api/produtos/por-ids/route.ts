import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids') || ''
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
  if (ids.length === 0) return Response.json({ produtos: [] })

  const produtos = await prisma.produto.findMany({
    where: { id: { in: ids }, ativo: true },
  })

  // Preserva a ordem dos IDs passados
  const byId = new Map(produtos.map((p) => [p.id, p]))
  const ordenados = ids.map((id) => byId.get(id)).filter(Boolean)

  return Response.json({ produtos: ordenados })
}
