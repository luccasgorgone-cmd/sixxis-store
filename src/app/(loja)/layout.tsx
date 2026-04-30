import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import { prisma } from '@/lib/prisma'
import CookieBanner from '@/components/cookies/CookieBanner'
import ComparadorBar from '@/components/layout/ComparadorBar'
import LojaWallpaper from '@/components/layout/LojaWallpaper'
import PopupInicial from '@/components/popup/PopupInicial'
import BottomNavMobile from '@/components/layout/BottomNavMobile'

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  let logoUrl = '/logo-sixxis.png'
  let bgUrl   = ''
  let bgAtivo = false
  let bgSize  = 'cover'
  let bgAttachment = 'fixed'
  let bgRepeat     = 'no-repeat'
  let bgPosition   = 'center center'
  let bgOverlay    = 0

  const cfgList = await prisma.configuracao.findMany({
    where: {
      chave: {
        in: [
          'logo_url',
          'bg_body_url', 'bg_body_ativo', 'bg_body_size',
          'bg_body_attachment', 'bg_body_position', 'bg_body_overlay',
          'agente_ativo',
        ],
      },
    },
  }).catch(() => [])

  const cfg = Object.fromEntries(cfgList.map((c) => [c.chave, c.valor]))

  if (cfg.logo_url) logoUrl = cfg.logo_url

  bgAtivo = cfg.bg_body_ativo === 'true' && !!cfg.bg_body_url
  if (bgAtivo) {
    bgUrl        = cfg.bg_body_url        || ''
    bgSize       = cfg.bg_body_size       || 'cover'
    bgAttachment = cfg.bg_body_attachment || 'fixed'
    bgRepeat     = cfg.bg_body_repeat     || 'no-repeat'
    bgPosition   = cfg.bg_body_position   || 'center center'
    bgOverlay    = Number(cfg.bg_body_overlay || 0)
  }

  const wallpaperStyle: React.CSSProperties = bgAtivo && bgUrl ? {
    backgroundImage:      `url(${bgUrl})`,
    backgroundSize:       bgSize,
    backgroundAttachment: bgAttachment,
    backgroundRepeat:     bgRepeat,
    backgroundPosition:   bgPosition,
    backgroundColor:      '#0f1f1d',
  } : { backgroundColor: '#0f1f1d' }

  return (
    <LojaWallpaper wallpaperStyle={wallpaperStyle} bgAtivo={bgAtivo} bgOverlay={bgOverlay}>
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 1 }}>
        <Header logoUrl={logoUrl} />
        {/* Spacer: reserva o espaço do header fixed; altura real via CSS var --sixxis-header-h */}
        <div aria-hidden="true" style={{ height: 'var(--sixxis-header-h, 140px)' }} />
        <div className="flex-1">{children}</div>
        <Footer />
        {/* Spacer mobile-only — reserva ~96px abaixo do Footer pro
            BottomNavMobile (fixed bottom-0, h-14 + safe-area) nao
            cobrir o final do footer ao scrollar ate o fim. Antes
            esse pb estava no flex-1 do conteudo, criando gap escuro
            entre fim do conteudo e o footer em paginas curtas. */}
        <div aria-hidden="true" className="h-24 md:h-0" />
        <FloatingButtons agenteAtivo={cfg.agente_ativo === 'true'} />
        <BottomNavMobile />
        <ComparadorBar />
        <CookieBanner />
        <PopupInicial />
      </div>
    </LojaWallpaper>
  )
}
