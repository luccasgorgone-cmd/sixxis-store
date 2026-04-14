import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const { searchParams } = request.nextUrl
  const produtoId = searchParams.get('produtoId')
  const status    = searchParams.get('status') // 'aprovadas' | 'pendentes' | 'todas'
  const q         = searchParams.get('q')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (produtoId) where.produtoId = produtoId
  if (status === 'aprovadas')  where.aprovada = true
  if (status === 'pendentes')  where.aprovada = false
  if (status === 'destaque')   where.destaque = true
  if (q) where.OR = [
    { nomeAutor:  { contains: q } },
    { comentario: { contains: q } },
    { titulo:     { contains: q } },
  ]

  const avaliacoes = await prisma.avaliacao.findMany({
    where,
    include: {
      fotos:   true,
      produto: { select: { id: true, nome: true, imagens: true, slug: true } },
      cliente: { select: { nome: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ avaliacoes })
}
