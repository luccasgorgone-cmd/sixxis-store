import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, aceitou, categorias } = body

    if (!sessionId) {
      return Response.json({ ok: false, erro: 'sessionId obrigatório' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'desconhecido'
    const userAgent = req.headers.get('user-agent') || ''

    // Registro LGPD (alimenta o widget Cookies/LGPD do painel). O Sistema B
    // (ClienteInsight) foi aposentado — visitantes/dispositivos agora vêm de
    // SessaoVisitante (Sistema A), populado pelo /api/tracking.
    await prisma.cookieConsent.create({
      data: {
        sessionId,
        ip,
        userAgent,
        aceitou: Boolean(aceitou),
        categorias: JSON.stringify(categorias || {}),
      },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[cookies/consent]', error)
    return Response.json({ ok: false, erro: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) return Response.json(null)

    const consent = await prisma.cookieConsent.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(consent)
  } catch {
    return Response.json(null)
  }
}
