import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Cpu, Headphones, BadgeCheck, Tag, Zap } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import { prisma } from '@/lib/prisma'
import PagamentosBar from '@/components/layout/PagamentosBar'
import NewsletterForm from '@/components/layout/NewsletterForm'
import BannerCarousel from '@/components/layout/BannerCarousel'
import TrustBar from '@/components/layout/TrustBar'
import OfertaCountdown from '@/components/layout/OfertaCountdown'

export const dynamic    = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Sixxis Store — Climatizadores, Aspiradores e Spinning',
  description: 'Loja oficial Sixxis em Araçatuba-SP. Climatizadores, aspiradores e bikes spinning com qualidade premium. Garantia Sixxis, frete para todo o Brasil.',
}

// Categorias com fotos reais do R2 — estilo Casas Bahia
const categorias = [
  {
    nome: 'Climatizadores',
    href: '/produtos?categoria=climatizadores',
    imagem: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775737122831-k4d1lc1.jpg',
  },
  {
    nome: 'Aspiradores',
    href: '/produtos?categoria=aspiradores',
    imagem: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775743809308-70oi3e0.png',
  },
  {
    nome: 'Spinning',
    href: '/produtos?categoria=spinning',
    imagem: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775754930452-4ixi773.png',
  },
  {
    nome: 'Ofertas',
    href: '/ofertas',
    imagem: null,
    badge: 'HOT',
  },
]

