import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

interface Publico {
  kind: 'todos' | 'nivel' | 'compraDias' | 'semCompraDias' | 'aniversariantes' | 'segmento'
  nivel?: string
  dias?: number
  segmento?: string
}

export async function POST(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const { publico } = (await request.json()) as { publico?: Publico }
  if (!publico) return Response.json({ total: 0 })

  try {
    if (publico.kind === 'todos') {
      const total = await prisma.cliente.count()
      return Response.json({ total })
    }

    if (publico.kind === 'compraDias') {
      const d = new Date(); d.setDate(d.getDate() - (publico.dias ?? 30))
      const total = await prisma.cliente.count({ where: { pedidos: { some: { createdAt: { gte: d } } } } })
      return Response.json({ total })
    }

    if (publico.kind === 'semCompraDias') {
      const d = new Date(); d.setDate(d.getDate() - (publico.dias ?? 30))
      const total = await prisma.cliente.count({ where: { pedidos: { none: { createdAt: { gte: d } } } } })
      return Response.json({ total })
    }

    if (publico.kind === 'aniversariantes') {
      const mes = new Date().getMonth() + 1
      const clientes = await prisma.cliente.findMany({ select: { dataNascimento: true } }).catch(() => [])
      const total = clientes.filter((c: { dataNascimento: Date | null }) => c.dataNascimento && new Date(c.dataNascimento).getMonth() + 1 === mes).length
      return Response.json({ total })
    }

    if (publico.kind === 'nivel' && publico.nivel) {
      const nivel = await prisma.nivelFidelidade.findUnique({ where: { slug: publico.nivel } })
      if (!nivel) return Response.json({ total: 0 })
      const total = await prisma.cliente.count({
        where: {
          totalGasto: {
            gte: nivel.gastoMin,
            ...(nivel.gastoMax !== null && { lte: nivel.gastoMax }),
          },
        },
      })
      return Response.json({ total })
    }

    // segmento customizado ou fallback
    const total = await prisma.cliente.count()
    return Response.json({ total })
  } catch {
    return Response.json({ total: 0 })
  }
}
