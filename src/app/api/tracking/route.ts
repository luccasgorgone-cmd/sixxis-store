import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectDispositivo, detectBrowser, detectOS, extrairUTMs } from '@/lib/tracking'
import { CONSENT_COOKIE, parseConsent } from '@/lib/consent'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo, sessaoId, pagina, landingPage, produtoId, produtoSlug, valor, dados } = body

    if (!tipo || !sessaoId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Consentimento de analytics OBRIGATÓRIO (opt-in). Lê o cookie real de
    // consentimento; sem analytics concedido, não registra nada.
    const consent = parseConsent(req.cookies.get(CONSENT_COOKIE)?.value)
    if (!consent.analytics) {
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

    const paginaLimpa = typeof pagina === 'string' ? pagina.substring(0, 500) : ''
    const landingPageCompleta = typeof landingPage === 'string' ? landingPage.substring(0, 2000) : ''
    const utms = extrairUTMs(landingPageCompleta)
    const atributo = (valorAtributo: string | undefined) => valorAtributo?.substring(0, 191)
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
        landingPage: landingPageCompleta || null,
        utmSource: atributo(utms.utmSource),
        utmMedium: atributo(utms.utmMedium),
        utmCampaign: atributo(utms.utmCampaign),
        utmContent: atributo(utms.utmContent),
        utmTerm: atributo(utms.utmTerm),
        gclid: atributo(utms.gclid),
        gbraid: atributo(utms.gbraid),
        wbraid: atributo(utms.wbraid),
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
        pagina: paginaLimpa || null,
        produtoId: produtoId || null,
        produtoSlug: produtoSlug || null,
        valor: valor ?? null,
        dados: dados || undefined,
      },
    })

    if (tipo === 'purchase' && valor) {
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
