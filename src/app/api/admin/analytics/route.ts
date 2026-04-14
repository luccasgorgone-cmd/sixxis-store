import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function verificarAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = req.nextUrl
    const periodo = searchParams.get('periodo') ?? '7d'

    const dias = periodo === '30d' ? 30 : periodo === '90d' ? 90 : 7
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)

    const [
      totalVisitas,
      visitasPorDia,
      totalEventos,
      eventosPorTipo,
      totalConsentimentos,
      consentimentosAnaliticos,
      consentimentosMarketing,
      paginasMaisVisitadas,
      eventosRecentes,
    ] = await Promise.all([
      prisma.visitaAnalitica.count({ where: { createdAt: { gte: desde } } }),

      prisma.$queryRaw<{ dia: string; total: number }[]>`
        SELECT DATE(createdAt) as dia, COUNT(*) as total
        FROM VisitaAnalitica
        WHERE createdAt >= ${desde}
        GROUP BY DATE(createdAt)
        ORDER BY dia ASC
      `,

      prisma.eventoAnalitico.count({ where: { createdAt: { gte: desde } } }),

      prisma.eventoAnalitico.groupBy({
        by: ['tipo'],
        _count: { tipo: true },
        where: { createdAt: { gte: desde } },
        orderBy: { _count: { tipo: 'desc' } },
        take: 10,
      }),

      prisma.cookieConsent.count(),

      prisma.cookieConsent.count({ where: { analiticos: true } }),

      prisma.cookieConsent.count({ where: { marketing: true } }),

      prisma.$queryRaw<{ pagina: string; total: number }[]>`
        SELECT pagina, COUNT(*) as total
        FROM VisitaAnalitica
        WHERE createdAt >= ${desde}
        GROUP BY pagina
        ORDER BY total DESC
        LIMIT 10
      `,

      prisma.eventoAnalitico.findMany({
        where: { createdAt: { gte: desde } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, tipo: true, pagina: true, dados: true, createdAt: true, sessionId: true },
      }),
    ])

    const taxaConsentimentoAnalitico = totalConsentimentos > 0
      ? Math.round((consentimentosAnaliticos / totalConsentimentos) * 100)
      : 0

    const taxaConsentimentoMarketing = totalConsentimentos > 0
      ? Math.round((consentimentosMarketing / totalConsentimentos) * 100)
      : 0

    return NextResponse.json({
      periodo,
      visitas: {
        total: totalVisitas,
        porDia: visitasPorDia.map((r) => ({ dia: String(r.dia), total: Number(r.total) })),
      },
      eventos: {
        total: totalEventos,
        porTipo: eventosPorTipo.map((r) => ({ tipo: r.tipo, total: r._count.tipo })),
        recentes: eventosRecentes,
      },
      cookies: {
        total: totalConsentimentos,
        analiticos: consentimentosAnaliticos,
        marketing: consentimentosMarketing,
        taxaAnalitico: taxaConsentimentoAnalitico,
        taxaMarketing: taxaConsentimentoMarketing,
      },
      paginas: paginasMaisVisitadas.map((r) => ({ pagina: String(r.pagina), total: Number(r.total) })),
    })
  } catch (err) {
    console.error('[admin/analytics]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
