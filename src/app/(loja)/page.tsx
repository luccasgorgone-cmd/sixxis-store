import type { Metadata } from 'next'
import Link from 'next/link'
import { Wind, Fan, Bike, Wrench, ArrowRight, Cpu, Headphones, BadgeCheck, Star } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import { prisma } from '@/lib/prisma'
import PagamentosBar from '@/components/layout/PagamentosBar'
import NewsletterForm from '@/components/layout/NewsletterForm'
import BannerCarousel from '@/components/layout/BannerCarousel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sixxis Store — Climatizadores, Aspiradores e Spinning',
  description: 'Loja oficial Sixxis em Araçatuba-SP. Climatizadores, aspiradores, bikes spinning e peças originais. Garantia Sixxis, frete para todo o Brasil.',
}

const categorias = [
  { label: 'Climatizadores', desc: 'Conforto térmico para sua casa',    href: '/produtos?categoria=climatizadores', icon: Wind  },
  { label: 'Aspiradores',    desc: 'Limpeza eficiente e prática',        href: '/produtos?categoria=aspiradores',    icon: Fan   },
  { label: 'Spinning',       desc: 'Desempenho fitness profissional',    href: '/produtos?categoria=spinning',       icon: Bike  },
  { label: 'Peças',          desc: 'Reposição original garantida',       href: '/pecas',                            icon: Wrench},
]

const ICON_MAP: Record<number, typeof Cpu> = { 1: Cpu, 2: Headphones, 3: BadgeCheck }

