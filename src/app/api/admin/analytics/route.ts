import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })

  try {
    const periodo = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get('periodo') || '7')))
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - periodo)
    dataInicio.setHours(0, 0, 0, 0)

    const resultados = await Promise.allSettled([
      // 0: visitantes únicos
      prisma.clienteInsight.count({ where: { ultimaVisita: { gte: dataInicio } } }),
      // 1: aceitaram cookies
      prisma.cookieConsent.count({ where: { aceitou: true, createdAt: { gte: dataInicio } } }),
      // 2: recusaram cookies
      prisma.cookieConsent.count({ where: { aceitou: false, createdAt: { gte: dataInicio } } }),
      // 3: total eventos
      prisma.eventoAnalitico.count({ where: { createdAt: { gte: dataInicio } } }),
      // 4: insights clientes
      prisma.clienteInsight.findMany({
        orderBy: { ultimaVisita: 'desc' },
        take: 100,
      }),
      // 5: page_views
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'page_view', createdAt: { gte: dataInicio } },
        select: { pagina: true, createdAt: true, sessionId: true },
      }),
      // 6: searches
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'search', createdAt: { gte: dataInicio } },
        select: { dados: true },
        take: 500,
      }),
      // 7: dispositivos
      prisma.clienteInsight.groupBy({
        by: ['dispositivo'],
        _count: { dispositivo: true },
        where: { ultimaVisita: { gte: dataInicio } },
      }),
      // 8: compras
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'purchase', createdAt: { gte: dataInicio } },
        select: { dados: true, sessionId: true, createdAt: true },
      }),
      // 9: add_to_cart
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'add_to_cart', createdAt: { gte: dataInicio } },
        select: { dados: true, sessionId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      // 10: product_views
      prisma.eventoAnalitico.findMany({
        where: { tipo: 'product_view', createdAt: { gte: dataInicio } },
        select: { dados: true },
        take: 500,
      }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get = (i: number, fallback: any = null) =>
      resultados[i].status === 'fulfilled' ? resultados[i].value : fallback

    const totalVisitas       = get(0, 0) as number
    const aceitaram          = get(1, 0) as number
    const recusaram          = get(2, 0) as number
    const totalEventos       = get(3, 0) as number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insights           = get(4, []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageViews          = get(5, []) as any[]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searches           = get(6, []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispositivos       = get(7, []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comprasRaw         = get(8, []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartsRaw           = get(9, []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productViewsRaw    = get(10, []) as any[]

    // Top páginas
    const paginaMap: Record<string, number> = {}
    pageViews.forEach((e: { pagina: string | null }) => {
      const p = e.pagina || '/'
      paginaMap[p] = (paginaMap[p] || 0) + 1
    })
    const topPaginas = Object.entries(paginaMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([pagina, visitas]) => ({ pagina, visitas }))

    // Top buscas
    const buscaMap: Record<string, number> = {}
    searches.forEach((e: { dados: string }) => {
      try {
        const d = JSON.parse(e.dados)
        if (d.termo) buscaMap[d.termo] = (buscaMap[d.termo] || 0) + 1
      } catch { /* ignore */ }
    })
    const topBuscas = Object.entries(buscaMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([termo, count]) => ({ termo, count }))

    // Top produtos
    const produtoMap: Record<string, number> = {}
    productViewsRaw.forEach((e: { dados: string }) => {
      try {
        const d = JSON.parse(e.dados)
        if (d.produto) produtoMap[d.produto] = (produtoMap[d.produto] || 0) + 1
      } catch { /* ignore */ }
    })
    const topProdutos = Object.entries(produtoMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([produto, views]) => ({ produto, views }))

    // Receita
    let receita = 0
    const compras = comprasRaw.length
    const sessoesComCompra = new Set<string>()
    comprasRaw.forEach((e: { dados: string; sessionId: string }) => {
      sessoesComCompra.add(e.sessionId)
      try { receita += JSON.parse(e.dados).valor || 0 } catch { /* ignore */ }
    })

    // Carrinhos
    const sessoesComCarrinho = new Set<string>(cartsRaw.map((e: { sessionId: string }) => e.sessionId))
    const totalSessoesCarrinho = sessoesComCarrinho.size
    const carrinhosAbandonados = [...sessoesComCarrinho].filter(s => !sessoesComCompra.has(s)).length

    let valorAbandonado = 0
    const sessoesAbandonadas = new Set([...sessoesComCarrinho].filter(s => !sessoesComCompra.has(s)))
    cartsRaw.forEach((e: { sessionId: string; dados: string }) => {
      if (sessoesAbandonadas.has(e.sessionId)) {
        try {
          const d = JSON.parse(e.dados)
          valorAbandonado += (d.preco || 0) * (d.quantidade || 1)
        } catch { /* ignore */ }
      }
    })

    const taxaAceite = (aceitaram + recusaram) > 0
      ? Math.round((aceitaram / (aceitaram + recusaram)) * 100) : 0
    const taxaConversao = totalVisitas > 0
      ? parseFloat(((compras / totalVisitas) * 100).toFixed(2)) : 0

    // ── Visitas por dia ──────────────────────────────────────────────────────
    const visitasDiaMap: Record<string, number> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pageViews.forEach((e: any) => {
      const d = new Date(e.createdAt).toISOString().slice(0, 10)
      visitasDiaMap[d] = (visitasDiaMap[d] || 0) + 1
    })
    const visitasPorDia = Object.entries(visitasDiaMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, visitas]) => ({ date, visitas }))

    // ── Horários pico ─────────────────────────────────────────────────────────
    const horasArray = Array.from({ length: 24 }, (_, hora) => ({ hora, visitas: 0 }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pageViews.forEach((e: any) => {
      const h = new Date(e.createdAt).getHours()
      horasArray[h].visitas++
    })
    const horariosPico = horasArray

    // ── Páginas por sessão ────────────────────────────────────────────────────
    const sessoesPages = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pageViews.forEach((e: any) => { if (e.sessionId) sessoesPages.add(e.sessionId) })
    const paginasPorSessao = sessoesPages.size > 0
      ? parseFloat((pageViews.length / sessoesPages.size).toFixed(1))
      : 0

    // Itens de carrinho formatados
    const itensCarrinho = cartsRaw.slice(0, 50).map((e: { sessionId: string; dados: string; createdAt: Date }) => {
      let d: Record<string, unknown> = {}
      try { d = JSON.parse(e.dados) } catch { /* ignore */ }
      return {
        produtoNome: String(d.produtoNome || d.produto || '—'),
        produtoSlug: String(d.produtoSlug || d.produto || ''),
        variacao: d.variacao ? String(d.variacao) : null,
        quantidade: Number(d.quantidade || 1),
        preco: Number(d.preco || 0),
        valor: Number(d.quantidade || 1) * Number(d.preco || 0),
        adicionadoEm: e.createdAt,
        comprado: sessoesComCompra.has(e.sessionId),
        sessionId: e.sessionId.slice(0, 8) + '...',
      }
    })

    // ── Demográficos (clientes cadastrados) — raw queries para evitar bug de tipo circular do Prisma groupBy ──
    type GeneroRow = { genero: string | null; total: bigint }
    type ClienteRow = { nome: string; email: string; dataNascimento: Date | null }

    const [generoDist, aniversariantesRaw] = await Promise.all([
      prisma.$queryRaw<GeneroRow[]>`
        SELECT genero, COUNT(*) AS total FROM Cliente GROUP BY genero
      `.catch(() => [] as GeneroRow[]),
      prisma.$queryRaw<ClienteRow[]>`
        SELECT nome, email, dataNascimento FROM Cliente WHERE dataNascimento IS NOT NULL
      `.catch(() => [] as ClienteRow[]),
    ])

    // Gênero pie
    const generoMap: Record<string, number> = { masculino: 0, feminino: 0, outro: 0, 'não informado': 0 }
    generoDist.forEach((g) => {
      const key = g.genero || 'não informado'
      generoMap[key] = (generoMap[key] || 0) + Number(g.total)
    })
    const generoPie = Object.entries(generoMap)
      .filter(([, v]) => v > 0)
      .map(([nome, count]) => ({ nome, count }))

    // Faixa etária + aniversariantes
    const hoje = new Date()
    const faixas: Record<string, number> = {
      '< 18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0,
    }
    const anivMes = hoje.getMonth() + 1
    const anivHoje: { nome: string; email: string; dia: number }[] = []

    aniversariantesRaw.forEach((c) => {
      if (!c.dataNascimento) return
      const nasc = new Date(c.dataNascimento)
      const idade = hoje.getFullYear() - nasc.getFullYear() -
        (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
      if (idade < 18) faixas['< 18']++
      else if (idade <= 24) faixas['18-24']++
      else if (idade <= 34) faixas['25-34']++
      else if (idade <= 44) faixas['35-44']++
      else if (idade <= 54) faixas['45-54']++
      else faixas['55+']++

      if (nasc.getMonth() + 1 === anivMes) {
        anivHoje.push({ nome: c.nome, email: c.email, dia: nasc.getDate() })
      }
    })
    anivHoje.sort((a, b) => a.dia - b.dia)
    const faixaEtaria = Object.entries(faixas).map(([faixa, count]) => ({ faixa, count }))

    return Response.json({
      ok: true,
      periodo,
      demograficos: { generoPie, faixaEtaria, aniversariantesMes: anivHoje },
      resumo: {
        totalVisitas,
        aceitaram,
        recusaram,
        taxaAceite,
        totalEventos,
        compras,
        taxaConversao,
        receita: parseFloat(receita.toFixed(2)),
        totalSessoesCarrinho,
        carrinhosAbandonados,
        valorAbandonado: parseFloat(valorAbandonado.toFixed(2)),
      },
      topPaginas,
      topBuscas,
      topProdutos,
      dispositivoStats: dispositivos.map((d: { dispositivo: string | null; _count: { dispositivo: number } }) => ({
        dispositivo: d.dispositivo || 'desktop',
        count: d._count.dispositivo,
      })),
      visitasPorDia,
      horariosPico,
      paginasPorSessao,
      itensCarrinho,
      clientes: insights.map((c: {
        sessionId: string; ultimaVisita: Date; totalVisitas: number; totalPaginas: number;
        dispositivo: string | null; carrinhosAbertos: number; comprasFeitas: number; totalGasto: number;
      }) => ({
        sessionId: c.sessionId.slice(0, 12) + '...',
        ultimaVisita: c.ultimaVisita,
        totalVisitas: c.totalVisitas,
        totalPaginas: c.totalPaginas,
        dispositivo: c.dispositivo || 'desktop',
        carrinhosAbertos: c.carrinhosAbertos,
        comprasFeitas: c.comprasFeitas,
        totalGasto: c.totalGasto,
      })),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[admin/analytics GET]', error)
    return Response.json({
      ok: false,
      erro: 'Erro ao carregar analytics',
      detalhes: msg,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
    }, { status: 500 })
  }
}
