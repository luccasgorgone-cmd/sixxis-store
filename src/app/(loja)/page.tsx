import type { Metadata } from 'next'
import Link from 'next/link'
import { Wind, Fan, Bike, Wrench, ArrowRight, Cpu, Headphones, BadgeCheck, Star, Users, Package, Award } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import { prisma } from '@/lib/prisma'
import PagamentosBar from '@/components/layout/PagamentosBar'
import NewsletterForm from '@/components/layout/NewsletterForm'
import BannerCarousel from '@/components/layout/BannerCarousel'

export const dynamic    = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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

const DEFAULT_ORDER = ['banners', 'stats', 'categorias', 'mais-vendidos', 'por-que-sixxis', 'banners-duplos', 'newsletter', 'whatsapp']

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

  console.log('[HOME]', {
    banners:      banners.length,
    destaques:    destaques.length,
    produtos:     produtosGerais.length,
    configs:      configRows.length,
    logoUrl:      cfg.logo_url,
    corPrincipal: cfg.cor_principal,
  })

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
  const newsletterTitulo    = cfg.newsletter_titulo    || 'Receba novidades e promoções exclusivas'
  const newsletterSubtitulo = cfg.newsletter_subtitulo || 'Sem spam. Cancele quando quiser.'

  const porqueSixxis = [1, 2, 3].map((n) => ({
    icon:  ICON_MAP[n],
    title: cfg[`pq_sixxis_${n}_titulo`] || ['Tecnologia de Ponta', 'Suporte Especializado', 'Melhor Custo-Benefício'][n - 1],
    text:  cfg[`pq_sixxis_${n}_texto`]  || [
      'Produtos desenvolvidos com engenharia avançada para máxima eficiência e durabilidade.',
      'Equipe técnica treinada para te ajudar antes, durante e após a compra.',
      'Qualidade premium com preço justo. Garantia Sixxis em todos os produtos.',
    ][n - 1],
  }))

  let ordemSecoes: string[]
  try {
    ordemSecoes = cfg.home_secoes_ordem ? JSON.parse(cfg.home_secoes_ordem) : DEFAULT_ORDER
  } catch {
    ordemSecoes = DEFAULT_ORDER
  }

  // ── Seções ────────────────────────────────────────────────────────────────
  const SECOES: Record<string, React.ReactNode> = {
    banners: banners.length > 0 ? (
      <BannerCarousel key="banners" banners={banners} />
    ) : (
      <section
        key="banners"
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
    ),

    stats: (
      <section key="stats" className="bg-[#3cbfb3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { num: '10+',    label: 'Anos de Mercado',    icon: Award    },
              { num: '5.000+', label: 'Clientes Atendidos', icon: Users    },
              { num: '15+',    label: 'Produtos',           icon: Package  },
              { num: '100%',   label: 'Garantia',           icon: BadgeCheck },
            ].map(({ num, label, icon: Icon }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center text-center py-6 px-4 ${
                  i < 3 ? 'md:border-r border-white/20' : ''
                } ${i === 0 || i === 2 ? 'border-b md:border-b-0 border-white/20' : ''}`}
              >
                <Icon size={20} className="text-white/70 mb-2" strokeWidth={1.5} />
                <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{num}</p>
                <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    categorias: (
      <section key="categorias" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="section-title mb-10">Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categorias.map(({ label, desc, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group bg-white border border-gray-200 hover:border-[#3cbfb3] rounded-xl p-6 text-center flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              aria-label={`Ver ${label}`}
            >
              <div className="w-16 h-16 rounded-full bg-[#e8f8f7] group-hover:bg-[#3cbfb3] flex items-center justify-center transition-all duration-300">
                <Icon size={28} className="text-[#3cbfb3] group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <p className="font-bold text-[#0a0a0a] text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    ),

    'mais-vendidos': produtosMaisVendidos.length > 0 ? (
      <section key="mais-vendidos" className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3cbfb3] flex items-center justify-center">
                <Star size={18} className="text-white fill-white" />
              </div>
              <h2 className="section-title">Mais Vendidos</h2>
            </div>
            <Link href="/produtos" className="flex items-center gap-1.5 text-sm font-medium text-[#3cbfb3] hover:text-[#2a9d8f] transition group">
              Ver todos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {produtosMaisVendidos.map((produto) => (
              <CardProduto key={produto.id} produto={produto} showDesconto />
            ))}
          </div>
        </div>
      </section>
    ) : null,

    'produtos-destaque': (
      <section key="produtos-destaque" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
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
    ),

    'por-que-sixxis': (
      <section key="por-que-sixxis" className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title mb-10">Por que Sixxis?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {porqueSixxis.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300"
                style={{ borderTop: '4px solid #3cbfb3' }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#e8f8f7] flex items-center justify-center mb-5">
                  <Icon size={22} className="text-[#3cbfb3]" />
                </div>
                <h3 className="font-bold text-[#0a0a0a] mb-3 text-base">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    'banners-duplos': (
      <section key="banners-duplos" className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
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
    ),

    newsletter: newsletterAtivo ? (
      <section key="newsletter" className="bg-[#f8f9fa] border-t border-b border-gray-200 py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-[#0a0a0a] mb-1">{newsletterTitulo}</h2>
          <p className="text-gray-500 text-sm mb-6">{newsletterSubtitulo}</p>
          <NewsletterForm />
        </div>
      </section>
    ) : null,

    whatsapp: (
      <section key="whatsapp" className="bg-[#0a0a0a] py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            {whatsappTitulo}
          </h2>
          <p className="text-white/60 mb-10 text-base leading-relaxed">{whatsappSubtitulo}</p>
          <a
            href={`https://wa.me/${whatsappNumero}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#25D366]/30 hover:-translate-y-0.5 text-base"
            aria-label="Falar no WhatsApp"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
            </svg>
            Falar no WhatsApp
          </a>
        </div>
      </section>
    ),
  }

  return (
    <main className="bg-white">
      {ordemSecoes.map((id) => SECOES[id] ?? null)}
      <PagamentosBar />
    </main>
  )
}
