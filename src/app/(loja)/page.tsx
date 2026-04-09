import type { Metadata } from 'next'
import Link from 'next/link'
import { Wind, Fan, Bike, Wrench, ArrowRight, Cpu, Headphones, BadgeCheck } from 'lucide-react'
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

export default async function HomePage() {
  const [banners, destaques, produtosGerais, configRows] = await Promise.all([
    prisma.banner.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
    prisma.produtoDestaque.findMany({
      where:   { secao: 'mais-vendidos' },
      include: { produto: true },
      orderBy: { ordem: 'asc' },
    }),
    prisma.produto.findMany({
      where:   { ativo: true },
      take:    8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.configuracao.findMany(),
  ])

  const cfg = Object.fromEntries(configRows.map((c) => [c.chave, c.valor]))
  const produtosMostrar = destaques.length > 0 ? destaques.map((d) => d.produto) : produtosGerais

  console.log('[HOME]', {
    banners:  banners.length,
    produtos: produtosMostrar.length,
    configs:  configRows.length,
    logoUrl:  cfg.logo_url,
  })

  return (
    <main className="bg-white">

      {/* ── HERO / BANNER ────────────────────────────────────────────────── */}
      {banners.length > 0 ? (
        <BannerCarousel banners={banners} />
      ) : (
        <section
          className="relative py-24 md:py-32"
          style={
            cfg.hero_imagem_url
              ? { backgroundImage: `url(${cfg.hero_imagem_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }
          }
        >
          {cfg.hero_imagem_url && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-8">
              🏆 Loja Oficial Sixxis — Araçatuba, SP
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              {cfg.hero_titulo || 'Alta Performance para o seu Conforto e Bem-Estar'}
            </h1>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              {cfg.hero_subtitulo || 'Climatizadores, aspiradores e equipamentos fitness com qualidade Sixxis e garantia total.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={cfg.hero_cta_link || '/produtos'} className="btn-primary text-base">
                {cfg.hero_cta_texto || 'Explorar Produtos'} →
              </Link>
              <Link href="/pecas" className="btn-outline-white text-base">Peças de Reposição</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="bg-[#3cbfb3] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { num: '10+',    label: 'Anos de Mercado'    },
              { num: '5.000+', label: 'Clientes Atendidos' },
              { num: '15+',    label: 'Produtos'           },
              { num: '100%',   label: 'Garantia'           },
            ].map(({ num, label }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center text-center py-6 px-4 ${i < 3 ? 'md:border-r border-white/20' : ''} ${i === 0 || i === 2 ? 'border-b md:border-b-0 border-white/20' : ''}`}
              >
                <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{num}</p>
                <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIAS ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="section-title mb-10">Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Climatizadores', desc: 'Conforto térmico para sua casa',  href: '/produtos?categoria=climatizadores', Icon: Wind   },
            { label: 'Aspiradores',    desc: 'Limpeza eficiente e prática',      href: '/produtos?categoria=aspiradores',    Icon: Fan    },
            { label: 'Spinning',       desc: 'Desempenho fitness profissional',  href: '/produtos?categoria=spinning',       Icon: Bike   },
            { label: 'Peças',          desc: 'Reposição original garantida',     href: '/pecas',                            Icon: Wrench },
          ].map(({ label, desc, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="group bg-white border border-gray-200 hover:border-[#3cbfb3] rounded-xl p-6 text-center flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
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

      {/* ── PRODUTOS EM DESTAQUE ─────────────────────────────────────────── */}
      {produtosMostrar.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-title">Produtos em Destaque</h2>
            <Link href="/produtos" className="flex items-center gap-1.5 text-sm font-medium text-[#3cbfb3] hover:text-[#2a9d8f] transition">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {produtosMostrar.map((produto) => (
              <CardProduto key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {/* ── BANNERS DUPLOS ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/produtos?categoria=climatizadores"
            className="group relative overflow-hidden rounded-2xl h-[180px] flex flex-col justify-end p-6 transition-transform duration-300 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #0d4a47 0%, #1a7a74 50%, #3cbfb3 100%)' }}
          >
            <p className="text-[#a8ede9] text-xs font-semibold uppercase tracking-widest mb-1">Linha Residencial e Comercial</p>
            <h3 className="text-white text-xl font-extrabold leading-tight mb-3">Climatizadores<br />Sixxis</h3>
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Ver modelos <ArrowRight size={12} />
            </span>
          </Link>
          <Link
            href="/produtos?categoria=spinning"
            className="group relative overflow-hidden rounded-2xl h-[180px] flex flex-col justify-end p-6 transition-transform duration-300 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 60%, #2a2a2a 100%)' }}
          >
            <p className="text-[#3cbfb3] text-xs font-semibold uppercase tracking-widest mb-1">Spinning & Acessórios</p>
            <h3 className="text-white text-xl font-extrabold leading-tight mb-3">Equipamentos<br />Fitness</h3>
            <span className="inline-flex items-center gap-1.5 bg-[#3cbfb3]/20 text-[#3cbfb3] text-xs font-bold px-3 py-1.5 rounded-full border border-[#3cbfb3]/40">
              Ver produtos <ArrowRight size={12} />
            </span>
          </Link>
        </div>
      </section>

      {/* ── POR QUE SIXXIS? ──────────────────────────────────────────────── */}
      <section className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title mb-10">Por que Sixxis?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { titulo: cfg.pq_sixxis_1_titulo || 'Tecnologia de Ponta',      texto: cfg.pq_sixxis_1_texto || 'Produtos desenvolvidos com engenharia avançada para máxima eficiência e durabilidade.', Icon: Cpu       },
              { titulo: cfg.pq_sixxis_2_titulo || 'Suporte Especializado',    texto: cfg.pq_sixxis_2_texto || 'Equipe técnica treinada para te ajudar antes, durante e após a compra.',              Icon: Headphones },
              { titulo: cfg.pq_sixxis_3_titulo || 'Melhor Custo-Benefício',   texto: cfg.pq_sixxis_3_texto || 'Qualidade premium com preço justo. Garantia Sixxis em todos os produtos.',            Icon: BadgeCheck },
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

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      {cfg.newsletter_ativo !== 'false' && (
        <section className="bg-[#f8f9fa] border-t border-b border-gray-200 py-12">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-extrabold text-[#0a0a0a] mb-1">
              {cfg.newsletter_titulo || 'Receba novidades e promoções exclusivas'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {cfg.newsletter_subtitulo || 'Sem spam. Cancele quando quiser.'}
            </p>
            <NewsletterForm />
          </div>
        </section>
      )}

      {/* ── BANNER WHATSAPP ──────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            {cfg.whatsapp_banner_titulo || 'Precisa de ajuda para escolher?'}
          </h2>
          <p className="text-white/60 mb-10 text-base leading-relaxed">
            {cfg.whatsapp_banner_subtitulo || 'Nossa equipe especializada está pronta para te orientar e encontrar o produto ideal para suas necessidades.'}
          </p>
          <a
            href={`https://wa.me/${cfg.social_whatsapp || '5518997474701'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-base"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
            </svg>
            Falar no WhatsApp
          </a>
        </div>
      </section>

      <PagamentosBar />
    </main>
  )
}
