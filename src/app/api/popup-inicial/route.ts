import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Endpoint público — devolve apenas o que o cliente precisa pra renderizar.
// Cache curto na borda (60s) pra reduzir carga; admin pode forçar refresh
// limpando sessionStorage.
export async function GET() {
  try {
    const config = await prisma.popupInicial.findUnique({ where: { id: 'singleton' } })
    if (!config || !config.ativado) {
      return NextResponse.json({ ativado: false }, {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
      })
    }
    return NextResponse.json({
      ativado:        true,
      bannerDesktop:  config.bannerDesktop,
      bannerTablet:   config.bannerTablet,
      bannerMobile:   config.bannerMobile,
      altText:        config.altText,
      linkDestino:    config.linkDestino,
      abrirNovaAba:   config.abrirNovaAba,
      titulo:         config.titulo,
      texto:          config.texto,
      corBotao:       config.corBotao,
      textoBotao:     config.textoBotao,
      delaySegundos:  config.delaySegundos,
      frequencia:     config.frequencia,
      paginas:        config.paginas ?? ['home'],
    }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    })
  } catch (e) {
    // Banco fora do ar ou model não migrado → não interrompe a loja.
    console.error('[popup-inicial GET]', e)
    return NextResponse.json({ ativado: false })
  }
}
