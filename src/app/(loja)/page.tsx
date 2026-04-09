import type { Metadata } from 'next'
import Link from 'next/link'
import { Wind, Fan, Bike, Wrench, ArrowRight, Cpu, Headphones, BadgeCheck } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import { prisma } from '@/lib/prisma'
import PagamentosBar from '@/components/layout/PagamentosBar'
import NewsletterForm from '@/components/layout/NewsletterForm'
// import BannerCarousel from '@/components/layout/BannerCarousel' // diagnóstico ativo

export const dynamic    = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Sixxis Store — Climatizadores, Aspiradores e Spinning',
  description: 'Loja oficial Sixxis em Araçatuba-SP. Climatizadores, aspiradores, bikes spinning e peças originais. Garantia Sixxis, frete para todo o Brasil.',
}

export default async function HomePage() {
  console.log('[HOME] iniciando render...')

  try {
    // ── Queries individuais para isolar qual falha em produção ────────────
    console.log('[HOME] query 1: banners...')
    const banners = await prisma.banner.findMany({
      where:   { ativo: true },
      orderBy: { ordem: 'asc' },
    })
    console.log('[HOME] query 1 ok — banners:', banners.length)

    console.log('[HOME] query 2: destaques...')
    const destaques = await prisma.produtoDestaque.findMany({
      where:   { secao: 'mais-vendidos' },
      include: { produto: true },
      orderBy: { ordem: 'asc' },
    })
    console.log('[HOME] query 2 ok — destaques:', destaques.length)

    console.log('[HOME] query 3: produtos...')
    const produtosGerais = await prisma.produto.findMany({
      where:   { ativo: true },
      take:    8,
      orderBy: { createdAt: 'desc' },
    })
    console.log('[HOME] query 3 ok — produtos:', produtosGerais.length)

    console.log('[HOME] query 4: configuracoes...')
    const configRows = await prisma.configuracao.findMany()
    console.log('[HOME] query 4 ok — configs:', configRows.length)

    const cfg = Object.fromEntries(configRows.map((c) => [c.chave, c.valor]))
    const produtosMostrar = destaques.length > 0 ? destaques.map((d) => d.produto) : produtosGerais

    console.log('[HOME OK]', {
      banners:  banners.length,
      produtos: produtosMostrar.length,
      configs:  configRows.length,
    })

    return (
      <main className="bg-white">

        {/* DIAGNÓSTICO — remover após confirmar que renderiza */}
        <div className="bg-green-500 text-white text-center py-2 text-xs font-mono">
          HOME OK — banners:{banners.length} produtos:{produtosMostrar.length} configs:{configRows.length}
        </div>

        {/* ── HERO / BANNER ──────────────────────────────────────────────── */}
        {banners.length > 0 ? (
          <div className="bg-[#3cbfb3] py-20 text-center">
            <p className="text-white/70 text-sm uppercase tracking-widest mb-2">Banner ativo</p>
            <h2 className="text-white text-4xl font-bold">{banners[0].titulo || 'Sixxis Store'}</h2>
          </div>
        ) : (
          <section
            className="relative py-24 md:py-32"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
          >
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

        {/* ── STATS ──────────────────────────────────────────────────────── */}
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

        {/* ── CATEGORIAS ─────────────────────────────────────────────────── */}
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

        {/* ── PRODUTOS ───────────────────────────────────────────────────── */}
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

        {/* ── BANNERS DUPLOS ─────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/produtos?categoria=climatizadores"
              className="relative overflow-hidden rounded-2xl h-[180px] flex flex-col justify-end p-6 hover:scale-[1.02] transition-transform duration-300"
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
              className="relative overflow-hidden rounded-2xl h-[180px] flex flex-col justify-end p-6 hover:scale-[1.02] transition-transform duration-300"
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

        {/* ── POR QUE SIXXIS? ────────────────────────────────────────────── */}
        <section className="bg-[#f8f9fa] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="section-title mb-10">Por que Sixxis?</h2>
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

        {/* ── NEWSLETTER ─────────────────────────────────────────────────── */}
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

        {/* ── BANNER WHATSAPP ────────────────────────────────────────────── */}
        <section className="bg-[#0a0a0a] py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
              {cfg.whatsapp_banner_titulo || 'Precisa de ajuda para escolher?'}
            </h2>
            <p className="text-white/60 mb-10 text-base leading-relaxed">
              {cfg.whatsapp_banner_subtitulo || 'Nossa equipe especializada está pronta para te orientar.'}
            </p>
            <a
              href={`https://wa.me/${cfg.social_whatsapp || '5518997474701'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white font-bold px-8 py-4 rounded-xl transition-all"
            >
              Falar no WhatsApp
            </a>
          </div>
        </section>

        <PagamentosBar />
      </main>
    )
  } catch (error) {
    console.error('[HOME ERROR]', error)
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar a página</h1>
            <pre className="text-left text-xs text-red-700 bg-red-100 rounded-xl p-4 overflow-auto whitespace-pre-wrap">
              {String(error)}
            </pre>
            <p className="text-sm text-gray-500 mt-4">Verifique os logs do servidor para mais detalhes.</p>
          </div>
        </div>
      </main>
    )
  }
}
