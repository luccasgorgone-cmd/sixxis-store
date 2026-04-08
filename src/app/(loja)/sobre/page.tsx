import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Phone, Mail, Target, Eye, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Quem Somos',
  description: 'Conheça a Sixxis — empresa fundada em Araçatuba, SP, especializada em climatizadores, aspiradores, spinning e peças de reposição.',
}

export default function SobrePage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#3cbfb3] text-sm font-semibold uppercase tracking-widest mb-4">Quem somos</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Conheça a Sixxis
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Fundada em Araçatuba, SP, a Sixxis nasceu com o propósito de levar qualidade, conforto e bem-estar para os lares e negócios de todo o Brasil.
          </p>
        </div>
      </section>

      {/* Nossa História */}
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
                Hoje, com um portfólio diversificado que inclui climatizadores, aspiradores, equipamentos de spinning e peças de reposição originais, somos referência no mercado e continuamos crescendo junto com nossos clientes.
              </p>
            </div>
          </div>

          <div className="bg-[#f8f9fa] rounded-2xl p-8 flex flex-col gap-5">
            {[
              { num: '10+',    label: 'Anos de mercado' },
              { num: '5.000+', label: 'Clientes satisfeitos' },
              { num: '100%',   label: 'Garantia nos produtos' },
              { num: 'SP',     label: 'Araçatuba — Coração da operação' },
            ].map(({ num, label }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-3xl font-extrabold text-[#3cbfb3] w-20 shrink-0">{num}</span>
                <span className="text-gray-700 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="bg-[#f8f9fa] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="section-title mb-10">Missão, Visão e Valores</h2>
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
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
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

      {/* Localização & Contato */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="section-title mb-10">Localização e Contato</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: MapPin, title: 'Endereço',             info: 'Araçatuba, São Paulo — Brasil' },
            { icon: Phone,  title: 'Telefone / WhatsApp',  info: '(18) 99999-9999',           href: 'https://wa.me/5518999999999' },
            { icon: Mail,   title: 'E-mail',               info: 'brasil.sixxis@gmail.com',   href: 'mailto:brasil.sixxis@gmail.com' },
          ].map(({ icon: Icon, title, info, href }) => (
            <div key={title} className="bg-[#f8f9fa] rounded-xl p-6 flex items-start gap-4">
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
          <Link href="/contato" className="btn-primary inline-flex">
            Fale Conosco
          </Link>
        </div>
      </section>
    </main>
  )
}
