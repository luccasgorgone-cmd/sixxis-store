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
  // Lê configs de aparência do banco
  const configRows = await prisma.configuracao.findMany({
    where: {
      chave: {
        in: ['fonte_principal', 'cor_principal', 'cor_header', 'cor_botoes', 'cor_textos', 'cor_fundo', 'logo_url'],
      },
    },
  })
  const cfg = Object.fromEntries(configRows.map((c) => [c.chave, c.valor]))

  // Fonte selecionada (fallback: Inter)
  const fonteName  = cfg.fonte_principal ?? 'Inter'
  const fontObj    = FONT_MAP[fonteName] ?? inter
  const allFontVars = [
    inter.variable, poppins.variable, roboto.variable,
    montserrat.variable, nunito.variable, raleway.variable, openSans.variable,
  ].join(' ')

  const corPrincipal = cfg.cor_principal || '#3cbfb3'
  const corHeader    = cfg.cor_header    || '#0f1f1e'
  const corBotoes    = cfg.cor_botoes    || corPrincipal
  const corTextos    = cfg.cor_textos    || '#0a0a0a'
  const corFundo     = cfg.cor_fundo     || '#ffffff'
  const logoUrl      = cfg.logo_url      || '/logo-sixxis.png'

  const cssVars = {
    '--color-tiffany':      corPrincipal,
    '--color-tiffany-dark': corPrincipal,
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
          <Header logoUrl={logoUrl} />
          <div className="flex-1">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