export default async function HomePage() {
  let banners: Awaited<ReturnType<typeof prisma.banner.findMany>> = []
  let produtosMostrar: Awaited<ReturnType<typeof prisma.produto.findMany>> = []
  let cfg:   Record<string, string> = {}
  let trust: Record<string, string> = {}

  try {
    const [bannersDb, destaques, produtosGerais, configRows, trustRows] = await Promise.all([
      prisma.banner.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
      prisma.produtoDestaque.findMany({ where: { secao: 'mais-vendidos' }, include: { produto: true }, orderBy: { ordem: 'asc' } }),
      prisma.produto.findMany({ where: { ativo: true }, take: 8, orderBy: { createdAt: 'desc' } }),
      prisma.configuracao.findMany(),
      prisma.configuracao.findMany({
        where: { chave: { in: ['trust_1_titulo','trust_1_sub','trust_2_titulo','trust_2_sub','trust_3_titulo','trust_3_sub','trust_4_titulo','trust_4_sub'] } },
      }),
    ])
    banners = bannersDb
    cfg = Object.fromEntries(configRows.map((c) => [c.chave, c.valor]))
    trust = Object.fromEntries(trustRows.map((r) => [r.chave, r.valor]))
    produtosMostrar = destaques.length > 0 ? destaques.map((d) => d.produto) : produtosGerais
  } catch (error) {
    console.error('[HOME DB ERROR]', error)
  }

  // Target para o countdown: meia-noite de hoje
  const hoje = new Date()
  hoje.setHours(23, 59, 59, 0)
  const countdownTarget = hoje.toISOString()

  return (
    <main className="bg-[#f5f5f5] min-h-screen">

      {/* 1. BannerCarousel */}
      {banners.length > 0 ? (
        <Suspense fallback={
          <div
            className="w-full flex items-center justify-center"
            style={{ height: 'clamp(280px, 50vw, 560px)', backgroundColor: '#0f2e2b' }}
          >
            <div className="text-[#3cbfb3] text-xl font-bold">Sixxis Store</div>
          </div>
        }>
          <BannerCarousel banners={banners} />
        </Suspense>
      ) : (
        <section
          style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
          className="py-28"
        >
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-8">
              🏆 Loja Oficial Sixxis — Araçatuba, SP
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              {cfg.hero_titulo || 'Alta Performance para o seu Conforto'}
            </h1>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
              {cfg.hero_subtitulo || 'Climatizadores, aspiradores e equipamentos fitness com qualidade e garantia Sixxis.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={cfg.hero_cta_link || '/produtos'} style={{ background: '#3cbfb3' }} className="text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition">
                {cfg.hero_cta_texto || 'Ver Produtos'} →
              </Link>
              <Link href="/ofertas" className="text-white font-bold px-8 py-4 rounded-xl border border-white/30 hover:border-white/60 transition">
                Ver Ofertas
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. TrustBar */}
      <TrustBar items={[
        { titulo: trust.trust_1_titulo || 'Entrega para todo o Brasil', sub: trust.trust_1_sub || 'Frete grátis acima de R$ 500' },
        { titulo: trust.trust_2_titulo || 'Compra 100% Segura',         sub: trust.trust_2_sub || 'Seus dados protegidos' },
        { titulo: trust.trust_3_titulo || '6x sem juros no cartão',     sub: trust.trust_3_sub || 'Débito, crédito e PIX' },
        { titulo: trust.trust_4_titulo || 'Produtos Originais',         sub: trust.trust_4_sub || 'Garantia Sixxis' },
      ]} />

      {/* 3. Categorias com fotos — estilo Casas Bahia */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide justify-center">
            {categorias.map(cat => (
              <Link key={cat.nome} href={cat.href}
                className="flex flex-col items-center gap-2 min-w-[80px] group"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-[#3cbfb3] transition-all shadow-sm bg-gray-50 flex items-center justify-center">
                  {cat.imagem ? (
                    <Image
                      src={cat.imagem}
                      alt={cat.nome}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Tag size={28} className="text-[#f59e0b]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#3cbfb3] text-center whitespace-nowrap transition-colors">
                  {cat.nome}
                  {cat.badge && (
                    <span className="ml-1 bg-[#f59e0b] text-white text-[9px] font-black px-1 rounded">
                      {cat.badge}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Produtos em Destaque */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Produtos em Destaque</h2>
          {produtosMostrar.length > 0 && (
            <Link href="/produtos" className="flex items-center gap-1.5 text-sm font-medium text-[#3cbfb3] hover:text-[#2a9d8f] transition">
              Ver todos <ArrowRight size={14} />
            </Link>
          )}
        </div>
        {produtosMostrar.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {produtosMostrar.map((produto) => (
              <CardProduto key={produto.id} produto={produto} />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#3cbfb3]/30 rounded-2xl p-10 text-center bg-white">
            <div className="w-16 h-16 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-4">
              <ArrowRight size={28} className="text-[#3cbfb3]" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Nenhum produto cadastrado ainda</h3>
            <p className="text-sm text-gray-500 mb-6">Adicione produtos no painel admin para que apareçam aqui.</p>
            <Link
              href="/admin/produtos"
              className="inline-flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              Cadastrar Produtos
            </Link>
          </div>
        )}
      </section>

      {/* 5. Ofertas Relâmpago */}
      {produtosMostrar.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            {/* Header da seção */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={22} className="text-[#f59e0b] fill-[#f59e0b]" />
                <h2 className="text-xl font-bold text-gray-900">Ofertas Relâmpago</h2>
              </div>
              {/* Countdown */}
              <OfertaCountdown targetDate={countdownTarget} />
            </div>
            {/* Cards em scroll horizontal */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {produtosMostrar.slice(0, 6).map((produto) => (
                <div key={produto.id} className="min-w-[180px] max-w-[200px] flex-shrink-0">
                  <CardProduto produto={produto} ofertaBadge />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Banners duplos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/produtos?categoria=climatizadores"
            className="group relative overflow-hidden rounded-xl flex flex-col justify-end p-7 hover:scale-[1.02] transition-transform duration-300"
            style={{ minHeight: '200px', background: 'linear-gradient(135deg, #0d3d3a 0%, #1a7a74 60%, #3cbfb3 100%)' }}
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff, transparent)' }} />
            <div className="relative z-10">
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
          </Link>

          <Link
            href="/produtos?categoria=spinning"
            className="group relative overflow-hidden rounded-xl flex flex-col justify-end p-7 hover:scale-[1.02] transition-transform duration-300"
            style={{ minHeight: '200px', background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 60%, #1f2937 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #3cbfb3, transparent)' }} />
            <div className="relative z-10">
              <span className="inline-block bg-[#3cbfb3]/20 text-[#3cbfb3] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide border border-[#3cbfb3]/30">
                Spinning & Fitness
              </span>
              <h3 className="text-white text-2xl font-extrabold leading-tight mb-4">
                Equipamentos<br />Fitness
              </h3>
              <span className="inline-flex items-center gap-2 bg-[#3cbfb3]/20 hover:bg-[#3cbfb3]/30 text-[#3cbfb3] text-sm font-bold px-4 py-2 rounded-xl transition border border-[#3cbfb3]/40">
                Ver linha <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 7. Stats */}
      <section style={{ backgroundColor: 'var(--color-stats, #3cbfb3)' }} className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/20">
            {[
              { num: cfg.stat_1_num   || '5.000+',   label: cfg.stat_1_label || 'Clientes Satisfeitos' },
              { num: cfg.stat_2_num   || '12 meses', label: cfg.stat_2_label || 'Garantia Sixxis' },
              { num: cfg.stat_3_num   || '100%',     label: cfg.stat_3_label || 'Entrega para o Brasil' },
              { num: cfg.stat_4_num   || '48h',      label: cfg.stat_4_label || 'Entrega Expressa SP' },
            ].map(({ num, label }) => (
              <div key={label} className="flex flex-col items-center text-center py-4 px-6">
                <p className="text-2xl md:text-3xl font-extrabold text-white">{num}</p>
                <p className="text-white/80 text-xs font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Por que Sixxis? */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Por que Sixxis?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { titulo: cfg.pq_sixxis_1_titulo || 'Tecnologia de Ponta',    texto: cfg.pq_sixxis_1_texto || 'Produtos desenvolvidos com engenharia avançada para máxima eficiência e durabilidade.', Icon: Cpu       },
              { titulo: cfg.pq_sixxis_2_titulo || 'Suporte Especializado',  texto: cfg.pq_sixxis_2_texto || 'Equipe técnica treinada para te ajudar antes, durante e após a compra.',              Icon: Headphones },
              { titulo: cfg.pq_sixxis_3_titulo || 'Melhor Custo-Benefício', texto: cfg.pq_sixxis_3_texto || 'Qualidade premium com preço justo. Garantia Sixxis em todos os produtos.',            Icon: BadgeCheck },
            ].map(({ titulo, texto, Icon }) => (
              <div
                key={titulo}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300"
                style={{ borderTop: '4px solid #3cbfb3' }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#e8f8f7] flex items-center justify-center mb-5">
                  <Icon size={22} className="text-[#3cbfb3]" />
                </div>
                <h3 className="font-bold text-[#0a0a0a] mb-3 text-base">{titulo}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Newsletter */}
      {cfg.newsletter_ativo !== 'false' && (
        <section className="py-10 bg-[#1a4f4a]">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
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

      {/* 10. Banner WhatsApp */}
      <section className="py-10" style={{ backgroundColor: 'var(--color-wa, #111827)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            {cfg.whatsapp_banner_titulo || 'Precisa de ajuda para escolher?'}
          </h2>
          <p className="text-white/60 mb-8 text-base leading-relaxed">
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

      {/* 11. PagamentosBar */}
      <PagamentosBar />
    </main>
  )
}

