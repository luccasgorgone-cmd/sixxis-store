import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, userId, tipo, dados, pagina } = body

    if (!sessionId || !tipo) {
      return Response.json({ ok: false }, { status: 400 })
    }

    // Verificar consentimento
    const consent = await prisma.cookieConsent.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })

    if (!consent?.aceitou) {
      return Response.json({ ok: false, motivo: 'sem_consentimento' })
    }

    const cats = (() => {
      try { return JSON.parse(consent.categorias || '{}') } catch { return {} }
    })()

    if (!cats.analytics) {
      return Response.json({ ok: false, motivo: 'analytics_recusado' })
    }

    // Registrar evento
    await prisma.eventoAnalitico.create({
      data: {
        sessionId,
        userId: userId || null,
        tipo,
        dados: JSON.stringify(dados || {}),
        pagina: pagina || null,
      },
    })

    // Atualizar insight
    const insight = await prisma.clienteInsight.findUnique({ where: { sessionId } })
    const updates: Record<string, unknown> = { ultimaVisita: new Date() }

    if (tipo === 'page_view') {
      updates.totalPaginas = (insight?.totalPaginas || 0) + 1
      if (insight) updates.totalVisitas = insight.totalVisitas
      if (dados?.produto) {
        const arr = (() => { try { return JSON.parse(insight?.produtosVistos || '[]') } catch { return [] } })() as string[]
        if (!arr.includes(dados.produto)) {
          updates.produtosVistos = JSON.stringify([...arr, dados.produto].slice(-20))
        }
      }
    }
    if (tipo === 'search' && dados?.termo) {
      const arr = (() => { try { return JSON.parse(insight?.buscas || '[]') } catch { return [] } })() as string[]
      updates.buscas = JSON.stringify([...arr, dados.termo].slice(-20))
    }
    if (tipo === 'add_to_cart') {
      updates.carrinhosAbertos = (insight?.carrinhosAbertos || 0) + 1
    }
    if (tipo === 'purchase') {
      updates.comprasFeitas = (insight?.comprasFeitas || 0) + 1
      updates.totalGasto = (insight?.totalGasto || 0) + (dados?.valor || 0)
    }

    if (insight) {
      await prisma.clienteInsight.update({ where: { sessionId }, data: updates })
    } else {
      await prisma.clienteInsight.create({
        data: { sessionId, userId: userId || null, ...updates },
      })
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[analytics/evento]', error)
    return Response.json({ ok: false, erro: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    const tipo = req.nextUrl.searchParams.get('tipo')
    const limite = Math.min(Number(req.nextUrl.searchParams.get('limite') ?? 50), 200)

    const where: Record<string, unknown> = {}
    if (sessionId) where.sessionId = sessionId
    if (tipo) where.tipo = tipo

    const eventos = await prisma.eventoAnalitico.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limite,
    })

    return Response.json(eventos)
  } catch {
    return Response.json([])
  }
}
