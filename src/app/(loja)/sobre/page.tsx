'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  Shield, Truck, Award, Users, MapPin, Phone,
  Mail, Heart, Zap, Star, ArrowRight,
  Wind, Bike, Target, Eye, Handshake, TrendingUp, Calendar
} from 'lucide-react'

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(22px)',
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

const TIMELINE = [
  { ano: '1993', titulo: 'O começo de tudo', texto: 'A Sixxis nasce em Araçatuba, SP, como uma pequena importadora com um grande sonho: levar produtos de qualidade e bem-estar para as famílias brasileiras.', cor: '#3cbfb3', icon: Heart },
  { ano: '1998', titulo: 'Primeira linha de climatizadores', texto: 'Após 5 anos consolidando o negócio, lançamos nossa primeira linha de climatizadores residenciais. A aceitação do mercado superou todas as expectativas.', cor: '#0f2e2b', icon: Wind },
  { ano: '2004', titulo: 'Expansão pelo interior', texto: 'Estruturamos nossa rede de revendedores no interior de SP, chegando a mais de 50 cidades parceiras e consolidando a presença regional da marca.', cor: '#8b5cf6', icon: MapPin },
  { ano: '2010', titulo: 'Linha comercial', texto: 'Lançamento da linha comercial de alta capacidade para empresas, clínicas e estabelecimentos comerciais. A Sixxis chega ao segmento B2B.', cor: '#f59e0b', icon: TrendingUp },
  { ano: '2015', titulo: '200 parceiros no Brasil', texto: 'Marco histórico: 200 revendedores parceiros em todas as regiões do Brasil. A Sixxis torna-se referência nacional no segmento de climatização.', cor: '#16a34a', icon: Users },
  { ano: '2018', titulo: 'Linha fitness e aspiradores', texto: 'Diversificamos o portfólio com bikes spinning profissionais e aspiradores de alta potência, atendendo o mercado fitness e de limpeza doméstica.', cor: '#2563eb', icon: Bike },
  { ano: '2022', titulo: 'Loja digital própria', texto: 'Inauguramos nossa plataforma de e-commerce, aproximando a Sixxis dos clientes finais com experiência de compra simplificada e atendimento direto.', cor: '#3cbfb3', icon: Star },
  { ano: '2024', titulo: '1 Milhão de clientes', texto: 'Ultrapassamos a marca histórica de 1 MILHÃO de clientes atendidos. 30 anos de dedicação, qualidade e compromisso com o bem-estar das famílias brasileiras.', cor: '#ef4444', icon: Award },
]

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Sobre Nós' }]} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden py-20 sm:py-28"
        style={{ background: 'linear-gradient(135deg, #0a1f1d 0%, #0f2e2b 50%, #1a4f4a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(#3cbfb3 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)', transform: 'translate(30%, -30%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 mb-6 rounded-full px-4 py-2 border"
                style={{ backgroundColor: 'rgba(60,191,179,0.1)', borderColor: 'rgba(60,191,179,0.25)' }}>
                <Calendar size={12} className="text-[#3cbfb3]" />
                <span className="text-[#3cbfb3] text-xs font-bold uppercase tracking-widest">
                  Fundada em 1993 — Araçatuba, SP
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
                30 anos levando<br />
                <span style={{ color: '#3cbfb3' }}>qualidade e conforto</span><br />
                para o Brasil
              </h1>
              <p className="text-white/65 text-lg leading-relaxed mb-8 max-w-xl">
                De uma pequena importadora no interior de São Paulo a mais de 1 milhão de
                clientes satisfeitos. Esta é a história da Sixxis.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/produtos"
                  className="inline-flex items-center gap-2 font-extrabold text-[#0f2e2b] px-6 py-3.5 rounded-2xl transition hover:-translate-y-0.5 text-sm"
                  style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 20px rgba(60,191,179,0.4)' }}>
                  Ver nossos produtos <ArrowRight size={15} />
                </Link>
                <Link href="/contato"
                  className="inline-flex items-center gap-2 font-semibold text-white px-6 py-3.5 rounded-2xl border border-white/20 hover:border-white/40 transition text-sm">
                  Fale conosco
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── NÚMEROS ─── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { val: '30+',  label: 'Anos de mercado',        cor: '#3cbfb3' },
              { val: '1M+',  label: 'Clientes atendidos',     cor: '#0f2e2b' },
              { val: '200+', label: 'Revendedores parceiros', cor: '#8b5cf6' },
              { val: '12M',  label: 'Garantia',               cor: '#16a34a' },
              { val: '100%', label: 'Entrega nacional',       cor: '#2563eb' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 70}
                className="text-center p-4 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <p className="text-2xl sm:text-3xl font-black leading-none mb-1" style={{ color: s.cor }}>{s.val}</p>
                <p className="text-[10px] text-gray-500 font-medium leading-tight">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TIMELINE ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-14">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Nossa trajetória</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
              30 anos de história e crescimento
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
              Cada marco desta linha do tempo representa anos de trabalho, inovação
              e o compromisso de entregar o melhor para os nossos clientes.
            </p>
          </Reveal>

          {/* Timeline vertical */}
          <div className="relative max-w-4xl mx-auto">
            {/* Linha central */}
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px"
              style={{ backgroundImage: 'linear-gradient(to bottom, #3cbfb3, #0f2e2b)', transform: 'translateX(-50%)' }} />

            <div className="space-y-8">
              {TIMELINE.map((item, i) => {
                const Icon = item.icon
                const esq = i % 2 === 0
                return (
                  <Reveal key={item.ano} delay={i * 60}>
                    <div className={`flex gap-4 sm:gap-8 ${esq ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                      {/* Card */}
                      <div className="flex-1">
                        <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${esq ? 'sm:text-right' : 'sm:text-left'}`}>
                          <div className={`flex items-center gap-3 mb-2 ${esq ? 'sm:flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: item.cor + '15' }}>
                              <Icon size={16} style={{ color: item.cor }} />
                            </div>
                            <span className="text-xl font-black" style={{ color: item.cor }}>{item.ano}</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-gray-900 mb-1.5">{item.titulo}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed">{item.texto}</p>
                        </div>
                      </div>
                      {/* Ponto central */}
                      <div className="hidden sm:flex w-10 h-10 rounded-full border-4 border-white shadow-lg items-center justify-center shrink-0 z-10 self-start mt-4"
                        style={{ backgroundColor: item.cor }}>
                        <Icon size={16} className="text-white" />
                      </div>
                      {/* Espaço */}
                      <div className="flex-1 hidden sm:block" />
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MISSÃO VISÃO VALORES ─── */}
      <section className="py-20 bg-gray-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-12">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Propósito</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">O que nos move todos os dias</h2>
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Target, titulo: 'Missão', cor: '#3cbfb3',
                texto: 'Proporcionar qualidade de vida e bem-estar às pessoas por meio de produtos inovadores, confiáveis e acessíveis, com excelência no atendimento e na entrega.',
              },
              {
                icon: Eye, titulo: 'Visão', cor: '#0f2e2b',
                texto: 'Ser a empresa mais reconhecida no Brasil no segmento de climatização, limpeza e fitness, impactando positivamente a vida de milhões de famílias brasileiras.',
              },
              {
                icon: Handshake, titulo: 'Valores', cor: '#8b5cf6',
                texto: 'Qualidade sem compromisso. Integridade em cada relação. Inovação constante. Foco total no cliente. Responsabilidade social. Excelência em cada detalhe.',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <Reveal key={item.titulo} delay={i * 100}
                  className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: item.cor + '15' }}>
                    <Icon size={22} style={{ color: item.cor }} />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-3">{item.titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.texto}</p>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── DIFERENCIAIS ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-12">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Por que Sixxis</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">O que nos diferencia no mercado</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Shield,  titulo: 'Garantia Real de 12 Meses',    texto: 'Suporte técnico especializado em todo o Brasil. Sem burocracia.',                             cor: '#16a34a' },
              { icon: Award,   titulo: '100% Produtos Originais',       texto: 'Importadores diretos. Todos os produtos com nota fiscal e certificação.',                    cor: '#3cbfb3' },
              { icon: Truck,   titulo: 'Entrega para Todo o Brasil',    texto: 'Correios e transportadoras parceiras. Rastreamento em tempo real.',                         cor: '#2563eb' },
              { icon: Users,   titulo: 'Atendimento Humanizado',        texto: 'Equipe real via WhatsApp. Sem chatbots impessoais.',                                        cor: '#f59e0b' },
              { icon: Zap,     titulo: 'Inovação Constante',            texto: 'Linha de produtos em constante evolução com as melhores tecnologias.',                     cor: '#8b5cf6' },
              { icon: Heart,   titulo: 'Empresa 100% Brasileira',       texto: 'Sediada em Araçatuba, SP. Gerando empregos e crescendo com o Brasil.',                     cor: '#ef4444' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <Reveal key={item.titulo} delay={i * 60}
                  className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: item.cor + '15' }}>
                    <Icon size={17} style={{ color: item.cor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 mb-1">{item.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.texto}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── DADOS DA EMPRESA + CONTATO ─── */}
      <section className="py-20"
        style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            <Reveal>
              <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Transparência</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 mb-6">
                Dados da empresa
              </h2>
              <div className="space-y-3">
                {[
                  { l: 'Razão Social', v: 'SIXXIS IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA' },
                  { l: 'CNPJ', v: '54.978.947/0001-09' },
                  { l: 'Inscrição Estadual', v: '117.633.347.114' },
                  { l: 'Endereço', v: 'R. Anhanguera, 1711 - Icaray, Araçatuba - SP, 16020-355' },
                  { l: 'Fundação', v: '1993 — Araçatuba, SP' },
                  { l: 'Setor', v: 'Importação, Comércio e Distribuição' },
                ].map(item => (
                  <div key={item.l} className="flex gap-4 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-wide shrink-0 pt-0.5"
                      style={{ width: '130px' }}>{item.l}</span>
                    <span className="text-sm text-white/80 font-medium leading-relaxed flex-1">{item.v}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="bg-white/8 border border-white/10 rounded-3xl p-7 backdrop-blur-sm">
                <h3 className="text-xl font-extrabold text-white mb-2">Vamos conversar?</h3>
                <p className="text-white/55 text-sm mb-6 leading-relaxed">
                  Estamos prontos para ajudar com dúvidas, suporte técnico,
                  parcerias ou simplesmente escolher o produto certo para você.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    { icon: Phone, label: 'Vendas',              val: '(18) 99747-4701',      href: 'https://wa.me/5518997474701',   cor: '#25D366' },
                    { icon: Phone, label: 'Assistência Técnica', val: '(11) 93410-2621',      href: 'https://wa.me/5511934102621',   cor: '#3cbfb3' },
                    { icon: Mail,  label: 'E-mail',              val: 'brasil.sixxis@gmail.com', href: 'mailto:brasil.sixxis@gmail.com', cor: '#8b5cf6' },
                  ].map(c => {
                    const Icon = c.icon
                    return (
                      <a key={c.label} href={c.href}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 transition group border"
                        style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: c.cor + '20' }}>
                          <Icon size={15} style={{ color: c.cor }} />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/45 font-medium">{c.label}</p>
                          <p className="text-sm font-bold text-white">{c.val}</p>
                        </div>
                        <ArrowRight size={13} className="text-white/25 ml-auto group-hover:translate-x-1 transition-transform" />
                      </a>
                    )
                  })}
                </div>
                <p className="text-white/35 text-[10px] text-center">
                  Seg–Sex: 8h às 18h · Sáb: 8h às 12h
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── MAPA ─── */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Nossa localização</h2>
            <p className="text-sm text-gray-500 mb-5">R. Anhanguera, 1711 — Icaray, Araçatuba - SP, 16020-355</p>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              <iframe
                src="https://maps.google.com/maps?q=R.+Anhanguera+1711+Ara%C3%A7atuba+SP&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                className="h-[220px] sm:h-[300px]"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Sixxis — R. Anhanguera, 1711, Araçatuba-SP"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-14" style={{ background: 'linear-gradient(135deg, #0a1f1d 0%, #0f2e2b 100%)' }}>
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">
            Faça parte da história Sixxis
          </h2>
          <p className="text-white/65 text-sm mb-6 max-w-lg mx-auto">
            Junte-se a mais de 1 milhão de clientes que confiam na qualidade Sixxis
            para o conforto e bem-estar do seu dia a dia.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/produtos"
              className="inline-flex items-center gap-2 bg-[#3cbfb3] text-white font-extrabold px-6 py-3.5 rounded-2xl hover:bg-[#2a9d8f] hover:-translate-y-0.5 transition text-sm"
              style={{ boxShadow: '0 4px 14px rgba(60,191,179,0.35)' }}>
              Ver catálogo <ArrowRight size={15} />
            </Link>
            <Link href="/seja-revendedor"
              className="inline-flex items-center gap-2 border border-white/25 text-white font-semibold px-6 py-3.5 rounded-2xl hover:border-white/50 hover:bg-white/10 transition text-sm">
              Seja um parceiro
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
