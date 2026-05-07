'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  TrendingUp, Shield, Users, Package, Star, CheckCircle,
  ArrowRight, Phone, Mail, MapPin, Award,
  BarChart3, Zap, Clock, HeartHandshake, Globe,
  Building2, Quote, BadgeCheck, Flame
} from 'lucide-react'
import SectionKicker from '@/components/ui/SectionKicker'

// ── Hook de animação com IntersectionObserver ──
function useAnimateOnView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function AnimSection({ children, className = '', delay = 0, style: extraStyle }: {
  children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties
}) {
  const { ref, visible } = useAnimateOnView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  )
}

export default function SejaRevendedorPage() {
  const [formData, setFormData] = useState({
    nome: '', empresa: '', email: '', whatsapp: '',
    cidade: '', segmento: '', mensagem: ''
  })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await fetch('/api/revendedor/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tipo: 'parceiro' }),
      })
    } catch { /* silent */ }
    setEnviado(true)
    setEnviando(false)
  }

  const stats = [
    { valor: '200+', label: 'Parceiros ativos',   icone: Users  },
    { valor: '30+',  label: 'Anos no mercado',     icone: Award  },
    { valor: '1M+',  label: 'Clientes atendidos',  icone: Star   },
    { valor: '12m',  label: 'Garantia total',       icone: Shield },
  ]

  const vantagens = [
    {
      icone: TrendingUp,
      titulo: 'Margem Competitiva',
      texto: 'Tabela exclusiva para revendedores com comissões reais de 18% a 35% dependendo do volume. Quanto mais você vende, mais ganha — é simples assim.',
      destaque: 'Até 35% de margem',
    },
    {
      icone: Package,
      titulo: 'Portfólio Completo',
      texto: 'Climatizadores, aspiradores e bikes spinning de alta performance. Linha diversificada que cobre todos os perfis de cliente — residencial, comercial e fitness.',
      destaque: '3 linhas de produto',
    },
    {
      icone: HeartHandshake,
      titulo: 'Suporte Dedicado',
      texto: 'Gerente de conta exclusivo, treinamentos técnicos e comerciais online, materiais de marketing prontos para usar e suporte pós-venda ágil e eficiente.',
      destaque: 'Gerente exclusivo',
    },
    {
      icone: BadgeCheck,
      titulo: 'Produto Certificado',
      texto: 'Produtos com qualidade premium e certificação INMETRO, garantia de 12 meses e índice zero de recall na linha de climatizadores. Você vende com total confiança.',
      destaque: 'Índice zero de recall',
    },
    {
      icone: Globe,
      titulo: 'Alcance Nacional',
      texto: 'Entregamos em todo o Brasil com transportadoras parceiras rastreadas. Você faz a venda, nós cuidamos da logística. Simples, rápido e confiável.',
      destaque: 'Todo o Brasil',
    },
    {
      icone: BarChart3,
      titulo: 'Segmento em Crescimento',
      texto: 'O mercado de climatização cresceu 34% nos últimos 3 anos no Brasil. Com o aumento das temperaturas e o custo do ar-condicionado, a demanda por climatizadores só cresce.',
      destaque: '+34% em 3 anos',
    },
  ]

  const depoimentos = [
    {
      nome: 'Roberto Mendonça',
      cargo: 'Diretor Comercial',
      empresa: 'Climatech Soluções',
      cidade: 'São Paulo, SP',
      anos: '8 anos parceiro',
      texto: 'Tornamo-nos parceiros da Sixxis há 8 anos e foi a melhor decisão estratégica que tomamos. A qualidade dos climatizadores é incomparável — clientes voltam e indicam. O suporte pós-venda é ágil e eficiente, o que nos dá confiança total para revender. O faturamento cresceu 40% desde o início da parceria.',
      crescimento: '+40%',
      avatarInicial: 'R',
      destaque: true
    },
    {
      nome: 'Fernanda Castellano',
      cargo: 'Proprietária',
      empresa: 'Casa & Conforto LTDA',
      cidade: 'Campinas, SP',
      anos: '5 anos parceira',
      texto: 'Trabalho com varejo há 15 anos e raramente vejo um produto gerar tanta recomendação espontânea. Nossos clientes compram um climatizador Sixxis e indicam para toda a família. Margem excelente, entrega pontual e suporte técnico rápido. Parceria sólida e de longo prazo.',
      crescimento: '+35%',
      avatarInicial: 'F',
      destaque: true
    },
    {
      nome: 'Mariana Oliveira Santos',
      cargo: 'CEO',
      empresa: 'Bem Estar Eletros',
      cidade: 'Belo Horizonte, MG',
      anos: '6 anos parceira',
      texto: 'Incluímos a linha Sixxis em 2019 e hoje ela representa 35% do faturamento total. Climatizadores com zero índice de devolução por defeito — simplesmente funcionam. Clientes satisfeitos geram mais negócio.',
      crescimento: '35% do faturamento',
      avatarInicial: 'M',
      avatarCor: '#3cbfb3',
      destaque: false
    },
    {
      nome: 'Carlos Eduardo Teixeira',
      cargo: 'Gerente de Vendas',
      empresa: 'TechFrio Distribuidora',
      cidade: 'Ribeirão Preto, SP',
      anos: '4 anos parceiro',
      texto: 'O que me surpreendeu foi a dedicação da Sixxis ao nos ajudar a treinar a equipe de vendas. Disponibilizaram materiais, fizeram treinamentos online e sempre estiveram presentes. Hoje somos o principal distribuidor da região.',
      crescimento: '#1 da região',
      avatarInicial: 'C',
      avatarCor: '#0f2e2b',
      destaque: false
    },
    {
      nome: 'Paulo Henrique Vieira',
      cargo: 'Sócio-Fundador',
      empresa: 'Clima Norte Comércio',
      cidade: 'Fortaleza, CE',
      anos: '7 anos parceiro',
      texto: 'No Nordeste, um bom climatizador não é luxo — é necessidade. A Sixxis entende isso e criou produtos que realmente funcionam no nosso clima. Demanda altíssima, abastecimento pontual. Nunca faltou produto em estoque.',
      crescimento: '+60% pico',
      avatarInicial: 'P',
      avatarCor: '#1a4f4a',
      destaque: false
    },
    {
      nome: 'Luciana Ferreira Campos',
      cargo: 'Diretora de Compras',
      empresa: 'Fitness Pro Equipamentos',
      cidade: 'Curitiba, PR',
      anos: '3 anos parceira',
      texto: 'Adicionamos as bikes spinning Sixxis ao catálogo e o resultado foi imediato. Qualidade de equipamento profissional a um preço acessível — os clientes percebem o valor. Em menos de 6 meses, as bikes já representam 20% das vendas de fitness.',
      crescimento: '20% das vendas',
      avatarInicial: 'L',
      avatarCor: '#3cbfb3',
      destaque: false
    },
  ]

  const processo = [
    {
      numero: '01',
      titulo: 'Cadastro Gratuito',
      descricao: 'Preencha o formulário abaixo com seus dados. Leva menos de 2 minutos. Sem taxa de adesão, sem burocracia.',
      icone: CheckCircle,
      tempo: 'Menos de 2 min',
      cor: '#3cbfb3'
    },
    {
      numero: '02',
      titulo: 'Análise e Contato',
      descricao: 'Nossa equipe comercial analisa o perfil e entra em contato via WhatsApp em até 24 horas. Avaliamos juntos o potencial de negócio na sua região.',
      icone: Phone,
      tempo: 'Em até 24h',
      cor: '#1a4f4a'
    },
    {
      numero: '03',
      titulo: 'Ativação do Acesso',
      descricao: 'Você recebe acesso à tabela de preços exclusiva, catálogo completo, materiais de marketing e treinamento de vendas com nosso time.',
      icone: Zap,
      tempo: 'Mesmo dia',
      cor: '#0f2e2b'
    },
    {
      numero: '04',
      titulo: 'Comece a Faturar',
      descricao: 'Faça seu primeiro pedido, receba com rapidez e comece a atender clientes com produto de qualidade comprovada. Suporte completo em todas as etapas.',
      icone: TrendingUp,
      tempo: 'Imediato',
      cor: '#3cbfb3'
    },
  ]

  const segmentos = [
    'Eletrodomésticos', 'Climatização e HVAC', 'Fitness e Bem-Estar',
    'Construção Civil', 'Imobiliária', 'Supermercado / Varejo',
    'E-commerce', 'Atacado / Distribuição', 'Outro segmento'
  ]

  return (
    <div>
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Seja um Parceiro' }]} />
      {/* ── HERO ── */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1f1d 0%, #0f2e2b 50%, #1a4f4a 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)' }} />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)' }} />
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'linear-gradient(#3cbfb3 1px, transparent 1px), linear-gradient(90deg, #3cbfb3 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center py-24">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8"
            style={{ backgroundColor: 'rgba(60,191,179,0.15)', border: '1px solid rgba(60,191,179,0.3)', color: '#3cbfb3' }}
          >
            <Flame size={12} />
            Programa de Parceiros — Sixxis
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Cresça com a marca{' '}
            <span style={{ color: '#3cbfb3' }}>que o Brasil confia há 30 anos</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-4 leading-relaxed">
            Mais de 200 revendedores em todo o Brasil já constroem negócios sólidos com a linha Sixxis.
            Produtos que se vendem sozinhos, suporte real e uma parceria que cresce com você.
          </p>

          <p className="text-sm text-white/50 mb-10">
            O mercado de climatização cresceu{' '}
            <strong className="text-[#3cbfb3]">34% nos últimos 3 anos</strong>.
            Este é o momento de entrar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#cadastro"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
            >
              Quero ser parceiro <ArrowRight size={18} />
            </a>
            <a
              href="#processo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:bg-white/10"
              style={{ border: '1.5px solid rgba(255,255,255,0.25)', color: 'white' }}
            >
              Como funciona
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ backgroundColor: '#0f2e2b' }} className="py-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <AnimSection key={i} delay={i * 100} className="text-center">
                <s.icone size={28} className="mx-auto mb-2" style={{ color: '#3cbfb3' }} />
                <p className="text-3xl sm:text-4xl font-black" style={{ color: '#3cbfb3' }}>{s.valor}</p>
                <p className="text-sm text-white/60 mt-1">{s.label}</p>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR QUE SER PARCEIRO ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-14">
            <SectionKicker texto="Vantagens reais" />
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Por que ser parceiro Sixxis?
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-2xl mx-auto">
              Não é uma parceria de prateleira. É um relacionamento construído para durar e crescer junto.
            </p>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ backgroundColor: '#3cbfb3' }} />
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vantagens.map((v, i) => (
              <AnimSection
                key={i}
                delay={i * 80}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-7"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#e8f8f7' }}
                  >
                    <v.icone size={22} style={{ color: '#3cbfb3' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-2">{v.titulo}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{v.texto}</p>
                    <span
                      className="inline-block text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#e8f8f7', color: '#3cbfb3' }}
                    >
                      {v.destaque}
                    </span>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPORTUNIDADE DE MERCADO ── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-14">
            <SectionKicker texto="Mercado em expansão" dark />
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              O segmento que só cresce
            </h2>
            <p className="text-white/60 text-lg mt-3 max-w-2xl mx-auto">
              Dados reais do mercado brasileiro de climatização e bem-estar
            </p>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ backgroundColor: '#3cbfb3' }} />
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                numero: '34%',
                descricao: 'crescimento do mercado de climatizadores no Brasil nos últimos 3 anos',
                icone: TrendingUp,
                fonte: 'IBGE / Abrava 2024'
              },
              {
                numero: '82%',
                descricao: 'dos brasileiros priorizam conforto térmico ao escolher onde morar ou trabalhar',
                icone: Users,
                fonte: 'Pesquisa CNI 2024'
              },
              {
                numero: 'R$8bi',
                descricao: 'é o tamanho atual do mercado de equipamentos de climatização e bem-estar no Brasil',
                icone: BarChart3,
                fonte: 'ABEE 2024'
              },
            ].map((item, i) => (
              <AnimSection
                key={i}
                delay={i * 120}
                className="text-center p-8 rounded-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' } as React.CSSProperties}
              >
                <item.icone size={32} className="mx-auto mb-4" style={{ color: '#3cbfb3' }} />
                <p className="text-5xl font-black text-white mb-3">{item.numero}</p>
                <p className="text-white/60 text-sm leading-relaxed mb-3">{item.descricao}</p>
                <span className="text-xs text-white/30 italic">{item.fonte}</span>
              </AnimSection>
            ))}
          </div>

          <AnimSection className="text-center">
            <p className="text-white/70 text-base max-w-2xl mx-auto">
              Com o aumento das temperaturas, a crise energética e a busca crescente por bem-estar,
              o mercado de climatização é um dos poucos segmentos que{' '}
              <strong className="text-white">não para de crescer</strong>{' '}
              mesmo em períodos de instabilidade econômica.{' '}
              <strong className="text-[#3cbfb3]">Isso significa oportunidade real para o seu negócio agora.</strong>
            </p>
          </AnimSection>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-14">
            <SectionKicker texto="Resultados comprovados" />
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Quem já é parceiro, recomenda
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-2xl mx-auto">
              Histórias reais de parceiros que construíram negócios sólidos com a Sixxis
            </p>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ backgroundColor: '#3cbfb3' }} />
          </AnimSection>

          {/* Cards de destaque (top 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {depoimentos.filter(d => d.destaque).map((d, i) => (
              <AnimSection key={i} delay={i * 150}>
                <div
                  className="relative rounded-2xl p-8 h-full flex flex-col"
                  style={{
                    background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)',
                    border: '1px solid rgba(60,191,179,0.2)'
                  }}
                >
                  <div
                    className="absolute top-6 right-6 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
                  >
                    DESTAQUE
                  </div>

                  <Quote size={32} className="mb-4 opacity-40" style={{ color: '#3cbfb3' }} />

                  <p className="text-white/85 text-base leading-relaxed mb-6 flex-1 italic">
                    &ldquo;{d.texto}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-5 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0"
                        style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
                      >
                        {d.avatarInicial}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{d.nome}</p>
                        <p className="text-white/50 text-xs">{d.cargo} · {d.empresa}</p>
                        <p className="text-white/40 text-xs">{d.cidade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: '#3cbfb3' }}>{d.crescimento}</p>
                      <p className="text-white/40 text-xs">{d.anos}</p>
                    </div>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>

          {/* Cards menores (demais) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {depoimentos.filter(d => !d.destaque).map((d, i) => (
              <AnimSection key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
                  <Quote size={20} className="mb-3" style={{ color: '#3cbfb3', opacity: 0.5 } as React.CSSProperties} />
                  <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1 italic">
                    &ldquo;{d.texto.substring(0, 180)}...&rdquo;
                  </p>
                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: d.avatarCor || '#3cbfb3' }}
                      >
                        {d.avatarInicial}
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-xs">{d.nome}</p>
                        <p className="text-gray-400 text-xs">{d.empresa}</p>
                        <p className="text-gray-300 text-xs">{d.cidade}</p>
                      </div>
                    </div>
                    <div
                      className="mt-3 text-center py-1.5 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: '#e8f8f7', color: '#3cbfb3' }}
                    >
                      {d.crescimento}
                    </div>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESSO ── */}
      <section id="processo" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-16">
            <SectionKicker texto="Simples e rápido" />
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Comece a faturar em 4 passos
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-xl mx-auto">
              Da inscrição à primeira venda em menos de 48 horas
            </p>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ backgroundColor: '#3cbfb3' }} />
          </AnimSection>

          <div className="relative">
            <div
              className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5"
              style={{ backgroundColor: '#e8f8f7', zIndex: 0 }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative" style={{ zIndex: 1 }}>
              {processo.map((p, i) => (
                <AnimSection key={i} delay={i * 150} className="text-center">
                  <div className="relative mx-auto mb-6">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
                      style={{ backgroundColor: p.cor }}
                    >
                      <p.icone size={32} color="white" />
                    </div>
                    <div
                      className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ backgroundColor: '#0f2e2b', color: '#3cbfb3', border: '2px solid white' }}
                    >
                      {p.numero}
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-2">{p.titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{p.descricao}</p>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: '#e8f8f7', color: '#3cbfb3' }}
                  >
                    <Clock size={11} />
                    {p.tempo}
                  </span>
                </AnimSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FORMULÁRIO ── */}
      <section id="cadastro" className="py-20" style={{ background: 'linear-gradient(180deg, #f8fafc, #fff)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-12">
            <SectionKicker texto="Sem taxa de adesão" />
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Quero ser parceiro Sixxis
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-xl mx-auto">
              Nossa equipe comercial entra em contato em até 24 horas
            </p>
            <div className="w-16 h-1 rounded-full mx-auto mt-5" style={{ backgroundColor: '#3cbfb3' }} />
          </AnimSection>

          <AnimSection>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Coluna esquerda — Benefícios */}
              <div className="lg:col-span-1 space-y-6">
                <div
                  className="rounded-2xl p-6"
                  style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}
                >
                  <h3 className="text-white font-bold text-base mb-4">O que você recebe</h3>
                  {[
                    'Acesso à tabela de preços exclusiva',
                    'Material de marketing pronto para usar',
                    'Treinamento comercial e técnico',
                    'Gerente de conta dedicado',
                    'Suporte prioritário WhatsApp',
                    'Programa de metas e recompensas',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 mb-3">
                      <CheckCircle size={14} style={{ color: '#3cbfb3', flexShrink: 0 }} />
                      <span className="text-white/75 text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
                    Fale com a gente
                  </p>
                  <a
                    href="https://wa.me/5518997474701"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm font-medium text-gray-700 hover:text-[#3cbfb3] transition-colors mb-2"
                  >
                    <Phone size={15} style={{ color: '#3cbfb3' }} /> (18) 99747-4701
                  </a>
                  <a
                    href="mailto:brasil.sixxis@gmail.com"
                    className="flex items-center gap-2.5 text-sm font-medium text-gray-700 hover:text-[#3cbfb3] transition-colors mb-2"
                  >
                    <Mail size={15} style={{ color: '#3cbfb3' }} /> brasil.sixxis@gmail.com
                  </a>
                  <div className="flex items-center gap-2.5 text-sm text-gray-500">
                    <MapPin size={15} style={{ color: '#3cbfb3' }} /> Araçatuba, SP
                  </div>
                </div>
              </div>

              {/* Coluna direita — Formulário */}
              <div className="lg:col-span-2">
                {enviado ? (
                  <div
                    className="rounded-2xl p-12 text-center border"
                    style={{ backgroundColor: '#f0fffe', borderColor: '#3cbfb3' }}
                  >
                    <CheckCircle size={56} className="mx-auto mb-4" style={{ color: '#3cbfb3' }} />
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Cadastro recebido!</h3>
                    <p className="text-gray-500 text-base">
                      Nossa equipe comercial entrará em contato via WhatsApp em até 24 horas.
                      Bem-vindo à família Sixxis! 🎉
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          Nome completo *
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.nome}
                          onChange={e => setFormData({ ...formData, nome: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={formData.empresa}
                          onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
                          placeholder="Nome da empresa (opcional)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          E-mail *
                        </label>
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          WhatsApp *
                        </label>
                        <input
                          required
                          type="tel"
                          value={formData.whatsapp}
                          onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          Cidade / Estado
                        </label>
                        <input
                          type="text"
                          value={formData.cidade}
                          onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
                          placeholder="São Paulo, SP"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          Segmento de atuação
                        </label>
                        <select
                          value={formData.segmento}
                          onChange={e => setFormData({ ...formData, segmento: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition bg-white"
                        >
                          <option value="">Selecione</option>
                          {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Mensagem (opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.mensagem}
                        onChange={e => setFormData({ ...formData, mensagem: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition resize-none"
                        placeholder="Conte um pouco sobre seu negócio ou dúvida..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={enviando}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
                    >
                      {enviando ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar cadastro <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      Sem taxa de adesão · Aprovação em até 24h · Dados protegidos pela LGPD
                    </p>
                  </form>
                )}
              </div>
            </div>
          </AnimSection>
        </div>
      </section>
    </div>
  )
}
