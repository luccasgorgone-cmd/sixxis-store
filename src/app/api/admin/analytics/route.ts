import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

async function verificarAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!(await verificarAdmin())) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  try {
    const periodo = parseInt(req.nextUrl.searchParams.get('periodo') || '7')
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - periodo)
    dataInicio.setHours(0, 0, 0, 0)

    const [
      totalVisitas,
      aceitaram,
      recusaram,
      totalEventos,
      insights,
      topPaginasRaw,
      topBuscasRaw,
      dispositivosRaw,
      comprasRaw,
    ] = await Promise.all([
      prisma.clienteInsight.count({ where: { ultimaVisita: { gte: dataInicio } } }),
      prisma.cookieConsent.count({ where: { aceitou: true, createdAt: { gte: dataInicio } } }),
      prisma.cookieConsent.count({ where: { aceitou: false, createdAt: { gte: dataInicio } } }),
      prisma.eventoAnalitico.count({ where: { createdAt: { gte: dataInicio } } }),
      prisma.clienteInsight.findMany({
        orderBy: { ultimaVisita: 'desc' },
        take: 100,
      }),
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'page_view', createdAt: { gte: dataInicio } },
        select: { pagina: true },
      }),
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'search', createdAt: { gte: dataInicio } },
        select: { dados: true },
        take: 200,
      }),
      prisma.clienteInsight.groupBy({
        by: ['dispositivo'],
        _count: { dispositivo: true },
        where: { ultimaVisita: { gte: dataInicio } },
      }),
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'purchase', createdAt: { gte: dataInicio } },
        select: { dados: true },
      }),
    ])

    // Processar top páginas
    const paginaMap: Record<string, number> = {}
    topPaginasRaw.forEach(e => {
      const p = e.pagina || '/'
      paginaMap[p] = (paginaMap[p] || 0) + 1
    })
    const topPaginas = Object.entries(paginaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pagina, visitas]) => ({ pagina, visitas }))

    // Processar top buscas
    const buscaMap: Record<string, number> = {}
    topBuscasRaw.forEach(e => {
      try {
        const d = JSON.parse(e.dados)
        if (d.termo) buscaMap[d.termo] = (buscaMap[d.termo] || 0) + 1
      } catch { /* ignore */ }
    })
    const topBuscas = Object.entries(buscaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([termo, count]) => ({ termo, count }))

    // Processar receita
    let receita = 0
    const compras = comprasRaw.length
    comprasRaw.forEach(e => {
      try { receita += JSON.parse(e.dados).valor || 0 } catch { /* ignore */ }
    })

    const taxaAceite =
      aceitaram + recusaram > 0
        ? Math.round((aceitaram / (aceitaram + recusaram)) * 100)
        : 0

    const taxaConversao =
      totalVisitas > 0
        ? parseFloat(((compras / totalVisitas) * 100).toFixed(1))
        : 0

    return Response.json({
      periodo,
      resumo: {
        totalVisitas,
        aceitaram,
        recusaram,
        taxaAceite,
        totalEventos,
        compras,
        taxaConversao,
        receita: parseFloat(receita.toFixed(2)),
      },
      topPaginas,
      topBuscas,
      dispositivoStats: dispositivosRaw.map(d => ({
        dispositivo: d.dispositivo || 'desktop',
        count: d._count.dispositivo,
      })),
      clientes: insights.map(c => ({
        sessionId: c.sessionId.slice(0, 12) + '...',
        ultimaVisita: c.ultimaVisita,
        totalVisitas: c.totalVisitas,
        totalPaginas: c.totalPaginas,
        dispositivo: c.dispositivo || '—',
        carrinhosAbertos: c.carrinhosAbertos,
        comprasFeitas: c.comprasFeitas,
        totalGasto: c.totalGasto,
      })),
    })
  } catch (error) {
    console.error('[admin/analytics]', error)
    return Response.json({ erro: 'Erro interno', detalhes: String(error) }, { status: 500 })
  }
}
