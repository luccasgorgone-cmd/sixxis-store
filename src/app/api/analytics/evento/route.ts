import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, tipo, dados, pagina } = body

    if (!sessionId || !tipo) {
      return NextResponse.json({ error: 'sessionId e tipo obrigatórios' }, { status: 400 })
    }

    // Verifica consentimento analítico
    const consent = await prisma.cookieConsent.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })

    if (!consent?.analiticos) {
      return NextResponse.json({ ok: false, reason: 'sem_consentimento' })
    }

    const session = await auth()
    const clienteId = session?.user?.id ?? null

    await prisma.eventoAnalitico.create({
      data: {
        sessionId,
        clienteId,
        tipo,
        dados: dados ?? null,
        pagina: pagina ?? null,
      },
    })

    // Atualiza ClienteInsight se logado
    if (clienteId) {
      await prisma.clienteInsight.upsert({
        where: { clienteId },
        create: {
          clienteId,
          totalEventos: 1,
        },
        update: {
          totalEventos: { increment: 1 },
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[analytics/evento]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    const tipo = req.nextUrl.searchParams.get('tipo')
    const limite = Number(req.nextUrl.searchParams.get('limite') ?? 50)

    const where: Record<string, unknown> = {}
    if (sessionId) where.sessionId = sessionId
    if (tipo) where.tipo = tipo

    const eventos = await prisma.eventoAnalitico.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limite, 200),
    })

    return NextResponse.json(eventos)
  } catch {
    return NextResponse.json([])
  }
}
