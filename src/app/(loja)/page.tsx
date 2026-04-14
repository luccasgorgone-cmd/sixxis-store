import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Cpu, Headphones, BadgeCheck, ShoppingCart } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import { prisma } from '@/lib/prisma'

import NewsletterForm from '@/components/layout/NewsletterForm'
import BannerCarousel from '@/components/layout/BannerCarousel'
import TrustBar from '@/components/layout/TrustBar'
import CategoriasSection from '@/components/home/CategoriasSection'
import OfertasRelampago from '@/components/home/OfertasRelampago'

export const dynamic    = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Sixxis Store — Climatizadores, Aspiradores e Spinning',
  description: 'Loja oficial Sixxis em Araçatuba-SP. Climatizadores, aspiradores e bikes spinning com qualidade premium. Garantia Sixxis, frete para todo o Brasil.',
}

export default async function HomePage() {
  let banners:         Awaited<ReturnType<typeof prisma.banner.findMany>>  = []
  let produtosMostrar: Awaited<ReturnType<typeof prisma.produto.findMany>> = []
  let produtosOferta:  Awaited<ReturnType<typeof prisma.produto.findMany>> = []
  let cfg:   Record<string, string> = {}
  let trust: Record<string, string> = {}

  try {
    const [bannersDb, destaques, produtosGerais, configRows, trustRows, ofertasDb] = await Promise.all([
      prisma.banner.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
      prisma.produtoDestaque.findMany({
        where: { secao: 'mais-vendidos' },
        include: { produto: true },
        orderBy: { ordem: 'asc' },
      }),
      prisma.produto.findMany({ where: { ativo: true }, take: 8, orderBy: { createdAt: 'desc' } }),
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
      prisma.produto.findMany({
        where: { ativo: true, precoPromocional: { not: null } },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    banners = bannersDb
    cfg     = Object.fromEntries(configRows.map((c) => [c.chave, c.valor]))
    trust   = Object.fromEntries(trustRows.map((r)  => [r.chave, r.valor]))
    produtosMostrar = destaques.length > 0
      ? destaques.map((d) => d.produto)
      : produtosGerais
    produtosOferta = ofertasDb
  } catch (error) {
    console.error('[HOME DB ERROR]', error)
  }

  // Wallpaper only on home page
  const bgAtivo = cfg.bg_body_ativo === 'true' && !!cfg.bg_body_url
  const wallpaperStyle: React.CSSProperties = bgAtivo ? {
    backgroundImage:      `url(${cfg.bg_body_url})`,
    backgroundSize:       cfg.bg_body_size       || 'cover',
    backgroundAttachment: cfg.bg_body_attachment || 'fixed',
    backgroundRepeat:     cfg.bg_body_repeat     || 'no-repeat',
    backgroundPosition:   cfg.bg_body_position   || 'center center',
    backgroundColor:      '#0f1f1d',
  } : { backgroundColor: '#0f1f1d' }
  const overlayOpacity = bgAtivo ? Number(cfg.bg_body_overlay || 0) : 0

  return (
    <div className="relative" style={wallpaperStyle}>
      {bgAtivo && overlayOpacity > 0 && (
        <div
          className="overlay-bg"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}
          aria-hidden="true"
        />
      )}
    <main className="min-h-screen bg-transparent">

      {/* ── 1. Banner ─────────────────────────────────────────────── */}
      {banners.length > 0 ? (
        <BannerCarousel banners={banners} />
      ) : (
        <section className="relative bg-gradient-to-br from-[#0f2e2b] via-[#1a4f4a] to-[#0f2e2b] min-h-[400px] flex items-center">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              Climatizadores, Aspiradores<br />
              <span className="text-[#3cbfb3]">e Bikes Spinning</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-xl">
              Produtos originais Sixxis com garantia e entrega rápida para todo o Brasil.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/produtos"
                className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-8 py-4 rounded-xl transition text-lg"
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

      {/* ── 2. TrustBar ───────────────────────────────────────────── */}
      <TrustBar items={[
        { titulo: trust.trust_1_titulo || 'Entrega para todo o Brasil', sub: trust.trust_1_sub || 'Frete grátis acima de R$ 500'    },
        { titulo: trust.trust_2_titulo || 'Compra 100% Segura',         sub: trust.trust_2_sub || 'Seus dados protegidos'            },
        { titulo: trust.trust_3_titulo || '6x sem juros no cartão',     sub: trust.trust_3_sub || 'Débito, crédito e PIX'            },
        { titulo: trust.trust_4_titulo || 'Produtos Originais',         sub: trust.trust_4_sub || 'Garantia Sixxis'                  },
      ]} />

      {/* ── 3. Categorias ─────────────────────────────────────────── */}
      <CategoriasSection />

      {/* ── 4. Produtos em Destaque ───────────────────────────────── */}
      <section className="bg-transparent border-b border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Header da seção */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-white">Produtos em Destaque</h2>
              <div className="w-12 h-0.5 bg-[#3cbfb3] mt-1 rounded-full" />
            </div>
            <Link
              href="/produtos"
              className="text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-semibold flex items-center gap-1 transition"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {produtosMostrar.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {produtosMostrar.map((produto) => (
                <CardProduto key={produto.id} produto={produto} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <ShoppingCart size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum produto disponível</p>
              <p className="text-gray-400 text-sm mt-1">Cadastre produtos no admin para exibi-los aqui</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Ofertas Relâmpago ──────────────────────────────────── */}
      <OfertasRelampago produtos={produtosOferta} />

      {/* ── 6. Banners duplos ─────────────────────────────────────── */}
      <section className="bg-transparent border-b border-white/10 pb-8 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Banner Climatizadores */}
            <Link
              href="/produtos?categoria=climatizadores"
              className="group relative overflow-hidden rounded-xl flex items-end p-7 hover:scale-[1.02] transition-transform duration-300"
              style={{ minHeight: '220px', background: 'linear-gradient(135deg, #0d3d3a 0%, #1a7a74 60%, #3cbfb3 100%)' }}
            >
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff, transparent)' }} />
              <div className="relative z-10 flex-1">
                <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  Linha Residencial e Comercial
                </span>
                <h3 className="text-white text-2xl font-extrabold leading-tight mb-4">
                  Climatizadores<br />Sixxis
                </h3>
                <span className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
                  Ver linha <ArrowRight size={14} />
                </span>
              </div>
              <div className="absolute right-4 bottom-0 w-[42%] h-[115%] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500 pointer-events-none">
                <Image
                  src="https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775737122831-k4d1lc1.jpg"
                  alt="Climatizador Sixxis"
                  fill
                  className="object-contain object-bottom drop-shadow-2xl"
                  unoptimized
                />
              </div>
            </Link>

            {/* Banner Spinning */}
            <Link
              href="/produtos?categoria=spinning"
              className="group relative overflow-hidden rounded-xl flex items-end p-7 hover:scale-[1.02] transition-transform duration-300"
              style={{ minHeight: '220px', background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 60%, #1f2937 100%)' }}
            >
              <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #3cbfb3, transparent)' }} />
              <div className="relative z-10 flex-1">
                <span className="inline-block bg-[#3cbfb3]/20 text-[#3cbfb3] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide border border-[#3cbfb3]/30">
                  Spinning &amp; Fitness
                </span>
                <h3 className="text-white text-2xl font-extrabold leading-tight mb-4">
                  Equipamentos<br />Fitness
                </h3>
                <span className="inline-flex items-center gap-2 bg-[#3cbfb3]/20 hover:bg-[#3cbfb3]/30 text-[#3cbfb3] text-sm font-bold px-4 py-2 rounded-xl transition border border-[#3cbfb3]/40">
                  Ver linha <ArrowRight size={14} />
                </span>
              </div>
              <div className="absolute right-4 bottom-0 w-[38%] h-[110%] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500 pointer-events-none">
                <Image
                  src="https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775754930452-4ixi773.png"
                  alt="Bike Spinning Sixxis"
                  fill
                  className="object-contain object-bottom drop-shadow-2xl"
                  unoptimized
                />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Stats ──────────────────────────────────────────────── */}
      <section className="bg-transparent border-b border-white/10 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-0 divide-x divide-white/20">
            {[
              { num: '1 Milhão+', label: 'Clientes Atendidos'    },
              { num: '12 meses',  label: 'Garantia Sixxis'       },
              { num: '100%',      label: 'Entrega para o Brasil' },
            ].map(({ num, label }) => (
              <div key={label} className="flex flex-col items-center text-center py-4 px-6">
                <p className="text-2xl md:text-3xl font-extrabold text-white">{num}</p>
                <p className="text-white/70 text-xs font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Por que Sixxis? ────────────────────────────────────── */}
      <section className="bg-transparent border-b border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-white">Por que Sixxis?</h2>
            <div className="w-12 h-0.5 bg-[#3cbfb3] mt-1 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { titulo: cfg.pq_sixxis_1_titulo || 'Tecnologia de Ponta',    texto: cfg.pq_sixxis_1_texto || 'Produtos desenvolvidos com engenharia avançada para máxima eficiência e durabilidade.', Icon: Cpu        },
              { titulo: cfg.pq_sixxis_2_titulo || 'Suporte Especializado',  texto: cfg.pq_sixxis_2_texto || 'Equipe técnica treinada para te ajudar antes, durante e após a compra.',              Icon: Headphones },
              { titulo: cfg.pq_sixxis_3_titulo || 'Melhor Custo-Benefício', texto: cfg.pq_sixxis_3_texto || 'Qualidade premium com preço justo. Garantia Sixxis em todos os produtos.',            Icon: BadgeCheck },
            ].map(({ titulo, texto, Icon }) => (
              <div
                key={titulo}
                className="bg-white/[0.08] border border-white/15 backdrop-blur-sm rounded-xl p-8 hover:shadow-lg hover:bg-white/[0.12] transition-all duration-300"
                style={{ borderTop: '4px solid #3cbfb3' }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#1a4f4a] flex items-center justify-center mb-5">
                  <Icon size={22} className="text-[#3cbfb3]" />
                </div>
                <h3 className="font-bold text-white mb-3 text-base">{titulo}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Newsletter ─────────────────────────────────────────── */}
      {cfg.newsletter_ativo !== 'false' && (
        <section className="bg-transparent border-b border-white/10 py-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-extrabold text-white mb-1">
              {cfg.newsletter_titulo || 'Receba novidades e promoções exclusivas'}
            </h2>
            <p className="text-white/70 text-sm mb-6">
              {cfg.newsletter_subtitulo || 'Sem spam. Cancele quando quiser.'}
            </p>
            <NewsletterForm />
          </div>
        </section>
      )}

      {/* ── 10. Banner WhatsApp ───────────────────────────────────── */}
      <section className="bg-transparent py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            {cfg.whatsapp_banner_titulo || 'Precisa de ajuda para escolher?'}
          </h2>
          <p className="text-white/70 mb-8 text-base leading-relaxed">
            {cfg.whatsapp_banner_subtitulo || 'Nossa equipe especializada está pronta para te orientar.'}
          </p>
          <a
            href={`https://wa.me/${cfg.social_whatsapp || '5518997474701'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-[#25D366]/40 hover:-translate-y-0.5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
            </svg>
            Falar no WhatsApp
          </a>
        </div>
      </section>

    </main>
    </div>
  )
}
