import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { searchParams } = req.nextUrl
  const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1'))
  const limite = Math.min(100, Math.max(1, parseInt(searchParams.get('limite') || '20')))
  const status = searchParams.get('status') || undefined
  const busca = searchParams.get('busca')?.trim() || undefined
  const periodo = searchParams.get('periodo') || '7d'
  const skip = (pagina - 1) * limite

  const periodos: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 }
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - (periodos[periodo] ?? 7))

  const where: Prisma.LunaConversaWhereInput = { createdAt: { gte: dataInicio } }
  if (status) where.status = status
  if (busca) {
    where.OR = [
      { sessaoId: { contains: busca } },
      { paginaOrigem: { contains: busca } },
      { mensagens: { some: { conteudo: { contains: busca } } } },
    ]
  }

  const [conversas, total, metricas] = await Promise.all([
    prisma.lunaConversa.findMany({
      where,
      skip,
      take: limite,
      orderBy: { createdAt: 'desc' },
      include: {
        mensagens: {
          take: 1,
          where: { role: 'user' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, conteudo: true, createdAt: true },
        },
        _count: { select: { mensagens: true } },
      },
    }),
    prisma.lunaConversa.count({ where }),
    prisma.lunaConversa.aggregate({
      where: { createdAt: { gte: dataInicio } },
      _count: { id: true },
      _avg: { totalMensagens: true, duracaoSegundos: true },
    }),
  ])

  // Métricas ao vivo
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dezMin = new Date(Date.now() - 10 * 60 * 1000)

  const [atendimentosHoje, aoVivo] = await Promise.all([
    prisma.lunaConversa.count({ where: { createdAt: { gte: hoje } } }),
    prisma.lunaConversa.count({
      where: { ultimaMensagem: { gte: dezMin }, status: 'ativa' },
    }),
  ])

  return NextResponse.json({
    conversas,
    total,
    paginas: Math.max(1, Math.ceil(total / limite)),
    metricas: {
      total: metricas._count.id,
      mediasMensagens: Math.round(metricas._avg.totalMensagens || 0),
      mediaDuracaoMin: Math.round((metricas._avg.duracaoSegundos || 0) / 60),
      atendimentosHoje,
      aoVivo,
    },
  })
}
