import type { Metadata, Viewport } from 'next'
import {
  Inter,
  Poppins,
  Roboto,
  Montserrat,
  Nunito,
  Raleway,
  Open_Sans,
} from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import TrustBar from '@/components/layout/TrustBar'
import { prisma } from '@/lib/prisma'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

// ── Pré-carregamento de todas as fontes disponíveis ───────────────────────────
const inter      = Inter      ({ subsets: ['latin'], variable: '--font-inter',      display: 'swap' })
const poppins    = Poppins    ({ subsets: ['latin'], variable: '--font-poppins',    display: 'swap', weight: ['400','500','600','700','800'] })
const roboto     = Roboto     ({ subsets: ['latin'], variable: '--font-roboto',     display: 'swap', weight: ['400','500','700','900'] })
const montserrat = Montserrat ({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' })
const nunito     = Nunito     ({ subsets: ['latin'], variable: '--font-nunito',     display: 'swap' })
const raleway    = Raleway    ({ subsets: ['latin'], variable: '--font-raleway',    display: 'swap' })
const openSans   = Open_Sans  ({ subsets: ['latin'], variable: '--font-open-sans',  display: 'swap' })

const FONT_MAP: Record<string, { variable: string; className: string }> = {
  Inter:       inter,
  Poppins:     poppins,
  Roboto:      roboto,
  Montserrat:  montserrat,
  Nunito:      nunito,
  Raleway:     raleway,
  'Open Sans': openSans,
}

export const viewport: Viewport = {
  themeColor:    '#3cbfb3',
  width:         'device-width',
  initialScale:  1,
}

export const metadata: Metadata = {
  title: {
    default:  'Sixxis Store — Climatizadores, Aspiradores e Spinning',
    template: '%s | Sixxis Store',
  },
  description:
    'Loja oficial Sixxis. Climatizadores, aspiradores, spinning e peças de reposição originais com entrega rápida para todo o Brasil.',
  keywords: ['climatizador', 'aspirador', 'spinning', 'sixxis', 'peças de reposição'],
  authors: [{ name: 'Sixxis' }],
  openGraph: {
    type:        'website',
    locale:      'pt_BR',
    siteName:    'Sixxis Store',
    title:       'Sixxis Store — Climatizadores, Aspiradores e Spinning',
    description: 'Loja oficial Sixxis. Climatizadores, aspiradores, spinning e peças de reposição originais.',
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Defaults seguros — nunca vai quebrar o layout
  let logoUrl       = '/logo-sixxis.png'
  let corPrincipal  = '#3cbfb3'
  let corHeader     = '#2a9d8f'
  let corBotoes     = '#3cbfb3'
  let corTextos     = '#0a0a0a'
  let corFundo      = '#ffffff'
  let fontePrincipal = 'Inter'
  let anuncios = [
    '🚚 Frete grátis acima de R$\u00a0500 para todo o Brasil',
    '💳 Parcele em até 6x sem juros no cartão',
    '📞 Atendimento: (18) 99747-4701 | Seg-Sex 8h às 18h',
  ]

  try {
    const configs = await prisma.configuracao.findMany({
      where: {
        chave: {
          in: ['logo_url', 'cor_principal', 'cor_header', 'cor_botoes', 'cor_textos', 'cor_fundo', 'fonte_principal', 'anuncio_1', 'anuncio_2', 'anuncio_3'],
        },
      },
    })
    const cfg = Object.fromEntries(configs.map((c) => [c.chave, c.valor]))
    if (cfg.logo_url)       logoUrl       = cfg.logo_url
    if (cfg.cor_principal)  corPrincipal  = cfg.cor_principal
    if (cfg.cor_header)     corHeader     = cfg.cor_header
    if (cfg.cor_botoes)     corBotoes     = cfg.cor_botoes
    if (cfg.cor_textos)     corTextos     = cfg.cor_textos
    if (cfg.cor_fundo)      corFundo      = cfg.cor_fundo
    if (cfg.fonte_principal) fontePrincipal = cfg.fonte_principal
    if (cfg.anuncio_1 || cfg.anuncio_2 || cfg.anuncio_3) {
      anuncios = [
        cfg.anuncio_1 || anuncios[0],
        cfg.anuncio_2 || anuncios[1],
        cfg.anuncio_3 || anuncios[2],
      ]
    }
    console.log('[LAYOUT OK] logo:', logoUrl, 'cor:', corPrincipal)
  } catch (error) {
    console.error('[LAYOUT ERROR — usando defaults]', error)
    // Continua com os defaults — NUNCA quebra o layout
  }

  // Fonte selecionada (fallback: Inter)
  const fontObj    = FONT_MAP[fontePrincipal] ?? inter
  const allFontVars = [
    inter.variable, poppins.variable, roboto.variable,
    montserrat.variable, nunito.variable, raleway.variable, openSans.variable,
  ].join(' ')

  const cssVars = {
    '--color-tiffany':      corPrincipal,
    '--color-tiffany-dark': corBotoes,
    '--tiffany':            corPrincipal,
    '--tiffany-dark':       corBotoes,
    '--color-header':       corHeader,
    '--color-botoes':       corBotoes,
    '--color-textos':       corTextos,
    '--color-fundo':        corFundo,
    '--font-active':        `var(${fontObj.variable})`,
  } as React.CSSProperties

  return (
    <html
      lang="pt-BR"
      className={`${allFontVars} h-full antialiased`}
      style={cssVars}
    >
      <body
        className="min-h-full flex flex-col bg-white"
        style={{ fontFamily: `var(${fontObj.variable}), system-ui, sans-serif` }}
      >
        <SessionProvider>
          <Header logoUrl={logoUrl} anuncios={anuncios} />
          <TrustBar />
          <div className="flex-1">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
