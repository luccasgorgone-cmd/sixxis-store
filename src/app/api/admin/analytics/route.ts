import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// Helper: dados do EventoTracking é coluna Json (objeto). Defensivo p/ string.
function asObj(d: unknown): Record<string, unknown> {
  if (d && typeof d === 'object' && !Array.isArray(d)) return d as Record<string, unknown>
  if (typeof d === 'string') {
    try { const o = JSON.parse(d); return o && typeof o === 'object' ? o as Record<string, unknown> : {} }
    catch { return {} }
  }
  return {}
}

// Normaliza a URL da página para o pathname (page_view grava window.location.href).
function normPath(u: string | null): string {
  if (!u) return '/'
  try { return new URL(u).pathname || '/' } catch { return u }
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })

  try {
    const periodo = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get('periodo') || '7')))
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - periodo)
    dataInicio.setHours(0, 0, 0, 0)

    // ── Sistema A: SessaoVisitante (visitantes/dispositivos) + EventoTracking
    //    (eventos/carrinhos/compras/páginas/buscas/produtos). Cookies via
    //    CookieConsent; demográficos via Cliente.
    const resultados = await Promise.allSettled([
      // 0: visitantes únicos (1 sessão = 1 visitante no período)
      prisma.sessaoVisitante.count({ where: { createdAt: { gte: dataInicio } } }),
      // 1: aceitaram cookies
      prisma.cookieConsent.count({ where: { aceitou: true, createdAt: { gte: dataInicio } } }),
      // 2: recusaram cookies
      prisma.cookieConsent.count({ where: { aceitou: false, createdAt: { gte: dataInicio } } }),
      // 3: total de eventos
      prisma.eventoTracking.count({ where: { createdAt: { gte: dataInicio } } }),
      // 4: sessões (tabela de visitantes)
      prisma.sessaoVisitante.findMany({
        where: { createdAt: { gte: dataInicio } },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: { sessaoId: true, updatedAt: true, dispositivo: true, totalPaginas: true, converteu: true },
      }),
      // 5: page_views
      prisma.eventoTracking.findMany({
        where: { tipo: 'page_view', createdAt: { gte: dataInicio } },
        select: { pagina: true, createdAt: true, sessaoId: true },
      }),
      // 6: searches
      prisma.eventoTracking.findMany({
        where: { tipo: 'search', createdAt: { gte: dataInicio } },
        select: { dados: true },
        take: 500,
      }),
      // 7: dispositivos
      prisma.sessaoVisitante.groupBy({
        by: ['dispositivo'],
        _count: { dispositivo: true },
        where: { createdAt: { gte: dataInicio } },
      }),
      // 8: compras (purchase)
      prisma.eventoTracking.findMany({
        where: { tipo: 'purchase', createdAt: { gte: dataInicio } },
        select: { dados: true, valor: true, sessaoId: true, createdAt: true },
      }),
      // 9: add_to_cart (lista + abandono)
      prisma.eventoTracking.findMany({
        where: { tipo: 'add_to_cart', createdAt: { gte: dataInicio } },
        select: { dados: true, valor: true, produtoSlug: true, sessaoId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      // 10: view_item (produtos vistos)
      prisma.eventoTracking.findMany({
        where: { tipo: 'view_item', createdAt: { gte: dataInicio } },
        select: { dados: true, produtoSlug: true },
        take: 500,
      }),
      // 11: carrinhos por sessão (coluna "carrinhos" da tabela de visitantes)
      prisma.eventoTracking.groupBy({
        by: ['sessaoId'],
        where: { tipo: 'add_to_cart', createdAt: { gte: dataInicio } },
        _count: { sessaoId: true },
      }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get = (i: number, fallback: any = null) =>
      resultados[i].status === 'fulfilled' ? (resultados[i] as PromiseFulfilledResult<unknown>).value : fallback

    const totalVisitas       = get(0, 0) as number
    const aceitaram          = get(1, 0) as number
    const recusaram          = get(2, 0) as number
    const totalEventos       = get(3, 0) as number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessoes            = get(4, []) as any[]
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
    const viewItemsRaw       = get(10, []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartsBySessionRaw  = get(11, []) as any[]

    // Top páginas (por pathname)
    const paginaMap: Record<string, number> = {}
    pageViews.forEach((e: { pagina: string | null }) => {
      const p = normPath(e.pagina)
      paginaMap[p] = (paginaMap[p] || 0) + 1
    })
    const topPaginas = Object.entries(paginaMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([pagina, visitas]) => ({ pagina, visitas }))

    // Top buscas (EventoTracking tipo='search', dados.termo)
    const buscaMap: Record<string, number> = {}
    searches.forEach((e: { dados: unknown }) => {
      const termo = asObj(e.dados).termo
      if (typeof termo === 'string' && termo) buscaMap[termo] = (buscaMap[termo] || 0) + 1
    })
    const topBuscas = Object.entries(buscaMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([termo, count]) => ({ termo, count }))

    // Top produtos (view_item, agrupado por nome; fallback slug)
    const produtoMap: Record<string, number> = {}
    viewItemsRaw.forEach((e: { dados: unknown; produtoSlug: string | null }) => {
      const d = asObj(e.dados)
      const nome = (typeof d.item_name === 'string' && d.item_name) || e.produtoSlug || '—'
      produtoMap[nome] = (produtoMap[nome] || 0) + 1
    })
    const topProdutos = Object.entries(produtoMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([produto, views]) => ({ produto, views }))

    // Receita + compras (purchase) — usa a coluna real `valor`
    let receita = 0
    const compras = comprasRaw.length
    const sessoesComCompra = new Set<string>()
    const comprasPorSessao: Record<string, { count: number; total: number }> = {}
    comprasRaw.forEach((e: { dados: unknown; valor: number | null; sessaoId: string }) => {
      sessoesComCompra.add(e.sessaoId)
      const v = typeof e.valor === 'number' ? e.valor : Number(asObj(e.dados).valor || 0)
      receita += v
      const acc = comprasPorSessao[e.sessaoId] || { count: 0, total: 0 }
      acc.count += 1; acc.total += v
      comprasPorSessao[e.sessaoId] = acc
    })

    // Carrinhos (add_to_cart)
    const sessoesComCarrinho = new Set<string>(cartsRaw.map((e: { sessaoId: string }) => e.sessaoId))
    const totalSessoesCarrinho = sessoesComCarrinho.size
    const sessoesAbandonadas = new Set([...sessoesComCarrinho].filter(s => !sessoesComCompra.has(s)))
    const carrinhosAbandonados = sessoesAbandonadas.size

    let valorAbandonado = 0
    cartsRaw.forEach((e: { sessaoId: string; dados: unknown; valor: number | null }) => {
      if (sessoesAbandonadas.has(e.sessaoId)) {
        const d = asObj(e.dados)
        const v = typeof e.valor === 'number' ? e.valor : Number(d.price || 0) * Number(d.quantity || 1)
        valorAbandonado += v
      }
    })

    // Carrinhos por sessão (tabela de visitantes)
    const cartsBySession: Record<string, number> = {}
    cartsBySessionRaw.forEach((g: { sessaoId: string; _count: { sessaoId: number } }) => {
      cartsBySession[g.sessaoId] = g._count.sessaoId
    })

    const taxaAceite = (aceitaram + recusaram) > 0
      ? Math.round((aceitaram / (aceitaram + recusaram)) * 100) : 0
    const taxaConversao = totalVisitas > 0
      ? parseFloat(((compras / totalVisitas) * 100).toFixed(2)) : 0

    // ── Visitas por dia ──
    const visitasDiaMap: Record<string, number> = {}
    pageViews.forEach((e: { createdAt: Date }) => {
      const d = new Date(e.createdAt).toISOString().slice(0, 10)
      visitasDiaMap[d] = (visitasDiaMap[d] || 0) + 1
    })
    const visitasPorDia = Object.entries(visitasDiaMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, visitas]) => ({ date, visitas }))

    // ── Horários pico ──
    const horasArray = Array.from({ length: 24 }, (_, hora) => ({ hora, visitas: 0 }))
    pageViews.forEach((e: { createdAt: Date }) => {
      const h = new Date(e.createdAt).getHours()
      horasArray[h].visitas++
    })
    const horariosPico = horasArray

    // ── Páginas por sessão ──
    const sessoesPages = new Set<string>()
    pageViews.forEach((e: { sessaoId: string | null }) => { if (e.sessaoId) sessoesPages.add(e.sessaoId) })
    const paginasPorSessao = sessoesPages.size > 0
      ? parseFloat((pageViews.length / sessoesPages.size).toFixed(1))
      : 0

    // Itens de carrinho formatados
    const itensCarrinho = cartsRaw.slice(0, 50).map((e: { sessaoId: string; dados: unknown; valor: number | null; produtoSlug: string | null; createdAt: Date }) => {
      const d = asObj(e.dados)
      const quantidade = Number(d.quantity || 1)
      const preco = Number(d.price || 0)
      return {
        produtoNome: String(d.item_name || '—'),
        produtoSlug: String(e.produtoSlug || ''),
        variacao: d.variant ? String(d.variant) : null,
        quantidade,
        preco,
        valor: typeof e.valor === 'number' ? e.valor : quantidade * preco,
        adicionadoEm: e.createdAt,
        comprado: sessoesComCompra.has(e.sessaoId),
        sessionId: e.sessaoId.slice(0, 8) + '...',
      }
    })

    // Tabela de visitantes (sessões + agregados de carrinho/compra)
    const clientes = sessoes.map((s: {
      sessaoId: string; updatedAt: Date; dispositivo: string | null; totalPaginas: number;
    }) => ({
      sessionId: s.sessaoId.slice(0, 12) + '...',
      ultimaVisita: s.updatedAt,
      totalVisitas: 1,
      totalPaginas: s.totalPaginas,
      dispositivo: s.dispositivo || 'desktop',
      carrinhosAbertos: cartsBySession[s.sessaoId] || 0,
      comprasFeitas: comprasPorSessao[s.sessaoId]?.count || 0,
      totalGasto: comprasPorSessao[s.sessaoId]?.total || 0,
    }))

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
      clientes,
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
