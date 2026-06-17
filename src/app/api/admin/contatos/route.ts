import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

const STATUS_VALIDOS = ['novo', 'lido', 'respondido', 'arquivado']

// GET /api/admin/contatos — lista paginada de mensagens de contato.
export async function GET(req: NextRequest) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth

  try {
    const sp = req.nextUrl.searchParams
    const page  = Math.max(1, Number(sp.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit') || '20')))
    const busca = sp.get('busca')?.trim() || ''
    const status = sp.get('status') || ''
    const assunto = sp.get('assunto') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && STATUS_VALIDOS.includes(status)) where.status = status
    if (assunto) where.assunto = assunto
    if (busca) {
      where.OR = [
        { nome:     { contains: busca } },
        { email:    { contains: busca } },
        { telefone: { contains: busca } },
        { mensagem: { contains: busca } },
      ]
    }

    const [total, totalGeral, novos, mensagens] = await Promise.all([
      prisma.mensagemContato.count({ where }),
      prisma.mensagemContato.count(),
      prisma.mensagemContato.count({ where: { status: 'novo' } }),
      prisma.mensagemContato.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, nome: true, email: true, telefone: true,
          assunto: true, mensagem: true, status: true, createdAt: true,
        },
      }),
    ])

    return NextResponse.json({
      mensagens,
      total,
      totalGeral,
      novos,
      page,
      limit,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[admin/contatos GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
