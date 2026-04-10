import type { Metadata } from 'next'
import { DollarSign, Headphones, Truck, BadgeCheck, Store } from 'lucide-react'
import FormRevendedor from './FormRevendedor'

export const metadata: Metadata = {
  title: 'Seja um Revendedor Sixxis — Programa de Parceiros',
  description:
    'Junte-se à rede de revendedores Sixxis. Acesso a preços exclusivos, suporte dedicado e condições especiais para seu negócio.',
}

const beneficios = [
  {
    Icon: DollarSign,
    titulo: 'Preços Exclusivos',
    texto: 'Tabela diferenciada para revendedores com margens atrativas para você e seus clientes.',
  },
  {
    Icon: Headphones,
    titulo: 'Suporte Dedicado',
    texto: 'Canal de atendimento exclusivo para parceiros com gerente de conta e suporte técnico prioritário.',
  },
  {
    Icon: Truck,
    titulo: 'Entrega Prioritária',
    texto: 'Logística otimizada com prazos reduzidos e condições especiais para pedidos recorrentes.',
  },
  {
    Icon: BadgeCheck,
    titulo: 'Material de Apoio',
    texto: 'Catálogos, fotos profissionais e materiais de marketing para alavancar suas vendas.',
  },
]

export default function SejaRevendedorPage() {
  return (
    <main className="bg-white">

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 60%, #2a7a72 100%)' }}
      >
        {/* Decoração */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: '#3cbfb3' }} />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full opacity-5" style={{ background: '#3cbfb3' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#3cbfb3]/20 border border-[#3cbfb3]/30 text-[#3cbfb3] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
            <Store size={13} />
            Programa de Parceiros
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Seja um Revendedor Sixxis
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Junte-se à nossa rede de parceiros e tenha acesso a condições exclusivas para revender
            os melhores climatizadores, aspiradores e equipamentos fitness do Brasil.
          </p>
        </div>

        {/* Benefícios no hero */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {beneficios.map(({ Icon, titulo, texto }) => (
              <div
                key={titulo}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 text-center hover:bg-white/15 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#3cbfb3]/20 flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-[#3cbfb3]" />
                </div>
                <p className="text-sm font-bold text-white mb-1">{titulo}</p>
                <p className="text-xs text-white/60 leading-snug hidden sm:block">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulário ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Cabeçalho da seção */}
        <div className="text-center mb-10">
          <span className="inline-block w-12 h-1 bg-[#3cbfb3] rounded-full mb-4" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
            Formulário de Cadastro
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Preencha o formulário abaixo com suas informações. Nossa equipe comercial
            analisará o cadastro e entrará em contato em até <strong>3 dias úteis</strong>.
          </p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8">
          <FormRevendedor />
        </div>

        {/* Info extra */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <BadgeCheck size={16} className="text-[#3cbfb3]" />
            <span>Aprovação em até 3 dias úteis</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones size={16} className="text-[#3cbfb3]" />
            <span>Suporte: (18) 99747-4701</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-[#3cbfb3]" />
            <span>Sem taxa de adesão</span>
          </div>
        </div>
      </section>
    </main>
  )
}
