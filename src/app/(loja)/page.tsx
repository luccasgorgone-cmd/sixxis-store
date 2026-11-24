import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { MAX_PARCELAS_SEM_JUROS } from '@/lib/parcelamento'

import NewsletterForm from '@/components/layout/NewsletterForm'
import BannerCarousel from '@/components/layout/BannerCarousel'
import TrustBar from '@/components/layout/TrustBar'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import MaisVendidosCarrossel from '@/components/home/MaisVendidosCarrossel'
import { PQ_SIXXIS_CARDS, PQ_SIXXIS_NUMS } from '@/lib/porque-sixxis-defaults'
import { getPqSixxisIcon } from '@/lib/porque-sixxis-icons'
import { DuvidasBlackFriday, OfertaDupla, SuporteSixxis } from '@/components/bf/BlocosHome'
import { PROMO_BF } from '@/lib/promo-segunda-unidade'

export const dynamic    = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: { absolute: 'Sixxis — Climatizadores, Aspiradores e Spinning' },
  description: 'Climatizadores evaporativos, aspiradores sem fio e bikes spinning com qualidade premium. Garantia Sixxis de 12 meses. Frete para todo o Brasil.',
  // Relativo: resolve contra metadataBase (uma só fonte de domínio no layout raiz).
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  let banners:         Awaited<ReturnType<typeof prisma.banner.findMany>>  = []
  let produtosMostrar: Awaited<ReturnType<typeof prisma.produto.findMany>> = []
  let cfg:   Record<string, string> = {}
  let trust: Record<string, string> = {}

  try {
    const [bannersDb, destaques, produtosGerais, configRows, trustRows] = await Promise.all([
      prisma.banner.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
      prisma.produtoDestaque.findMany({
        where: { secao: 'mais-vendidos' },
        include: { produto: true },
        orderBy: { ordem: 'asc' },
      }),
      prisma.produto.findMany({ where: { ativo: true }, take: 12, orderBy: { createdAt: 'desc' } }),
      prisma.configuracao.findMany(),
      prisma.configuracao.findMany({
        where: {
          chave: {
            in: [
              'trust_1_titulo','trust_1_sub','trust_2_titulo','trust_2_sub',
              'trust_3_titulo','trust_3_sub','trust_4_titulo','trust_4_sub',
            ],
          },
        },
      }),
    ])

    banners = bannersDb
    cfg     = Object.fromEntries(configRows.map((c) => [c.chave, c.valor]))
    trust   = Object.fromEntries(trustRows.map((r)  => [r.chave, r.valor]))
    produtosMostrar = destaques.length > 0
      ? destaques.map((d) => d.produto)
      : produtosGerais
  } catch (error) {
    console.error('[HOME DB ERROR]', error)
  }

  // Slide Black Friday como PRIMEIRO banner do carrossel principal (imagem com
  // texto/oferta embutidos, nos formatos do carrossel: desktop 3/1, mobile 16/9).
  const bfSlide: (typeof banners)[number] = {
    id: 'black-friday-2026',
    imagem: '/black-friday/slide-bf-desktop.webp',
    imagemTablet: '/black-friday/slide-bf-desktop.webp',
    imagemMobile: '/black-friday/slide-bf-mobile.webp',
    titulo: `Black Friday Sixxis — 2ª unidade com 50% OFF${PROMO_BF.ressalva ? `, ${PROMO_BF.ressalva}` : ''}`,
    subtitulo: null,
    link: '/produtos',
    ordem: -1,
    ativo: true,
    tempoCads: 6,
    aspectMobile: '16 / 9',
    aspectTablet: '3 / 1',
    aspectDesktop: '3 / 1',
    maxHeightDesktop: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const bannersComBF = [bfSlide, ...banners]

  return (
    <main className="min-h-screen bg-transparent">

      {/* ── 1. Banner ─────────────────────────────────────────────── */}
      <div>
      {bannersComBF.length > 0 ? (
        <BannerCarousel banners={bannersComBF} />
      ) : (
        <section className="sx-escuro relative bg-gradient-to-br from-[#0f2e2b] via-[#1a4f4a] to-[#0f2e2b] min-h-[400px] flex items-center">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              Climatizadores, Aspiradores<br />
              <span className="text-sx-accent-text">e Bikes Spinning</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-xl">
              Produtos originais Sixxis com garantia e entrega rápida para todo o Brasil.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/produtos"
                className="bg-sx-accent hover:bg-sx-accent-hover text-sx-ink font-bold px-8 py-4 rounded-xl transition text-lg"
              >
                Explorar Produtos →
              </Link>
              <a
                href="https://wa.me/5518997474701"
                className="border-2 border-white/30 hover:border-white text-white font-bold px-8 py-4 rounded-xl transition text-lg"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}
      </div>

      {/* ── 2. TrustBar / Barra de anúncio ────────────────────────── */}
      {(() => {
        const trustItems = [
          { titulo: trust.trust_1_titulo || 'Entrega para todo o Brasil', sub: trust.trust_1_sub || 'Despacho em 24h'    },
          { titulo: trust.trust_2_titulo || 'Compra 100% Segura',         sub: trust.trust_2_sub || 'Seus dados protegidos'            },
          { titulo: trust.trust_3_titulo || `${MAX_PARCELAS_SEM_JUROS}x sem juros no cartão`, sub: trust.trust_3_sub || 'Débito, crédito e PIX'            },
        ]
        return (
          <>
            {/* Mobile: barra fina rotativa (1 dizer por vez) — topo mais limpo */}
            <div className="md:hidden">
              <AnnouncementBar items={trustItems} />
            </div>
            {/* Tablet/Desktop: 3 selos lado a lado */}
            <div className="hidden md:block">
              <TrustBar items={trustItems} />
            </div>
          </>
        )
      })()}

      {/* ── 3. Mais Vendidos ─────────────────────────────────────── */}
      <section className="min-h-[280px] py-10 md:min-h-[420px] md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Header da seção */}
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <h2 className="text-[26px] font-extrabold leading-[1.12] text-sx-text sm:text-[32px]">Mais Vendidos</h2>
            <Link
              href="/produtos"
              className="text-sm text-sx-accent-text hover:text-sx-accent-text font-semibold flex items-center gap-1 transition"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {produtosMostrar.length > 0 ? (
            <MaisVendidosCarrossel produtos={produtosMostrar} />
          ) : (
            <div className="text-center py-16 rounded-2xl border border-sx-line" style={{ backgroundColor: 'var(--sx-surface)' }}>
              <ShoppingCart size={48} className="text-sx-subtle mx-auto mb-4" />
              <p className="text-sx-muted font-medium">Nenhum produto disponível</p>
              <p className="text-sx-subtle text-sm mt-1">Cadastre produtos no admin para exibi-los aqui</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Banners duplos ─────────────────────────────────────── */}
      <section className="pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Banner Climatizadores */}
            <Link
              href="/produtos?categoria=climatizadores"
              className="sx-escuro group relative flex aspect-[2/1] items-end overflow-hidden rounded-xl p-5 sm:p-7"
            >
              <Image
                src="https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/banner-climatizadores-1791346860.jpg"
                alt="Climatizadores Sixxis"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover object-[62%_center] group-hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
              <div className="relative z-10 flex-1">
                <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 sm:mb-3 uppercase tracking-wide">
                  Linha Residencial e Comercial
                </span>
                <h3 className="text-white text-xl sm:text-2xl font-extrabold leading-tight mb-3 sm:mb-4 drop-shadow">
                  Climatizadores<br />Sixxis
                </h3>
                <span className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl transition backdrop-blur-sm">
                  Ver linha <ArrowRight size={14} />
                </span>
              </div>
            </Link>

            {/* Banner Spinning */}
            <Link
              href="/produtos?categoria=spinning"
              className="sx-escuro group relative flex aspect-[2/1] items-end overflow-hidden rounded-xl p-5 sm:p-7"
            >
              <Image
                src="https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/banner-spinning-1791346860.jpg"
                alt="Bikes Spinning Sixxis"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover object-[66%_center] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
              <div className="relative z-10 flex-1">
                <span className="inline-block bg-sx-accent/25 text-sx-accent-text text-xs font-bold px-3 py-1 rounded-full mb-2 sm:mb-3 uppercase tracking-wide border border-sx-accent/40">
                  Spinning &amp; Fitness
                </span>
                <h3 className="text-white text-xl sm:text-2xl font-extrabold leading-tight mb-3 sm:mb-4 drop-shadow">
                  Equipamentos<br />Fitness
                </h3>
                <span className="inline-flex items-center gap-2 bg-sx-accent/25 hover:bg-sx-accent/40 text-white text-sm font-bold px-4 py-2 rounded-xl transition border border-sx-accent/40 backdrop-blur-sm">
                  Ver linha <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <OfertaDupla />

      {/* ── 7. Por que Sixxis? ────────────────────────────────────── */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-7">
            <h2 className="text-[26px] font-extrabold leading-[1.12] text-sx-text sm:text-[32px]">Por que Sixxis?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {PQ_SIXXIS_NUMS.filter((n) => n !== 1).map((n) => {
              const idx = n - 1
              const def = PQ_SIXXIS_CARDS[idx]
              const titulo = cfg[`pq_sixxis_${n}_titulo`] || def.titulo
              const texto  = cfg[`pq_sixxis_${n}_texto`]  || def.texto
              const Icon   = getPqSixxisIcon(cfg[`pq_sixxis_${n}_icone`] || def.icone)
              // Imagem de fundo por box (n=2 entrega rápida, n=3 suporte, n=4 todo Brasil).
              const bgImg = n === 2
                ? '/bg-entrega-rapida.jpg'
                : n === 3
                ? '/bg-suporte-especializado.jpg'
                : '/bg-entrega-brasil.jpg'
              return (
                <div
                  key={n}
                  className="sx-escuro relative overflow-hidden rounded-xl p-4 text-center sm:p-6 lg:p-8"
                  style={{ backgroundColor: 'var(--sx-surface)', borderTop: '4px solid var(--sx-accent)' }}
                >
                  {/* Imagem de fundo nítida + scrim leve (mais forte só na base,
                      onde fica o texto) e sombra no texto p/ legibilidade. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImg})` }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, rgba(8,20,18,0.5) 0%, rgba(8,20,18,0.68) 55%, rgba(8,20,18,0.82) 100%)' }}
                  />
                  <div className="relative z-10" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/30 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center mb-3 sm:mb-5 mx-auto">
                      <Icon size={20} className="text-sx-accent-text sm:w-[22px] sm:h-[22px]" />
                    </div>
                    <h3 className="font-bold text-white mb-2 sm:mb-3 text-sm sm:text-base">{titulo}</h3>
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed">{texto}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <SuporteSixxis
        whatsappVendas={cfg.social_whatsapp || '5518997474701'}
        whatsappSuporte={cfg.social_whatsapp_suporte || '5511934102621'}
      />
      <DuvidasBlackFriday />

      {/* ── 7. Newsletter ─────────────────────────────────────────── */}
      {cfg.newsletter_ativo !== 'false' && (
        <section className="border-b border-sx-line py-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-extrabold text-sx-text mb-1">
              {cfg.newsletter_titulo || 'Receba novidades e promoções exclusivas'}
            </h2>
            <p className="text-sx-muted text-sm mb-6">
              {cfg.newsletter_subtitulo || 'Cadastre-se e ganhe 5% OFF na próxima compra + ofertas exclusivas em primeira mão.'}
            </p>
            <NewsletterForm />
            <p className="text-xs text-sx-subtle mt-2">Sem spam. Cancele quando quiser.</p>
          </div>
        </section>
      )}

    </main>
  )
}
