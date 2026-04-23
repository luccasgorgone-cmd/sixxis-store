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
import Script from 'next/script'
import { SessionProvider } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { TrackingProvider } from '@/components/TrackingProvider'

const SITE_URL = 'https://sixxis-store-production.up.railway.app'

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
  themeColor:    '#1a4f4a',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  5,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  'Sixxis Store — Climatizadores, Aspiradores e Spinning | Araçatuba SP',
    template: '%s | Sixxis Store',
  },
  description:
    'Loja oficial Sixxis em Araçatuba-SP. Climatizadores evaporativos, aspiradores sem fio e bicicletas spinning com 30 anos de qualidade. Garantia real de 12 meses. Frete para todo o Brasil.',
  keywords: [
    'climatizador sixxis', 'climatizador evaporativo', 'aspirador sem fio sixxis',
    'spinning sixxis', 'sixxis araçatuba', 'loja sixxis',
    'climatizador residencial', 'climatizador industrial',
  ],
  authors: [{ name: 'Sixxis Store', url: SITE_URL }],
  creator: 'Sixxis Store',
  publisher: 'Sixxis Store',
  robots: {
    index: true, follow: true,
    googleBot: {
      index: true, follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'pt_BR',
    url:         SITE_URL,
    siteName:    'Sixxis Store',
    title:       'Sixxis Store — Climatizadores, Aspiradores e Spinning',
    description: 'Loja oficial Sixxis em Araçatuba-SP. 30 anos de qualidade em climatização.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Sixxis Store' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sixxis Store — Climatizadores e Aspiradores',
    description: 'Loja oficial Sixxis. 30 anos de qualidade.',
    images: ['/og-image.jpg'],
  },
}

const schemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Sixxis Store',
  description: 'Loja oficial Sixxis — Climatizadores, Aspiradores e Spinning',
  url: SITE_URL,
  telephone: '+551899747-4701',
  email: 'brasil.sixxis@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'R. Anhanguera, 1711',
    addressLocality: 'Araçatuba',
    addressRegion: 'SP',
    postalCode: '16015-480',
    addressCountry: 'BR',
  },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:00', closes: '12:00' },
  ],
  priceRange: 'R$500 - R$9.250',
  currenciesAccepted: 'BRL',
  paymentAccepted: 'Cash, Credit Card, Debit Card, PIX',
  logo: `${SITE_URL}/logo-sixxis.png`,
}

