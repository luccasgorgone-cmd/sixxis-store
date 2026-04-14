'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Shield, Truck, Award, Users, MapPin, Phone, Mail,
  Heart, Zap, Star, ArrowRight, Wind,
  Bike, Sparkles, Target, Eye, Handshake, TrendingUp,
  ChevronRight,
} from 'lucide-react'

// ─── Hook de animação ao aparecer na tela ─────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

// ─── Counter animado ──────────────────────────────────────────
function CounterAnimate({
  target,
  suffix = '',
  duration = 2000,
  isMilhao = false,
}: {
  target: number
  suffix?: string
  duration?: number
  isMilhao?: boolean
}) {
  const [count, setCount] = useState(0)
  const { ref, visible } = useReveal(0.3)

  useEffect(() => {
    if (!visible) return
    if (isMilhao) { setCount(1); return }
    const step = Math.ceil(target / (duration / 16))
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setCount(current)
      if (current >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [visible, target, duration, isMilhao])

  if (isMilhao) {
    return <div ref={ref} className="tabular-nums">1 Milhão+</div>
  }

  return (
    <div ref={ref} className="tabular-nums">
      {count.toLocaleString('pt-BR')}{suffix}
    </div>
  )
}

// ─── Card animado ─────────────────────────────────────────────
function RevealCard({
  children,
  delay = 0,
  className = '',
  style,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════════════════════════════════════════════════
          BREADCRUMB
      ═══════════════════════════════════════════════════════ */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
            <li>
              <Link href="/" className="hover:text-gray-700 transition font-medium">Início</Link>
            </li>
            <li><ChevronRight size={13} className="text-gray-300" /></li>
            <li className="text-gray-900 font-semibold">Sobre Nós</li>
          </ol>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 1 — HERO
      ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 50%, #0f2e2b 100%)' }}
      >
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)', transform: 'translate(30%, -30%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)', transform: 'translate(-30%, 30%)' }}
          />
          <div
            className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(#3cbfb3 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#3cbfb3]/15 border border-[#3cbfb3]/30 rounded-full px-4 py-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3cbfb3] animate-pulse" />
              <span className="text-[#3cbfb3] text-xs font-bold tracking-widest uppercase">
                Fundada em Araçatuba, SP
              </span>
            </div>

            {/* Título */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Qualidade e Inovação<br />
              <span style={{ color: '#3cbfb3' }}>Para o Seu Conforto</span>
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl">
              A Sixxis nasceu com um propósito claro: levar produtos de alta qualidade
              que transformam o dia a dia de famílias e negócios em todo o Brasil.
              Da climatização ao fitness, somos parceiros do seu bem-estar.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 font-extrabold text-[#0f2e2b] px-6 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[0.98] text-sm"
                style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 20px rgba(60,191,179,0.4)' }}
              >
                Ver nossos produtos
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 font-semibold text-white px-6 py-3.5 rounded-2xl border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all text-sm"
              >
                Fale conosco
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 2 — NÚMEROS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { isMilhao: true,  target: 0,   sufixo: '',       label: 'Clientes Atendidos',            Icon: Users,      cor: '#3cbfb3' },
              { isMilhao: false, target: 10,  sufixo: '+',      label: 'Anos de Mercado',               Icon: TrendingUp, cor: '#0f2e2b' },
              { isMilhao: false, target: 12,  sufixo: ' meses', label: 'Garantia em todos os produtos', Icon: Shield,     cor: '#16a34a' },
              { isMilhao: false, target: 100, sufixo: '%',      label: 'Entrega para o Brasil',         Icon: Truck,      cor: '#8b5cf6' },
            ].map((stat, i) => (
              <RevealCard
                key={stat.label}
                delay={i * 100}
                className="flex flex-col items-center text-center p-6 rounded-3xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ background: 'linear-gradient(to bottom, rgba(249,250,251,0.5), #ffffff)' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: stat.cor + '15' }}
                >
                  <stat.Icon size={22} style={{ color: stat.cor }} />
                </div>
                <div className="text-3xl lg:text-4xl font-black mb-1" style={{ color: stat.cor }}>
                  <CounterAnimate
                    target={stat.target}
                    suffix={stat.sufixo}
                    isMilhao={stat.isMilhao}
                  />
                </div>
                <p className="text-sm text-gray-500 font-medium leading-tight">{stat.label}</p>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 3 — NOSSA HISTÓRIA (timeline)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <RevealCard className="text-center mb-14">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">
              Nossa trajetória
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-4">
              De Araçatuba para o Brasil inteiro
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              Uma história construída com dedicação, inovação e foco absoluto
              na satisfação de quem confia na Sixxis.
            </p>
          </RevealCard>

          {/* Timeline */}
          <div className="relative">
            {/* Linha central desktop */}
            <div
              className="hidden lg:block absolute top-0 bottom-0 w-0.5"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(to bottom, #3cbfb3, #0f2e2b)',
              }}
            />

            <div className="space-y-10">
              {[
                {
                  ano: '2014',
                  titulo: 'O início de tudo',
                  texto: 'A Sixxis foi fundada em Araçatuba, SP, como uma pequena importadora com grande sonho: levar produtos de qualidade a preços justos para famílias brasileiras.',
                  lado: 'esquerdo',
                  cor: '#3cbfb3',
                  Icon: Heart,
                },
                {
                  ano: '2017',
                  titulo: 'Expansão nacional',
                  texto: 'Com a linha de climatizadores já consolidada, a Sixxis expandiu o atendimento para todo o Brasil, estruturando uma logística ágil com Correios e transportadoras parceiras.',
                  lado: 'direito',
                  cor: '#0f2e2b',
                  Icon: Truck,
                },
                {
                  ano: '2019',
                  titulo: 'Novos segmentos',
                  texto: 'Lançamos a linha de aspiradores e equipamentos de spinning, ampliando o portfólio para o segmento fitness e de limpeza doméstica e comercial.',
                  lado: 'esquerdo',
                  cor: '#8b5cf6',
                  Icon: Bike,
                },
                {
                  ano: '2022',
                  titulo: 'Loja online própria',
                  texto: 'Inauguramos nossa plataforma de e-commerce própria, aproximando ainda mais a Sixxis dos clientes e facilitando a compra com mais segurança, praticidade e atendimento personalizado.',
                  lado: 'direito',
                  cor: '#f59e0b',
                  Icon: Star,
                },
                {
                  ano: '2024+',
                  titulo: '1 Milhão de clientes',
                  texto: 'Ultrapassamos a marca de 1 milhão de clientes atendidos, consolidando a Sixxis como referência nacional em climatizadores, aspiradores e equipamentos fitness.',
                  lado: 'esquerdo',
                  cor: '#3cbfb3',
                  Icon: Award,
                },
              ].map((item, i) => {
                const esquerdo = item.lado === 'esquerdo'
                return (
                  <RevealCard key={item.ano} delay={i * 80}>
                    <div className={`flex items-center gap-6 lg:gap-12 ${esquerdo ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                      {/* Conteúdo */}
                      <div className="flex-1">
                        <div
                          className={`bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${esquerdo ? 'lg:text-right' : 'lg:text-left'}`}
                        >
                          <div className={`flex items-center gap-3 mb-3 ${esquerdo ? 'lg:flex-row-reverse lg:justify-start' : ''}`}>
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: item.cor + '15' }}
                            >
                              <item.Icon size={17} style={{ color: item.cor }} />
                            </div>
                            <span className="text-2xl font-extrabold" style={{ color: item.cor }}>
                              {item.ano}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-gray-900 mb-2">{item.titulo}</h3>
                          <p className="text-sm text-gray-500 leading-relaxed">{item.texto}</p>
                        </div>
                      </div>

                      {/* Ponto central na timeline */}
                      <div
                        className="hidden lg:flex w-12 h-12 rounded-full border-4 border-white shadow-lg items-center justify-center shrink-0 z-10"
                        style={{ backgroundColor: item.cor }}
                      >
                        <item.Icon size={18} className="text-white" />
                      </div>

                      {/* Espaço oposto */}
                      <div className="flex-1 hidden lg:block" />
                    </div>
                  </RevealCard>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 4 — NOSSOS PRODUTOS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <RevealCard className="text-center mb-12">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">
              Portfólio
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-3">
              Produtos que transformam
            </h2>
            <p className="text-white/60 text-base max-w-xl mx-auto">
              Três linhas desenvolvidas para elevar seu conforto, saúde e bem-estar.
            </p>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                Icon: Wind,
                titulo: 'Climatizadores',
                texto: 'Tecnologia evaporativa que refresca, umidifica e purifica o ar. Consumo até 90% menor que ar condicionado. Ideais para ambientes de até 45m².',
                destaque: 'Mais de 1 milhão vendidos',
                href: '/produtos?categoria=climatizadores',
                cor: '#3cbfb3',
              },
              {
                Icon: Sparkles,
                titulo: 'Aspiradores',
                texto: 'Aspiradores sem fio de alta potência para limpeza profunda. Leves, silenciosos e eficientes para toda a casa.',
                destaque: 'Filtro HEPA de alta eficiência',
                href: '/produtos?categoria=aspiradores',
                cor: '#8b5cf6',
              },
              {
                Icon: Bike,
                titulo: 'Bikes Spinning',
                texto: 'Equipamentos fitness de alto desempenho para treinos profissionais em casa. Bivolt e à bateria.',
                destaque: 'Academia em casa',
                href: '/produtos?categoria=spinning',
                cor: '#f59e0b',
              },
            ].map((item, i) => (
              <RevealCard key={item.titulo} delay={i * 100}>
                <Link
                  href={item.href}
                  className="group flex flex-col h-full rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: item.cor + '25' }}
                  >
                    <item.Icon size={24} style={{ color: item.cor }} />
                  </div>
                  <h3 className="text-lg font-extrabold text-white mb-2">{item.titulo}</h3>
                  <p className="text-white/60 text-sm leading-relaxed flex-1 mb-4">{item.texto}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: item.cor + '20', color: item.cor }}
                    >
                      {item.destaque}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-white/30 group-hover:text-white/70 transition-all duration-300 group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 5 — MISSÃO, VISÃO E VALORES
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <RevealCard className="text-center mb-14">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">
              Propósito
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              O que nos move todos os dias
            </h2>
          </RevealCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                Icon: Target,
                titulo: 'Missão',
                texto: 'Proporcionar qualidade de vida e bem-estar às pessoas por meio de produtos inovadores, confiáveis e acessíveis, com excelência no atendimento e na entrega.',
                cor: '#3cbfb3',
                bgFrom: '#e8f8f7',
                borda: 'rgba(60,191,179,0.20)',
              },
              {
                Icon: Eye,
                titulo: 'Visão',
                texto: 'Ser a empresa mais reconhecida no Brasil no segmento de climatização, limpeza e fitness, expandindo nossa atuação e impactando positivamente a vida de milhões de famílias.',
                cor: '#0f2e2b',
                bgFrom: '#f9fafb',
                borda: '#e5e7eb',
              },
              {
                Icon: Handshake,
                titulo: 'Valores',
                texto: 'Qualidade sem compromisso. Integridade em cada relação. Inovação constante. Foco total no cliente. Responsabilidade social e ambiental. Excelência em cada detalhe.',
                cor: '#8b5cf6',
                bgFrom: '#faf5ff',
                borda: '#ede9fe',
              },
            ].map((item, i) => (
              <RevealCard
                key={item.titulo}
                delay={i * 120}
                className="rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
                style={{
                  background: `linear-gradient(to bottom, ${item.bgFrom}, #ffffff)`,
                  border: `1px solid ${item.borda}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: item.cor + '15' }}
                >
                  <item.Icon size={22} style={{ color: item.cor }} />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">{item.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.texto}</p>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 6 — DIFERENCIAIS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ backgroundColor: 'rgba(249,250,251,0.5)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <RevealCard className="text-center mb-12">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">
              Por que Sixxis
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              O que nos diferencia
            </h2>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { Icon: Shield,  titulo: 'Garantia Real',      texto: '12 meses de garantia total em todos os produtos. Suporte técnico especializado em caso de qualquer problema.',                          cor: '#16a34a' },
              { Icon: Award,   titulo: 'Produtos Originais', texto: 'Somos importadores diretos. 100% dos produtos são originais Sixxis com certificação de qualidade e nota fiscal.',                       cor: '#3cbfb3' },
              { Icon: Truck,   titulo: 'Entrega Ágil',       texto: 'Parcerias com Correios e transportadoras para entregas rápidas e seguras para qualquer canto do Brasil.',                                cor: '#2563eb' },
              { Icon: Users,   titulo: 'Atendimento Humano', texto: 'Nossa equipe está disponível via WhatsApp para tirar dúvidas antes, durante e após a compra. Sem chatbots impessoais.',                 cor: '#f59e0b' },
              { Icon: Zap,     titulo: 'Inovação Constante', texto: 'Linha de produtos em constante evolução, com tecnologias que combinam eficiência energética e máxima performance.',                      cor: '#8b5cf6' },
              { Icon: Heart,   titulo: 'Compromisso Social', texto: 'Empresa 100% brasileira sediada no interior de SP, gerando empregos locais e contribuindo com a economia regional.',                     cor: '#ef4444' },
            ].map((item, i) => (
              <RevealCard
                key={item.titulo}
                delay={i * 70}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-gray-200 transition-all duration-300 group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: item.cor + '15' }}
                >
                  <item.Icon size={18} style={{ color: item.cor }} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-1">{item.titulo}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.texto}</p>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 7 — INFORMAÇÕES DA EMPRESA + CONTATO
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Info da empresa */}
            <RevealCard>
              <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">
                Dados da empresa
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 mb-6">
                Transparência e confiança
              </h2>

              <div>
                {[
                  { label: 'Razão Social',       valor: 'SIXXIS IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA' },
                  { label: 'CNPJ',               valor: '54.978.947/0001-09' },
                  { label: 'Inscrição Estadual', valor: '117.633.347.114' },
                  { label: 'Endereço',           valor: 'R. Anhanguera, 1711 - Icaray, Araçatuba - SP, 16020-355' },
                  { label: 'Fundação',           valor: '2014 — Araçatuba, SP' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex gap-4 py-3.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-32 shrink-0 pt-0.5">
                      {item.label}
                    </span>
                    <span className="text-sm text-gray-800 font-medium leading-relaxed flex-1">
                      {item.valor}
                    </span>
                  </div>
                ))}
              </div>
            </RevealCard>

            {/* Contato + CTA */}
            <RevealCard delay={150}>
              <div
                className="rounded-3xl p-8 text-white"
                style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}
              >
                <h3 className="text-xl font-extrabold mb-2">Vamos conversar?</h3>
                <p className="text-white/60 text-sm mb-7 leading-relaxed">
                  Estamos prontos para ajudar com dúvidas, suporte técnico,
                  revendas ou simplesmente para te ajudar a escolher o produto certo.
                </p>

                <div className="space-y-3 mb-7">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/5518997474701"
                    className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition group hover:bg-white/15"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(37,211,102,0.20)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.368l-.36-.214-3.724.977.993-3.63-.235-.374A9.818 9.818 0 1112 21.818z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 font-medium">Vendas</p>
                      <p className="text-sm font-bold text-white">(18) 99747-4701</p>
                    </div>
                    <ArrowRight size={14} className="text-white/30 ml-auto group-hover:translate-x-1 transition-transform" />
                  </a>

                  {/* Telefone */}
                  <a
                    href="tel:+551193410262"
                    className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition group hover:bg-white/15"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(60,191,179,0.20)' }}>
                      <Phone size={17} style={{ color: '#3cbfb3' }} />
                    </div>
                    <div>
                      <p className="text-xs text-white/50 font-medium">Assistência Técnica</p>
                      <p className="text-sm font-bold text-white">(11) 93410-2621</p>
                    </div>
                    <ArrowRight size={14} className="text-white/30 ml-auto group-hover:translate-x-1 transition-transform" />
                  </a>

                  {/* E-mail */}
                  <a
                    href="mailto:brasil.sixxis@gmail.com"
                    className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition group hover:bg-white/15"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(139,92,246,0.20)' }}>
                      <Mail size={17} style={{ color: '#a78bfa' }} />
                    </div>
                    <div>
                      <p className="text-xs text-white/50 font-medium">E-mail</p>
                      <p className="text-sm font-bold text-white">brasil.sixxis@gmail.com</p>
                    </div>
                    <ArrowRight size={14} className="text-white/30 ml-auto group-hover:translate-x-1 transition-transform" />
                  </a>

                  {/* Endereço */}
                  <div
                    className="flex items-center gap-4 rounded-2xl px-4 py-3.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(245,158,11,0.20)' }}>
                      <MapPin size={17} style={{ color: '#fbbf24' }} />
                    </div>
                    <div>
                      <p className="text-xs text-white/50 font-medium">Endereço</p>
                      <p className="text-sm font-bold text-white">R. Anhanguera, 1711 — Araçatuba, SP</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/contato"
                  className="w-full flex items-center justify-center gap-2 font-extrabold text-[#0f2e2b] py-3.5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] text-sm"
                  style={{ backgroundColor: '#3cbfb3' }}
                >
                  Ir para página de contato
                  <ArrowRight size={15} />
                </Link>
              </div>
            </RevealCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SEÇÃO 8 — CTA FINAL
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ background: 'linear-gradient(to right, #3cbfb3, #2a9d8f)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <RevealCard>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Faça parte dos nossos 1 milhão de clientes
            </h2>
            <p className="text-white/80 text-base mb-7 max-w-xl mx-auto">
              Descubra produtos que transformam o seu ambiente e elevam
              sua qualidade de vida com a qualidade Sixxis.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 bg-white font-extrabold px-7 py-3.5 rounded-2xl transition hover:bg-gray-50 hover:-translate-y-0.5 active:scale-[0.98] text-sm"
                style={{ color: '#0f2e2b' }}
              >
                Ver catálogo completo
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/seja-revendedor"
                className="inline-flex items-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-7 py-3.5 rounded-2xl transition hover:bg-white/10 text-sm"
              >
                Seja um parceiro
              </Link>
            </div>
          </RevealCard>
        </div>
      </section>

    </div>
  )
}
