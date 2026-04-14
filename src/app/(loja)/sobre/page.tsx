'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Shield, Truck, Award, Users, TrendingUp,
  Heart, Zap, Star, ArrowRight, Wind,
  Bike, Target, Handshake, MapPin,
  ChevronRight,
} from 'lucide-react'

// ─── Hook de animação ──────────────────────────────────────────────────────────

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
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Counter animado ───────────────────────────────────────────────────────────

function CounterAnimate({
  target,
  suffix = '',
  duration = 2000,
  prefix = '',
}: {
  target: number
  suffix?: string
  duration?: number
  prefix?: string
}) {
  const [count, setCount] = useState(0)
  const { ref, visible } = useReveal(0.3)

  useEffect(() => {
    if (!visible) return
    const step = Math.ceil(target / (duration / 16))
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setCount(current)
      if (current >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [visible, target, duration])

  return (
    <div ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvaliacaoParceiro {
  id:            string
  nomeCompleto:  string
  empresa?:      string
  cargo?:        string
  cidade?:       string
  nota:          number
  titulo:        string
  comentario:    string
  avatarInicial?: string
  corAvatar:     string
  destaque:      boolean
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SobrePage() {
  const [destaques, setDestaques] = useState<AvaliacaoParceiro[]>([])

  useEffect(() => {
    fetch('/api/avaliacoes-parceiros')
      .then(r => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d)) {
          setDestaques(d.filter((a: AvaliacaoParceiro) => a.destaque).slice(0, 3))
        }
      })
      .catch(() => {})
  }, [])

  const timeline = [
    { ano: '1993', titulo: 'Fundação', desc: 'Abertura da Sixxis em Araçatuba, SP, como pequena importadora de equipamentos domésticos.', cor: '#3cbfb3' },
    { ano: '1998', titulo: 'Climatizadores',  desc: 'Lançamento da primeira linha de climatizadores residenciais própria da marca.',           cor: '#0f2e2b' },
    { ano: '2004', titulo: 'Expansão',        desc: 'Expansão para o interior de SP com rede de revendedores parceiros.',                       cor: '#1a4f4a' },
    { ano: '2010', titulo: 'Linha Comercial', desc: 'Lançamento da linha comercial de alta capacidade para empresas e eventos.',                cor: '#8b5cf6' },
    { ano: '2015', titulo: '200 Parceiros',   desc: 'Marca de 200 revendedores ativos em todo o Brasil.',                                       cor: '#f59e0b' },
    { ano: '2018', titulo: 'Linha Fitness',   desc: 'Entrada no mercado fitness com aspiradores e bikes spinning profissionais.',               cor: '#16a34a' },
    { ano: '2022', titulo: 'Digital',         desc: 'Plataforma digital própria e atendimento nacional integrado.',                             cor: '#2563eb' },
    { ano: '2025', titulo: '1 Milhão',        desc: 'Milestone histórico: 1 milhão de clientes atendidos em todo o Brasil.',                   cor: '#ef4444' },
  ]

  const numeros = [
    { label: 'Clientes Atendidos', target: 1000000, prefix: '', suffix: '+', Icon: Users,      cor: '#3cbfb3', isMilhao: true },
    { label: 'Anos de Mercado',    target: 30,       prefix: '', suffix: '+', Icon: TrendingUp, cor: '#0f2e2b', isMilhao: false },
    { label: 'Garantia',           target: 12,       prefix: '', suffix: 'm', Icon: Shield,     cor: '#16a34a', isMilhao: false },
    { label: 'Revendedores',       target: 200,      prefix: '', suffix: '+', Icon: Handshake,  cor: '#8b5cf6', isMilhao: false },
    { label: 'Entrega Nacional',   target: 100,      prefix: '', suffix: '%', Icon: Truck,      cor: '#f59e0b', isMilhao: false },
    { label: 'Qualidade',          target: 0,        prefix: '', suffix: '',  Icon: Award,      cor: '#2563eb', isMilhao: false, custom: 'Zero Recall' },
  ]

  const linhas = [
    { icon: Wind, titulo: 'Climatizadores',  desc: 'Do residencial ao industrial. A linha que tornou a Sixxis referência nacional em climatização evaporativa.', cor: '#3cbfb3', href: '/produtos?categoria=climatizadores' },
    { icon: Zap,  titulo: 'Purificadores',   desc: 'Tecnologia de filtração avançada para ar puro e livre de impurezas em qualquer ambiente.',                 cor: '#0f2e2b', href: '/produtos?categoria=purificadores'  },
    { icon: Bike, titulo: 'Fitness',          desc: 'Bikes spinning e equipamentos fitness de qualidade profissional acessíveis para academias e uso doméstico.', cor: '#8b5cf6', href: '/produtos?categoria=bikes'          },
  ]

  const valores = [
    { icon: Target,    titulo: 'Missão',  desc: 'Desenvolver produtos que melhorem o bem-estar das pessoas, com qualidade, inovação e preço justo.',                      cor: '#3cbfb3' },
    { icon: Heart,     titulo: 'Valores', desc: 'Qualidade sem compromisso, transparência nas relações, respeito ao cliente e responsabilidade com o meio ambiente.',    cor: '#16a34a' },
    { icon: Star,      titulo: 'Visão',   desc: 'Ser a marca mais amada de climatização e bem-estar do Brasil, presente em todos os lares que buscam qualidade de vida.', cor: '#f59e0b' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
            <li><Link href="/" className="hover:text-gray-700 transition font-medium">Início</Link></li>
            <li><ChevronRight size={13} className="text-gray-300" /></li>
            <li className="text-gray-900 font-semibold">Sobre Nós</li>
          </ol>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 50%, #0f2e2b 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)', transform: 'translate(-30%, 30%)' }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(#3cbfb3 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#3cbfb3]/15 border border-[#3cbfb3]/30 rounded-full px-4 py-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3cbfb3] animate-pulse" />
              <span className="text-[#3cbfb3] text-xs font-bold tracking-widest uppercase">
                Fundada em 1993 · Araçatuba, SP
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              30 anos de qualidade<br />
              <span style={{ color: '#3cbfb3' }}>e inovação brasileira</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl">
              A Sixxis nasceu com um propósito claro: levar produtos de alta qualidade
              que transformam o dia a dia de famílias e negócios em todo o Brasil.
              Da climatização ao fitness, somos parceiros do seu bem-estar há mais de três décadas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/produtos"
                className="inline-flex items-center gap-2 font-extrabold text-[#0f2e2b] px-6 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[0.98] text-sm"
                style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 20px rgba(60,191,179,0.4)' }}>
                Ver nossos produtos <ArrowRight size={16} />
              </Link>
              <Link href="/contato"
                className="inline-flex items-center gap-2 font-semibold text-white px-6 py-3.5 rounded-2xl border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all text-sm">
                Fale conosco
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NÚMEROS ──────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {numeros.map((n, i) => {
              const Icon = n.Icon
              return (
                <RevealCard key={n.label} delay={i * 70}
                  className="text-center p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: n.cor + '18' }}>
                    <Icon size={18} style={{ color: n.cor }} />
                  </div>
                  <p className="text-2xl font-extrabold mb-0.5" style={{ color: n.cor }}>
                    {n.custom ? n.custom : n.isMilhao ? '1M+' : (
                      <CounterAnimate target={n.target} suffix={n.suffix} prefix={n.prefix} />
                    )}
                  </p>
                  <p className="text-xs text-gray-500 font-medium leading-tight">{n.label}</p>
                </RevealCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── NOSSA HISTÓRIA — TIMELINE ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealCard className="text-center mb-14">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Nossa Trajetória</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
              32 anos construindo história
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              De uma pequena importadora em Araçatuba a uma marca nacional reconhecida por mais de 1 milhão de clientes.
            </p>
          </RevealCard>

          {/* Timeline */}
          <div className="relative">
            {/* Linha central — visível apenas em lg */}
            <div className="hidden lg:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gray-100" />

            <div className="space-y-6 lg:space-y-0">
              {timeline.map((item, i) => (
                <RevealCard key={item.ano} delay={i * 80}
                  className={`lg:flex lg:items-center lg:gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} mb-6 lg:mb-10`}>
                  {/* Conteúdo */}
                  <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className={`bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow inline-block w-full lg:max-w-sm ${i % 2 === 0 ? 'lg:ml-auto' : ''}`}>
                      <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: item.cor }}>
                        {item.ano}
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-base mt-0.5 mb-1">{item.titulo}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  {/* Ponto central */}
                  <div className="hidden lg:flex w-8 h-8 rounded-full border-4 border-white shadow-md items-center justify-center shrink-0 z-10"
                    style={{ backgroundColor: item.cor }}>
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Espaço do lado oposto */}
                  <div className="hidden lg:block flex-1" />
                </RevealCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LINHAS DE PRODUTO ────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealCard className="text-center mb-12">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Portfolio</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Nossas linhas de produto</h2>
          </RevealCard>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {linhas.map((l, i) => {
              const Icon = l.icon
              return (
                <RevealCard key={l.titulo} delay={i * 100}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-2 w-full" style={{ backgroundColor: l.cor }} />
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: l.cor + '18' }}>
                      <Icon size={22} style={{ color: l.cor }} />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 mb-2">{l.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{l.desc}</p>
                    <Link href={l.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition"
                      style={{ color: l.cor }}>
                      Ver produtos <ArrowRight size={13} />
                    </Link>
                  </div>
                </RevealCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── MISSÃO, VALORES, VISÃO ───────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealCard className="text-center mb-12">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Propósito</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">O que nos move</h2>
          </RevealCard>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {valores.map((v, i) => {
              const Icon = v.icon
              return (
                <RevealCard key={v.titulo} delay={i * 100}
                  className="text-center p-7 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: v.cor + '18' }}>
                    <Icon size={24} style={{ color: v.cor }} />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base mb-2">{v.titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </RevealCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── NOSSOS PARCEIROS — DESTAQUES ─────────────────────────────────────── */}
      {destaques.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <RevealCard className="text-center mb-10">
              <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Parceiros</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-2">
                O que dizem nossos parceiros
              </h2>
              <p className="text-gray-500 text-sm">
                Mais de 200 revendedores confiam na Sixxis para crescer
              </p>
            </RevealCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {destaques.map((av, i) => (
                <RevealCard key={av.id} delay={i * 100}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={14}
                        className={n <= av.nota ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <p className="text-sm font-extrabold text-gray-900 mb-2 leading-snug">&ldquo;{av.titulo}&rdquo;</p>
                  <p className="text-xs text-gray-500 leading-relaxed italic flex-1">{av.comentario}</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-50">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                      style={{ backgroundColor: av.corAvatar || '#3cbfb3' }}>
                      {av.avatarInicial || av.nomeCompleto?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-gray-900 truncate">{av.nomeCompleto}</p>
                      <p className="text-xs text-gray-400 truncate">{av.cargo}{av.empresa ? ` · ${av.empresa}` : ''}</p>
                      {av.cidade && <p className="text-[10px] text-[#3cbfb3] font-semibold">{av.cidade}</p>}
                    </div>
                  </div>
                </RevealCard>
              ))}
            </div>

            <RevealCard className="text-center">
              <Link href="/seja-revendedor"
                className="inline-flex items-center gap-2 font-bold text-[#3cbfb3] hover:underline text-sm">
                Ver mais depoimentos e ser parceiro <ArrowRight size={15} />
              </Link>
            </RevealCard>
          </div>
        </section>
      )}

      {/* ─── LOCALIZAÇÃO + CONTATO ────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <RevealCard>
              <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Onde estamos</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-4">
                Nossa base, o Brasil inteiro
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Fundada em Araçatuba (SP), a Sixxis atende clientes em todos os estados brasileiros
                com logística integrada e parceiros distribuídos pelo país.
              </p>
              <div className="space-y-3 mb-7">
                {[
                  { Icon: MapPin,    txt: 'Araçatuba, SP — sede administrativa' },
                  { Icon: Truck,     txt: 'Entrega para todo o Brasil' },
                  { Icon: Handshake, txt: '200+ parceiros revendedores ativos' },
                ].map(({ Icon, txt }) => (
                  <div key={txt} className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-xl bg-[#e8f8f7] flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-[#3cbfb3]" />
                    </div>
                    {txt}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/contato"
                  className="inline-flex items-center gap-2 font-bold text-white px-5 py-3 rounded-xl text-sm transition hover:-translate-y-0.5"
                  style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 14px rgba(60,191,179,0.35)' }}>
                  Fale conosco
                </Link>
                <Link href="/seja-revendedor"
                  className="inline-flex items-center gap-2 font-semibold text-gray-700 border border-gray-200 px-5 py-3 rounded-xl text-sm hover:bg-gray-50 transition">
                  Seja parceiro
                </Link>
              </div>
            </RevealCard>

            {/* Stats block */}
            <RevealCard delay={150}>
              <div
                className="rounded-3xl p-8 text-white"
                style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}
              >
                <p className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest mb-6">
                  32 anos de conquistas
                </p>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { val: '1993', label: 'Ano de fundação' },
                    { val: '+1M',  label: 'Clientes atendidos' },
                    { val: '200+', label: 'Parceiros no Brasil' },
                    { val: '100%', label: 'Produtos originais' },
                  ].map(({ val, label }) => (
                    <div key={label} className="bg-white/10 rounded-2xl p-4">
                      <p className="text-2xl font-extrabold text-white mb-0.5">{val}</p>
                      <p className="text-xs text-white/60 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}
      >
        <RevealCard className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Faça parte da história Sixxis
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-xl mx-auto leading-relaxed">
            Seja como cliente, parceiro revendedor ou simplesmente curtindo os nossos produtos —
            você faz parte desta história de mais de 30 anos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/produtos"
              className="inline-flex items-center gap-2 font-extrabold text-[#0f2e2b] px-7 py-4 rounded-2xl text-sm transition hover:-translate-y-0.5"
              style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 20px rgba(60,191,179,0.35)' }}>
              Ver produtos <ArrowRight size={16} />
            </Link>
            <Link href="/seja-revendedor"
              className="inline-flex items-center gap-2 font-semibold text-white border-2 border-white/20 hover:border-white/40 hover:bg-white/10 px-7 py-4 rounded-2xl text-sm transition">
              Seja parceiro
            </Link>
          </div>
        </RevealCard>
      </section>
    </div>
  )
}
