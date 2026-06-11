import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// Leitura do Tráfego Bruto (Fase 4C) para a aba do painel. Agrega os pageviews
// anônimos (cookieless) de TODOS os visitantes. Únicos são APROXIMADOS pelo
// visitorHash do dia (rotacionado) — nunca exatos. Nada de PII aqui.

// Dia (YYYY-MM-DD) BRT de N dias atrás — usado como limite inferior no campo `dia`
// (string), aproveitando o índice sem precisar converter datas.
function diaBRToffset(diasAtras: number): string {
  const d = new Date(Date.now() - diasAtras * 86400000)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })

  try {
    const periodo = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('periodo') || '7')))
    const diaInicio = diaBRToffset(periodo - 1)
    const where = { dia: { gte: diaInicio } }

    const [
      pageviews,
      unicosRows,
      topPaginas,
      dispositivos,
      browsers,
      sistemas,
      referrers,
      paises,
      horas,
      porDia,
    ] = await Promise.all([
      prisma.trafegoBruto.count({ where }),
      // Únicos aproximados: distinct visitorHash no período.
      prisma.trafegoBruto.findMany({ where, select: { visitorHash: true }, distinct: ['visitorHash'] }),
      prisma.trafegoBruto.groupBy({ by: ['path'], where, _count: { _all: true }, orderBy: { _count: { path: 'desc' } }, take: 20 }),
      prisma.trafegoBruto.groupBy({ by: ['dispositivo'], where, _count: { _all: true } }),
      prisma.trafegoBruto.groupBy({ by: ['browser'], where, _count: { _all: true } }),
      prisma.trafegoBruto.groupBy({ by: ['os'], where, _count: { _all: true } }),
      prisma.trafegoBruto.groupBy({ by: ['referrer'], where: { ...where, referrer: { not: null } }, _count: { _all: true }, orderBy: { _count: { referrer: 'desc' } }, take: 15 }),
      prisma.trafegoBruto.groupBy({ by: ['pais'], where: { ...where, pais: { not: null } }, _count: { _all: true }, orderBy: { _count: { pais: 'desc' } }, take: 20 }),
      prisma.trafegoBruto.groupBy({ by: ['hora'], where, _count: { _all: true } }),
      prisma.trafegoBruto.groupBy({ by: ['dia'], where, _count: { _all: true }, orderBy: { dia: 'asc' } }),
    ])

    const mapKV = (
      rows: Array<Record<string, unknown> & { _count: { _all: number } }>,
      key: string,
    ) => rows
      .map((r) => ({ nome: (r[key] as string | null) ?? 'Desconhecido', count: r._count._all }))
      .sort((a, b) => b.count - a.count)

    return Response.json({
      ok: true,
      periodo,
      diaInicio,
      pageviews,
      unicos: unicosRows.length,
      geoAtivo: paises.length > 0,
      topPaginas: topPaginas
        .map((p) => ({ path: p.path, count: p._count._all }))
        .sort((a, b) => b.count - a.count),
      dispositivos: mapKV(dispositivos, 'dispositivo'),
      browsers:     mapKV(browsers, 'browser'),
      sistemas:     mapKV(sistemas, 'os'),
      referrers:    mapKV(referrers, 'referrer'),
      paises:       mapKV(paises, 'pais'),
      horarios:     Array.from({ length: 24 }, (_, h) => ({
        hora: h,
        count: horas.find((x) => x.hora === h)?._count._all ?? 0,
      })),
      porDia: porDia.map((d) => ({ dia: d.dia, count: d._count._all })),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/analytics/trafego GET]', error)
    return Response.json({ ok: false, erro: 'Erro ao carregar tráfego', detalhes: msg }, { status: 500 })
  }
}
