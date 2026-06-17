import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

const STATUS_VALIDOS = ['novo', 'em_analise', 'aprovado', 'recusado']

// GET /api/admin/parceiros — lista paginada de solicitações de parceria.
export async function GET(req: NextRequest) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth

  try {
    const sp = req.nextUrl.searchParams
    const page  = Math.max(1, Number(sp.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit') || '20')))
    const busca = sp.get('busca')?.trim() || ''
    const status = sp.get('status') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && STATUS_VALIDOS.includes(status)) where.status = status
    if (busca) {
      where.OR = [
        { nome:         { contains: busca } },
        { email:        { contains: busca } },
        { telefone:     { contains: busca } },
        { razaoSocial:  { contains: busca } },
        { nomeFantasia: { contains: busca } },
        { cidade:       { contains: busca } },
      ]
    }

    const [total, totalGeral, novos, solicitacoes] = await Promise.all([
      prisma.solicitacaoParceiro.count({ where }),
      prisma.solicitacaoParceiro.count(),
      prisma.solicitacaoParceiro.count({ where: { status: 'novo' } }),
      prisma.solicitacaoParceiro.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, nome: true, email: true, telefone: true,
          razaoSocial: true, nomeFantasia: true, cnpj: true,
          cidade: true, estado: true, segmento: true,
          status: true, createdAt: true,
        },
      }),
    ])

    return NextResponse.json({
      solicitacoes,
      total,
      totalGeral,
      novos,
      page,
      limit,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[admin/parceiros GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
