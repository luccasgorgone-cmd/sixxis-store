import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectDispositivo, detectBrowser, detectOS, extrairUTMs, COOKIE_CONSENT } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo, sessaoId, pagina, produtoId, produtoSlug, valor, dados } = body

    if (!tipo || !sessaoId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Verificar consentimento de cookies (bloqueia apenas se explicitamente recusou)
    const consent = req.cookies.get(COOKIE_CONSENT)?.value
    if (consent === 'recusado') {
      return NextResponse.json({ ok: false, reason: 'no_consent' })
    }

    const userAgent = req.headers.get('user-agent') || ''
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || ''
    // Anonimizar último octeto
    const ip = rawIp
      ? (rawIp.includes('.') ? rawIp.split('.').slice(0, 3).join('.') + '.0' : rawIp)
      : null

    const utms = extrairUTMs(pagina || '')
    const referer = req.headers.get('referer') || null

    await prisma.sessaoVisitante.upsert({
      where: { sessaoId },
      create: {
        sessaoId,
        ip,
        userAgent: userAgent.substring(0, 500),
        dispositivo: detectDispositivo(userAgent),
        browser: detectBrowser(userAgent),
        os: detectOS(userAgent),
        landingPage: pagina?.substring(0, 500) || null,
        utmSource: utms.utmSource,
        utmMedium: utms.utmMedium,
        utmCampaign: utms.utmCampaign,
        utmContent: utms.utmContent,
        utmTerm: utms.utmTerm,
        referer: referer?.substring(0, 500) || null,
        totalPaginas: tipo === 'page_view' ? 1 : 0,
      },
      update: tipo === 'page_view'
        ? { totalPaginas: { increment: 1 } }
        : {},
    })

    await prisma.eventoTracking.create({
      data: {
        sessaoId,
        tipo,
        pagina: pagina?.substring(0, 500),
        produtoId: produtoId || null,
        produtoSlug: produtoSlug || null,
        valor: valor ?? null,
        dados: dados || undefined,
      },
    })

    if (tipo === 'compra' && valor) {
      const agora = new Date()
      const hora = agora.getHours()
      const diaSemana = agora.getDay()
      const dataBase = new Date(agora)
      dataBase.setHours(0, 0, 0, 0)

      await prisma.relatorioVendaHora.upsert({
        where: { data_hora: { data: dataBase, hora } },
        create: {
          data: dataBase,
          hora,
          diaSemana,
          totalPedidos: 1,
          totalReceita: valor,
          totalItens: 1,
        },
        update: {
          totalPedidos: { increment: 1 },
          totalReceita: { increment: valor },
          totalItens: { increment: 1 },
        },
      })

      await prisma.sessaoVisitante.update({
        where: { sessaoId },
        data: { converteu: true },
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Tracking]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
