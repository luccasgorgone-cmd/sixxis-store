import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, pagina, referrer } = body

    if (!sessionId || !pagina) {
      return NextResponse.json({ error: 'sessionId e pagina obrigatórios' }, { status: 400 })
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
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? null
    const userAgent = req.headers.get('user-agent') ?? null

    await prisma.visitaAnalitica.create({
      data: { sessionId, clienteId, pagina, referrer: referrer ?? null, ip, userAgent },
    })

    if (clienteId) {
      await prisma.clienteInsight.upsert({
        where: { clienteId },
        create: {
          clienteId,
          totalVisitas: 1,
          ultimaVisita: new Date(),
        },
        update: {
          totalVisitas: { increment: 1 },
          ultimaVisita: new Date(),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[analytics/visita]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
