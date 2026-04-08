import Link from 'next/link'
import { Wind, Fan, Bike, Wrench, ArrowRight, Cpu, Headphones, BadgeCheck } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import { prisma } from '@/lib/prisma'

const categorias = [
  {
    label:    'Climatizadores',
    desc:     'Conforto térmico para sua casa',
    href:     '/produtos?categoria=climatizadores',
    icon:     Wind,
  },
  {
    label:    'Aspiradores',
    desc:     'Limpeza eficiente e prática',
    href:     '/produtos?categoria=aspiradores',
    icon:     Fan,
  },
  {
    label:    'Spinning',
    desc:     'Desempenho fitness profissional',
    href:     '/produtos?categoria=spinning',
    icon:     Bike,
  },
  {
    label:    'Peças',
    desc:     'Reposição original garantida',
    href:     '/pecas',
    icon:     Wrench,
  },
]

const porqueSixxis = [
  {
    icon:  Cpu,
    title: 'Tecnologia de Ponta',
    text:  'Produtos desenvolvidos com engenharia avançada para máxima eficiência e durabilidade, superando padrões do mercado.',
  },
  {
    icon:  Headphones,
    title: 'Suporte Especializado',
    text:  'Equipe técnica treinada para te ajudar antes, durante e após a compra. Suporte via WhatsApp, e-mail e telefone.',
  },
  {
    icon:  BadgeCheck,
    title: 'Melhor Custo-Benefício',
    text:  'Qualidade premium com preço justo. Garantia Sixxis em todos os produtos, com assistência técnica autorizada.',
  },
]

export default async function HomePage() {
  const destaques = await prisma.produto.findMany({
    where:   { ativo: true },
    orderBy: { createdAt: 'desc' },
    take:    8,
  })

  return (
    <main className="bg-white">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        {/* Decoração de fundo */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: '#3cbfb3', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: '#3cbfb3', filter: 'blur(60px)', transform: 'translate(-30%, 30%)' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-8">
            <span>🏆</span>
            Loja Oficial Sixxis — Araçatuba, SP
          </div>

          {/* Título */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Alta Performance para o<br className="hidden sm:block" /> seu Conforto e Bem-Estar
          </h1>

          {/* Subtítulo */}
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Climatizadores, aspiradores e equipamentos fitness com qualidade Sixxis e garantia total — entrega para todo o Brasil.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/produtos" className="btn-primary text-base">
              Explorar Produtos <ArrowRight size={18} />
            </Link>
            <Link href="/pecas" className="btn-outline-white text-base">
              Peças de Reposição
            </Link>
          </div>

          {/* Credenciais */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/60">
            {['Garantia Sixxis', 'Frete Grátis acima R$500', 'Pagamento Seguro', 'Suporte Técnico'].map(c => (
              <span key={c} className="flex items-center gap-1.5">
                <span className="text-[#3cbfb3] font-bold">✓</span> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#3cbfb3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '10+',    label: 'Anos de Mercado' },
              { num: '5.000+', label: 'Clientes Atendidos' },
              { num: '15+',    label: 'Produtos' },
              { num: '100%',   label: 'Garantia' },
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

      {/* ── Produtos em Destaque ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">Produtos em Destaque</h2>
          <Link
            href="/produtos"
            className="flex items-center gap-1.5 text-sm font-medium text-[#3cbfb3] hover:text-[#2a9d8f] transition"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {destaques.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-4">
              <Bike size={28} className="text-[#3cbfb3]" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum produto cadastrado ainda.</p>
            <p className="text-sm text-gray-400 mt-1">
              Os produtos serão exibidos aqui após a sincronização com o ERP.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {destaques.map((produto) => (
              <CardProduto key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>

      {/* ── Por que Sixxis? ──────────────────────────────────────────────────── */}
      <section className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title mb-10">Por que Sixxis?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {porqueSixxis.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-xl p-6 border-t-4 border-t-[#3cbfb3]">
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

      {/* ── Banner WhatsApp ──────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Precisa de ajuda para escolher?
          </h2>
          <p className="text-white/60 mb-8">
            Nossa equipe especializada está pronta para te orientar e encontrar o produto ideal para suas necessidades.
          </p>
          <a
            href="https://wa.me/5518999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base"
          >
            Falar no WhatsApp →
          </a>
        </div>
      </section>

      {/* ── Formas de Pagamento ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-200 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-500 font-medium mb-5">Pagamento 100% seguro:</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-gray-700">
            {['PIX', 'Visa', 'Mastercard', 'Boleto', 'Parcelamos em até 12x'].map((m) => (
              <span
                key={m}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:border-[#3cbfb3] transition"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