const COR_KEYS = [
  'logo_url', 'fonte_principal', 'favicon_url',
  'cor_principal', 'cor_principal_dark', 'cor_destaque',
  'cor_header', 'cor_header_texto', 'cor_anuncio_fundo', 'cor_anuncio_texto',
  'cor_fundo', 'cor_fundo_alt', 'cor_stats_fundo', 'cor_wa_fundo', 'cor_footer_fundo',
  'cor_botoes', 'cor_botoes_texto', 'cor_botoes_hover',
  'cor_textos', 'cor_textos_sec', 'cor_titulos',
  'cor_titulos_secao', 'cor_descricao', 'cor_precos', 'cor_precos_promo',
  'cor_links', 'cor_links_hover',
  'cor_card_fundo', 'cor_card_borda', 'cor_card_hover',
  'cor_trustbar_fundo', 'cor_trustbar_icones',
  'cor_badge_oferta', 'cor_badge_novo', 'cor_badge_esgotado',
  // Background global (wallpaper)
  'bg_body_url', 'bg_body_ativo', 'bg_body_size', 'bg_body_attachment',
  'bg_body_repeat', 'bg_body_position', 'bg_body_overlay',
  // Cores configuráveis do header
  'bg_header_cor', 'bg_header_nav_cor', 'bg_anuncio_cor', 'bg_anuncio_texto',
  // Cores configuráveis do footer
  'bg_footer_cor', 'bg_footer_texto', 'bg_footer_titulo', 'bg_footer_hover',
] as const


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let logoUrl        = '/logo-sixxis.png'
  let faviconUrl     = ''
  let fontePrincipal = 'Inter'
  let cfg: Record<string, string> = {}

  try {
    const configs = await prisma.configuracao.findMany({
      where: { chave: { in: [...COR_KEYS] } },
    })
    cfg = Object.fromEntries(configs.map((c) => [c.chave, c.valor]))
    if (cfg.logo_url)        logoUrl        = cfg.logo_url
    if (cfg.fonte_principal) fontePrincipal = cfg.fonte_principal
    if (cfg.favicon_url)     faviconUrl     = cfg.favicon_url
  } catch (err) {
    console.error('[root-layout] configs fetch failed:', err)
    // silently use defaults
  }

  // Fonte selecionada (fallback: Inter)
  const fontObj    = FONT_MAP[fontePrincipal] ?? inter
  const allFontVars = [
    inter.variable, poppins.variable, roboto.variable,
    montserrat.variable, nunito.variable, raleway.variable, openSans.variable,
  ].join(' ')

  const cssVars = {
    '--tiffany':             cfg.cor_principal      || '#3cbfb3',
    '--tiffany-dark':        cfg.cor_principal_dark || '#2a9d8f',
    '--tiffany-medium':      '#1a4f4a',
    '--tiffany-deep':        '#0f2e2b',
    '--tiffany-light':       '#e8f8f7',
    '--tiffany-soft':        '#d0f0ed',
    '--color-tiffany':       cfg.cor_principal      || '#3cbfb3',
    '--color-destaque':      cfg.cor_destaque       || '#f59e0b',
    '--color-header':        cfg.cor_header         || '#1a4f4a',
    '--color-header-texto':  cfg.cor_header_texto   || '#ffffff',
    '--color-anuncio-fundo': cfg.cor_anuncio_fundo  || '#0f2e2b',
    '--color-anuncio-texto': cfg.cor_anuncio_texto  || '#ffffff',
    '--color-fundo':         cfg.cor_fundo          || '#ffffff',
    '--color-fundo-alt':     cfg.cor_fundo_alt      || '#f9fafb',
    '--color-stats':         cfg.cor_stats_fundo    || '#3cbfb3',
    '--color-wa':            cfg.cor_wa_fundo       || '#111827',
    '--color-footer':        cfg.cor_footer_fundo   || '#111827',
    '--color-botoes':        cfg.cor_botoes         || '#3cbfb3',
    '--color-botoes-texto':  cfg.cor_botoes_texto   || '#ffffff',
    '--color-botoes-hover':  cfg.cor_botoes_hover   || '#2a9d8f',
    '--color-textos':           cfg.cor_textos           || '#1f2937',
    '--color-textos-sec':       cfg.cor_textos_sec       || '#4b5563',
    '--color-titulos':          cfg.cor_titulos          || '#0a0a0a',
    '--color-titulos-secao':    cfg.cor_titulos_secao    || '#0a0a0a',
    '--color-descricao':        cfg.cor_descricao        || '#4b5563',
    '--color-precos':           cfg.cor_precos           || '#1f2937',
    '--color-precos-promo':     cfg.cor_precos_promo     || '#3cbfb3',
    '--color-links':            cfg.cor_links            || '#3cbfb3',
    '--color-links-hover':      cfg.cor_links_hover      || '#2a9d8f',
    '--color-card-fundo':       cfg.cor_card_fundo       || '#ffffff',
    '--color-card-borda':       cfg.cor_card_borda       || '#e5e7eb',
    '--color-card-hover':       cfg.cor_card_hover       || '#f0fffe',
    '--color-trustbar-fundo':   cfg.cor_trustbar_fundo   || '#ffffff',
    '--color-trustbar-icones':  cfg.cor_trustbar_icones  || '#3cbfb3',
    '--color-badge-oferta':     cfg.cor_badge_oferta     || '#f59e0b',
    '--color-badge-novo':       cfg.cor_badge_novo       || '#3cbfb3',
    '--color-badge-esgotado':   cfg.cor_badge_esgotado   || '#9ca3af',
    '--font-active':            `var(${fontObj.variable})`,
    // Novas variáveis de personalização visual
    '--bg-header':      cfg.bg_header_cor      || '#0f2e2b',
    '--bg-header-nav':  cfg.bg_header_nav_cor  || '#1a4f4a',
    '--bg-anuncio':     cfg.bg_anuncio_cor     || '#1a4f4a',
    '--bg-anuncio-txt': cfg.bg_anuncio_texto   || '#ffffff',
    '--bg-footer':      cfg.bg_footer_cor      || '#111827',
    '--bg-footer-txt':  cfg.bg_footer_texto    || '#9ca3af',
    '--bg-footer-h':    cfg.bg_footer_titulo   || '#ffffff',
    '--bg-footer-hov':  cfg.bg_footer_hover    || '#3cbfb3',
  } as React.CSSProperties

  // Body: plain background color only — wallpaper is applied per-page (home page)
  const bodyStyle: React.CSSProperties = {
    fontFamily: `var(${fontObj.variable}), system-ui, sans-serif`,
    backgroundColor: cfg.cor_fundo || '#ffffff',
    ...cssVars,
  }

  return (
    <html
      lang="pt-BR"
      className={`${allFontVars} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sixxis Store" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        {faviconUrl
          ? <link rel="icon" href={faviconUrl} sizes="any" />
          : <link rel="icon" href="/favicon.ico" sizes="any" />
        }
      </head>
      <body
        className="min-h-full flex flex-col"
        style={bodyStyle}
      >
        <SessionProvider>
          <TrackingProvider>
            {children}
          </TrackingProvider>
        </SessionProvider>
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </body>
    </html>
  )
}