export default async function HomePage() {
  const [banners, destaques, produtosGerais, configRows] = await Promise.all([
    prisma.banner.findMany({
      where:   { ativo: true },
      orderBy: { ordem: 'asc' },
    }),
    prisma.produtoDestaque.findMany({
      where:   { secao: 'mais-vendidos' },
      orderBy: { ordem: 'asc' },
      include: { produto: true },
      take:    8,
    }),
    prisma.produto.findMany({
      where:   { ativo: true },
      orderBy: { createdAt: 'desc' },
      take:    8,
    }),
    prisma.configuracao.findMany(),
  ])

  const cfg = Object.fromEntries(configRows.map((c) => [c.chave, c.valor]))

  // Mais vendidos: curados primeiro, fallback para produtos gerais
  const produtosMaisVendidos = destaques.length > 0
    ? destaques.map((d) => d.produto)
    : produtosGerais.slice(0, 4)

  // Configs com defaults
  const heroTitulo     = cfg.hero_titulo     || 'Alta Performance para o seu Conforto e Bem-Estar'
  const heroSubtitulo  = cfg.hero_subtitulo  || 'Climatizadores, aspiradores e equipamentos fitness com qualidade Sixxis e garantia total.'
  const heroCtaTexto   = cfg.hero_cta_texto  || 'Explorar Produtos'
  const heroCtaLink    = cfg.hero_cta_link   || '/produtos'
  const heroImagemUrl  = cfg.hero_imagem_url || ''

  const whatsappNumero    = cfg.social_whatsapp          || '5518997474701'
  const whatsappTitulo    = cfg.whatsapp_banner_titulo    || 'Precisa de ajuda para escolher?'
  const whatsappSubtitulo = cfg.whatsapp_banner_subtitulo || 'Nossa equipe especializada está pronta para te orientar e encontrar o produto ideal para suas necessidades.'

  const newsletterAtivo     = cfg.newsletter_ativo     !== 'false'
  const newsletterTitulo    = cfg.newsletter_titulo     || 'Receba novidades e promoções exclusivas'
  const newsletterSubtitulo = cfg.newsletter_subtitulo  || 'Sem spam. Cancele quando quiser.'

  const porqueSixxis = [1, 2, 3].map((n) => ({
    icon:  ICON_MAP[n],
    title: cfg[`pq_sixxis_${n}_titulo`] || ['Tecnologia de Ponta', 'Suporte Especializado', 'Melhor Custo-Benefício'][n - 1],
    text:  cfg[`pq_sixxis_${n}_texto`]  || [
      'Produtos desenvolvidos com engenharia avançada para máxima eficiência e durabilidade.',
      'Equipe técnica treinada para te ajudar antes, durante e após a compra.',
      'Qualidade premium com preço justo. Garantia Sixxis em todos os produtos.',
    ][n - 1],
  }))

  return (
    <main className="bg-white">

      {/* ── Banner Carousel ou Hero Estático ────────────────────────────────── */}
      {banners.length > 0 ? (
        <BannerCarousel banners={banners} />
      ) : (
        <section
          className="relative overflow-hidden"
          style={
            heroImagemUrl
              ? { backgroundImage: `url(${heroImagemUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }
          }
        >
          {heroImagemUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-8">
              <span>🏆</span> Loja Oficial Sixxis — Araçatuba, SP
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              {heroTitulo}
            </h1>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              {heroSubtitulo}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={heroCtaLink} className="btn-primary text-base">{heroCtaTexto} →</Link>
              <Link href="/pecas" className="btn-outline-white text-base">Peças de Reposição</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#3cbfb3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '10+',    label: 'Anos de Mercado'    },
              { num: '5.000+', label: 'Clientes Atendidos' },
              { num: '15+',    label: 'Produtos'           },
              { num: '100%',   label: 'Garantia'           },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="text-3xl md:text-4xl font-extrabold text-white">{num}</p>
                <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categorias ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="section-title mb-10">Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categorias.map(({ label, desc, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group bg-white border border-gray-200 hover:border-[#3cbfb3] rounded-xl p-6 text-center flex flex-col items-center gap-3 transition-all duration-200 hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-full bg-[#e8f8f7] group-hover:bg-[#3cbfb3] flex items-center justify-center transition-colors duration-200">
                <Icon size={24} className="text-[#3cbfb3] group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <p className="font-bold text-[#0a0a0a] text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Banners duplos ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/produtos?categoria=climatizadores"
            className="group relative overflow-hidden rounded-2xl h-[180px] flex flex-col justify-end p-6 transition-transform duration-300 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #0d4a47 0%, #1a7a74 50%, #3cbfb3 100%)' }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,#fff,transparent)]" />
            <div className="relative z-10">
              <p className="text-[#a8ede9] text-xs font-semibold uppercase tracking-widest mb-1">Linha Residencial e Comercial</p>
              <h3 className="text-white text-xl font-extrabold leading-tight mb-3">Climatizadores<br />Sixxis</h3>
              <span className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full transition">
                Ver modelos <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          <Link
            href="/produtos?categoria=spinning"
            className="group relative overflow-hidden rounded-2xl h-[180px] flex flex-col justify-end p-6 transition-transform duration-300 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 60%, #2a2a2a 100%)' }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_80%,#3cbfb3,transparent)]" />
            <div className="relative z-10">
              <p className="text-[#3cbfb3] text-xs font-semibold uppercase tracking-widest mb-1">Spinning & Acessórios</p>
              <h3 className="text-white text-xl font-extrabold leading-tight mb-3">Equipamentos<br />Fitness</h3>
              <span className="inline-flex items-center gap-1.5 bg-[#3cbfb3]/20 hover:bg-[#3cbfb3]/30 text-[#3cbfb3] text-xs font-bold px-3 py-1.5 rounded-full transition border border-[#3cbfb3]/40">
                Ver produtos <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Produtos em Destaque ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">Produtos em Destaque</h2>
          <Link href="/produtos" className="flex items-center gap-1.5 text-sm font-medium text-[#3cbfb3] hover:text-[#2a9d8f] transition">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {produtosGerais.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-4">
              <Bike size={28} className="text-[#3cbfb3]" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum produto cadastrado ainda.</p>
            <p className="text-sm text-gray-400 mt-1">Os produtos serão exibidos aqui após o cadastro no admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {produtosGerais.map((produto) => (
              <CardProduto key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>

      {/* ── Mais Vendidos ───────────────────────────────────────────────────── */}
      {produtosMaisVendidos.length > 0 && (
        <section className="bg-[#f8f9fa] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3cbfb3] flex items-center justify-center">
                  <Star size={18} className="text-white fill-white" />
                </div>
                <h2 className="section-title">Mais Vendidos</h2>
              </div>
              <Link href="/produtos" className="flex items-center gap-1.5 text-sm font-medium text-[#3cbfb3] hover:text-[#2a9d8f] transition">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {produtosMaisVendidos.map((produto) => (
                <CardProduto key={produto.id} produto={produto} showDesconto />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Por que Sixxis? ──────────────────────────────────────────────────── */}
      <section className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title mb-10">Por que Sixxis?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {porqueSixxis.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-xl p-6" style={{ borderTop: '4px solid #3cbfb3' }}>
                <div className="w-12 h-12 rounded-xl bg-[#e8f8f7] flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[#3cbfb3]" />
                </div>
                <h3 className="font-bold text-[#0a0a0a] mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────────────── */}
      {newsletterAtivo && (
        <section className="bg-[#f8f9fa] border-t border-b border-gray-200 py-12">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-extrabold text-[#0a0a0a] mb-1">{newsletterTitulo}</h2>
            <p className="text-gray-500 text-sm mb-6">{newsletterSubtitulo}</p>
            <NewsletterForm />
          </div>
        </section>
      )}

      {/* ── Banner WhatsApp ──────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">{whatsappTitulo}</h2>
          <p className="text-white/60 mb-8">{whatsappSubtitulo}</p>
          <a
            href={`https://wa.me/${whatsappNumero}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base"
          >
            Falar no WhatsApp →
          </a>
        </div>
      </section>

      {/* ── Formas de Pagamento ──────────────────────────────────────────────── */}
      <PagamentosBar />
    </main>
  )
}
