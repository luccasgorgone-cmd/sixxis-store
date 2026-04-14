import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, necessarios, analiticos, marketing } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
    }

    const session = await auth()
    const clienteId = session?.user?.id ?? null
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? null
    const userAgent = req.headers.get('user-agent') ?? null

    const consent = await prisma.cookieConsent.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        sessionId,
        clienteId,
        necessarios: true,
        analiticos: !!analiticos,
        marketing: !!marketing,
        ip,
        userAgent,
      },
      update: {
        analiticos: !!analiticos,
        marketing: !!marketing,
        clienteId,
        ip,
        userAgent,
      },
    })

    return NextResponse.json({ ok: true, id: consent.id })
  } catch (err) {
    console.error('[cookies/consent]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json(null)

    const consent = await prisma.cookieConsent.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(consent)
  } catch {
    return NextResponse.json(null)
  }
}
