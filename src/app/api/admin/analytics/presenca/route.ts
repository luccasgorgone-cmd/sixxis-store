import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// Janela de "online agora": presença com ping nos últimos 60s.
const JANELA_ONLINE_MS = 60 * 1000

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })

  try {
    const limite = new Date(Date.now() - JANELA_ONLINE_MS)

    const [online, porPagina, porDispositivo, feed] = await Promise.all([
      // Online agora — 1 linha por sessão (sessaoId @unique).
      prisma.presenca.count({ where: { ultimoPing: { gt: limite } } }),
      // Páginas sendo vistas agora.
      prisma.presenca.groupBy({
        by: ['path'],
        where: { ultimoPing: { gt: limite } },
        _count: { sessaoId: true },
      }),
      // Split de dispositivo dos online.
      prisma.presenca.groupBy({
        by: ['dispositivo'],
        where: { ultimoPing: { gt: limite } },
        _count: { sessaoId: true },
      }),
      // Feed dos últimos eventos.
      prisma.eventoTracking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { tipo: true, pagina: true, produtoSlug: true, valor: true, createdAt: true },
      }),
    ])

    const paginasAoVivo = porPagina
      .map((p) => ({ path: p.path || '/', viewers: p._count.sessaoId }))
      .sort((a, b) => b.viewers - a.viewers)
      .slice(0, 12)

    const dispositivosOnline = { mobile: 0, desktop: 0, tablet: 0, outros: 0 }
    porDispositivo.forEach((d) => {
      const k = (d.dispositivo || '').toLowerCase()
      if (k === 'mobile') dispositivosOnline.mobile += d._count.sessaoId
      else if (k === 'desktop') dispositivosOnline.desktop += d._count.sessaoId
      else if (k === 'tablet') dispositivosOnline.tablet += d._count.sessaoId
      else dispositivosOnline.outros += d._count.sessaoId
    })

    return Response.json({
      ok: true,
      agora: new Date().toISOString(),
      online,
      paginasAoVivo,
      dispositivosOnline,
      feed: feed.map((e) => ({
        tipo: e.tipo,
        pagina: e.pagina,
        produtoSlug: e.produtoSlug,
        valor: e.valor,
        createdAt: e.createdAt,
      })),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/analytics/presenca GET]', error)
    return Response.json({ ok: false, erro: 'Erro ao carregar presença', detalhes: msg }, { status: 500 })
  }
}
