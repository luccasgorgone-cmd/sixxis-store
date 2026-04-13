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
  themeColor:    '#1a4f4a',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  5,
}

export const metadata: Metadata = {
  title: {
    default:  'Sixxis Store — Climatizadores, Aspiradores e Spinning',
    template: '%s | Sixxis Store',
  },
  description:
    'Loja oficial Sixxis. Climatizadores, aspiradores e equipamentos de spinning com qualidade premium e entrega rápida para todo o Brasil.',
  keywords: ['climatizador', 'aspirador', 'spinning', 'sixxis', 'loja sixxis', 'climatizadores sixxis'],
  authors: [{ name: 'Sixxis' }],
  openGraph: {
    type:        'website',
    locale:      'pt_BR',
    siteName:    'Sixxis Store',
    title:       'Sixxis Store — Climatizadores, Aspiradores e Spinning',
    description: 'Loja oficial Sixxis. Climatizadores, aspiradores e equipamentos de spinning com qualidade e garantia.',
  },
  robots: { index: true, follow: true },
}

const COR_KEYS = [
  'logo_url', 'fonte_principal',
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
  let fontePrincipal = 'Inter'
  let cfg: Record<string, string> = {}

  try {
    const configs = await prisma.configuracao.findMany({
      where: { chave: { in: [...COR_KEYS] } },
    })
    cfg = Object.fromEntries(configs.map((c) => [c.chave, c.valor]))
    if (cfg.logo_url)        logoUrl        = cfg.logo_url
    if (cfg.fonte_principal) fontePrincipal = cfg.fonte_principal
  } catch {
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
    '--bg-header':      cfg.bg_header_cor      || '#1a4f4a',
    '--bg-header-nav':  cfg.bg_header_nav_cor  || '#0f2e2b',
    '--bg-anuncio':     cfg.bg_anuncio_cor     || '#0f2e2b',
    '--bg-anuncio-txt': cfg.bg_anuncio_texto   || '#ffffff',
    '--bg-footer':      cfg.bg_footer_cor      || '#111827',
    '--bg-footer-txt':  cfg.bg_footer_texto    || '#9ca3af',
    '--bg-footer-h':    cfg.bg_footer_titulo   || '#ffffff',
    '--bg-footer-hov':  cfg.bg_footer_hover    || '#3cbfb3',
  } as React.CSSProperties

  // Background global do body
  const bgAtivo = cfg.bg_body_ativo === 'true' && !!cfg.bg_body_url
  const bodyStyle: React.CSSProperties = {
    fontFamily: `var(${fontObj.variable}), system-ui, sans-serif`,
    ...(bgAtivo ? {
      backgroundImage:    `url(${cfg.bg_body_url})`,
      backgroundSize:     cfg.bg_body_size       || 'cover',
      backgroundAttachment: cfg.bg_body_attachment || 'fixed',
      backgroundRepeat:   cfg.bg_body_repeat     || 'no-repeat',
      backgroundPosition: cfg.bg_body_position   || 'center center',
      backgroundColor:    '#0f1f1d',
    } : {
      backgroundColor: cfg.cor_fundo || '#ffffff',
    }),
  }

  const overlayOpacity = bgAtivo ? Number(cfg.bg_body_overlay || 0) : 0

  return (
    <html
      lang="pt-BR"
      className={`${allFontVars} h-full antialiased`}
      style={cssVars}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sixxis Store" />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={bodyStyle}
      >
        {/* Overlay de escurecimento do background (quando ativo) */}
        {bgAtivo && overlayOpacity > 0 && (
          <div
            className="overlay-bg"
            style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}
            aria-hidden="true"
          />
        )}
        <SessionProvider>
          <Header logoUrl={logoUrl} />
          <div className="flex-1 relative z-[1]">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
