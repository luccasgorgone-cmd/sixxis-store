import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Phone, Mail, Target, Eye, Heart, Users, ShieldCheck, Truck, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre a Sixxis — Quem Somos',
  description: 'Conheça a Sixxis — empresa fundada em Araçatuba, SP, especializada em climatizadores, aspiradores e equipamentos de spinning. Qualidade e garantia em cada produto.',
}

const stats = [
  { Icon: Users,       numero: '5.000+', label: 'Clientes Satisfeitos'   },
  { Icon: Award,       numero: '10+',    label: 'Anos de Mercado'         },
  { Icon: ShieldCheck, numero: '12 m',   label: 'Garantia nos Produtos'  },
  { Icon: Truck,       numero: '100%',   label: 'Entrega para o Brasil'   },
]

export default function SobrePage() {
  return (
    <main className="bg-white">

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 60%, #2a7a72 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: '#3cbfb3' }} />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-5" style={{ background: '#3cbfb3' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#3cbfb3]/20 text-[#3cbfb3] text-xs font-bold px-4 py-2 rounded-full border border-[#3cbfb3]/30 mb-5 uppercase tracking-widest">
            Quem Somos
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Conheça a Sixxis
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Fundada em Araçatuba, SP, a Sixxis nasceu com o propósito de levar qualidade, conforto e bem-estar para os lares e negócios de todo o Brasil.
          </p>
        </div>

        {/* Stats bar */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ Icon, numero, label }, i) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 text-center"
                style={{
                  animation: `fadeInUp 0.5s ease both`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#3cbfb3]/20 flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-[#3cbfb3]" />
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-white leading-none mb-1">{numero}</p>
                <p className="text-xs text-white/60 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* ── Nossa História ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="section-title mb-6">Nossa História</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                A Sixxis foi fundada em Araçatuba, no interior de São Paulo, com a missão de oferecer produtos de alta qualidade no segmento de climatização, limpeza e bem-estar. Começamos como uma pequena importadora e hoje atendemos clientes em todo o Brasil.
              </p>
              <p>
                Ao longo de mais de 10 anos de história, construímos uma reputação sólida baseada em qualidade, atendimento humanizado e compromisso com a satisfação do cliente. Cada produto Sixxis passa por rigorosos testes antes de chegar até você.
              </p>
              <p>
                Hoje, com um portfólio diversificado que inclui climatizadores, aspiradores e equipamentos de spinning, somos referência no mercado e continuamos crescendo junto com nossos clientes.
              </p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#3cbfb3]/20 shadow-lg" style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}>
            <div className="p-8 space-y-6">
              {[
                { num: '10+',    label: 'Anos de mercado',                   color: '#3cbfb3' },
                { num: '5.000+', label: 'Clientes satisfeitos',              color: '#3cbfb3' },
                { num: '100%',   label: 'Garantia nos produtos',             color: '#3cbfb3' },
                { num: 'SP',     label: 'Araçatuba — Coração da operação',   color: '#3cbfb3' },
              ].map(({ num, label, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-3xl font-extrabold w-20 shrink-0" style={{ color }}>{num}</span>
                  <div className="flex-1 border-l border-white/10 pl-4">
                    <span className="text-white/80 font-medium text-sm">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Missão, Visão e Valores ── */}
      <section className="bg-[#f9fafb] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="section-title mb-10 text-center">Missão, Visão e Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon:  Target,
                title: 'Missão',
                text:  'Proporcionar qualidade de vida e bem-estar às pessoas por meio de produtos inovadores, confiáveis e acessíveis, com excelência no atendimento e na entrega.',
              },
              {
                icon:  Eye,
                title: 'Visão',
                text:  'Ser a empresa mais reconhecida no Brasil no segmento de climatização, limpeza e equipamentos fitness, expandindo nossa atuação e impactando positivamente a vida de milhares de famílias.',
              },
              {
                icon:  Heart,
                title: 'Valores',
                text:  'Qualidade, integridade, inovação, foco no cliente, responsabilidade e comprometimento com a entrega de experiências excepcionais em cada produto e atendimento.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-[#3cbfb3]/30 hover:shadow-md transition-all"
                style={{ borderTop: '4px solid #3cbfb3' }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#e8f8f7] flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[#3cbfb3]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a0a0a] mb-3">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Localização & Contato ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="section-title mb-10">Localização e Contato</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: MapPin, title: 'Endereço',             info: 'R. Anhanguera, 1711 - Araçatuba, SP'   },
            { icon: Phone,  title: 'Telefone / WhatsApp',  info: '(18) 99747-4701',                       href: 'https://wa.me/5518997474701' },
            { icon: Mail,   title: 'E-mail',               info: 'brasil.sixxis@gmail.com',               href: 'mailto:brasil.sixxis@gmail.com' },
          ].map(({ icon: Icon, title, info, href }) => (
            <div key={title} className="bg-[#f8f9fa] rounded-xl p-6 flex items-start gap-4 hover:bg-[#e8f8f7] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[#3cbfb3]" />
              </div>
              <div>
                <p className="font-semibold text-[#0a0a0a] text-sm mb-1">{title}</p>
                {href ? (
                  <a href={href} className="text-sm text-gray-600 hover:text-[#3cbfb3] transition">{info}</a>
                ) : (
                  <p className="text-sm text-gray-600">{info}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/contato" className="inline-flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-8 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg">
            Fale Conosco
          </Link>
        </div>
      </section>
    </main>
  )
}
