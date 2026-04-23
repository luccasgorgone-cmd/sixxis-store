'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import SectionKicker from '@/components/ui/SectionKicker'
import {
  Shield, Truck, Award, Users, MapPin, Phone,
  Mail, Heart, Zap, Star, ArrowRight,
  Wind, Bike, TrendingUp, Building2, Globe, HeartHandshake,
  BadgeCheck, PackageCheck,
} from 'lucide-react'

function useAnimateOnView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function AnimSection({ children, delay = 0, className = '', style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
  const { ref, visible } = useAnimateOnView()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      ...style,
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
      <section className="relative overflow-hidden min-h-[75vh] flex flex-col justify-center"
        style={{ background: 'linear-gradient(135deg, #0a1f1d 0%, #0f2e2b 50%, #1a4f4a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'linear-gradient(#3cbfb3 1px, transparent 1px), linear-gradient(90deg, #3cbfb3 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #3cbfb3, transparent)', transform: 'translate(-30%, 30%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 w-full">
          <AnimSection className="text-center">
            <div className="inline-flex items-center gap-2 mb-6 rounded-full px-4 py-2 border"
              style={{ backgroundColor: 'rgba(60,191,179,0.1)', borderColor: 'rgba(60,191,179,0.25)' }}>
              <Building2 size={12} className="text-[#3cbfb3]" />
              <span className="text-[#3cbfb3] text-xs font-bold uppercase tracking-widest">
                Fundada em 1993 — Araçatuba, SP
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5 max-w-4xl mx-auto">
              30 anos levando{' '}
              <span style={{ color: '#3cbfb3' }}>qualidade e conforto</span>
              {' '}para o Brasil
            </h1>
            <p className="text-white/65 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              De uma pequena importadora no interior de São Paulo a mais de 1 milhão de
              clientes satisfeitos. Esta é a história da Sixxis.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-14">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { val: '30+',  label: 'Anos de mercado',        icon: Building2 },
                { val: '1M+',  label: 'Clientes atendidos',     icon: Users     },
                { val: '200+', label: 'Revendedores parceiros', icon: Heart     },
                { val: '12M',  label: 'Meses de garantia',      icon: Shield    },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="text-center rounded-2xl p-4"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Icon size={16} className="text-[#3cbfb3] mx-auto mb-2" />
                    <p className="text-2xl font-black text-white leading-none mb-1">{s.val}</p>
                    <p className="text-[10px] text-white/50 font-medium leading-tight">{s.label}</p>
                  </div>
                )
              })}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ─── TIMELINE ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-14">
            <SectionKicker texto="Nossa trajetória" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-4">
              30 anos de história e crescimento
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              Cada marco desta linha do tempo representa anos de trabalho, inovação
              e o compromisso inabalável de entregar o melhor para os nossos clientes e parceiros.
              Uma trajetória construída com dedicação, superando desafios e conquistando mercados.
            </p>
          </AnimSection>

          <div className="relative max-w-4xl mx-auto">
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px"
              style={{ backgroundImage: 'linear-gradient(to bottom, #3cbfb3, #0f2e2b)', transform: 'translateX(-50%)' }} />

            <div className="space-y-8">
              {TIMELINE.map((item, i) => {
                const Icon = item.icon
                const esq = i % 2 === 0
                return (
                  <AnimSection key={item.ano} delay={i * 60}>
                    <div className={`flex gap-4 sm:gap-8 ${esq ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                      <div className="flex-1">
                        <div className={`bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${esq ? 'sm:text-right' : 'sm:text-left'}`}>
                          <div className={`flex items-center gap-3 mb-3 ${esq ? 'sm:flex-row-reverse' : ''}`}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: item.cor + '15' }}>
                              <Icon size={17} style={{ color: item.cor }} />
                            </div>
                            <span className="text-lg font-black text-[#3cbfb3]">{item.ano}</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-gray-900 mb-2">{item.titulo}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed">{item.texto}</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex w-10 h-10 rounded-full border-4 border-white shadow-lg items-center justify-center shrink-0 z-10 self-start mt-4"
                        style={{ backgroundColor: item.cor }}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1 hidden sm:block" />
                    </div>
                  </AnimSection>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROPÓSITO ─── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0a1f1d 0%, #0f2e2b 60%, #1a4f4a 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-12">
            <SectionKicker texto="Propósito" dark />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-3">O que nos move todos os dias</h2>
            <p className="text-white/55 text-sm max-w-xl mx-auto leading-relaxed">
              Nossa missão, visão e valores definem quem somos e como tomamos cada decisão dentro da empresa.
            </p>
          </AnimSection>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Zap, titulo: 'Missão', cor: '#3cbfb3',
                texto: 'Proporcionar qualidade de vida e bem-estar às pessoas por meio de produtos inovadores, confiáveis e acessíveis. Entregamos excelência em cada etapa — desde a fabricação até o suporte pós-venda — porque acreditamos que toda família merece o melhor.',
              },
              {
                icon: Globe, titulo: 'Visão', cor: '#5eead4',
                texto: 'Ser até 2030 a empresa mais reconhecida no Brasil nos segmentos de climatização, limpeza e fitness. Queremos impactar positivamente a vida de 10 milhões de famílias brasileiras, sendo sinônimo de qualidade, inovação e confiança.',
              },
              {
                icon: HeartHandshake, titulo: 'Valores', cor: '#99f6e4',
                texto: 'Qualidade sem compromisso em cada produto. Integridade em toda relação comercial. Inovação constante como vantagem competitiva. Foco total na experiência do cliente. Responsabilidade social com a comunidade. Excelência em cada detalhe do processo.',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <AnimSection key={item.titulo} delay={i * 100}
                  className="rounded-2xl p-7 hover:-translate-y-1.5 transition-all duration-300"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: 'rgba(60,191,179,0.15)' }}>
                    <Icon size={24} style={{ color: item.cor }} />
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-3">{item.titulo}</h3>
                  <p className="text-sm text-white/65 leading-relaxed">{item.texto}</p>
                </AnimSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── DIFERENCIAIS ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimSection className="text-center mb-14">
            <SectionKicker texto="Por que Sixxis" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">O que nos diferencia no mercado</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
              Mais de 30 anos construindo relacionamentos baseados em confiança, qualidade e resultados reais para os nossos clientes.
            </p>
          </AnimSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icone: BadgeCheck,
                titulo: 'Garantia Real de 12 Meses',
                subtitulo: 'Proteção total, sem letras miúdas',
                texto: 'Garantia integral de 12 meses contra defeitos de fabricação em todos os produtos Sixxis. Mais de 50 pontos de assistência técnica no Brasil, logística reversa gratuita e resolução em até 7 dias úteis.',
                destaque: '12 meses',
                corIcone: '#3cbfb3',
              },
              {
                icone: PackageCheck,
                titulo: '100% Produtos Originais',
                subtitulo: 'Certificação INMETRO em toda a linha',
                texto: 'Todos os produtos saem diretamente da nossa importação oficial com nota fiscal, certificação INMETRO e rastreabilidade completa. Zero produtos paralelos ou adulterados — nunca.',
                destaque: 'INMETRO',
                corIcone: '#0f2e2b',
              },
              {
                icone: MapPin,
                titulo: 'Entrega para Todo o Brasil',
                subtitulo: 'Todos os 5.570 municípios',
                texto: 'Entregamos em todo o território nacional com transportadoras parceiras rastreadas. Prazo médio de 3 a 5 dias úteis. Embalagem reforçada e seguro de transporte inclusos.',
                destaque: '5.570 cidades',
                corIcone: '#3cbfb3',
              },
              {
                icone: HeartHandshake,
                titulo: 'Atendimento Humanizado',
                subtitulo: 'Pessoas reais, respostas rápidas',
                texto: 'Equipe de atendimento real — sem bots. Respondemos via WhatsApp e e-mail com tempo médio de resposta de 2 horas. Pós-venda dedicado e resolução com empatia.',
                destaque: '2h resposta',
                corIcone: '#0f2e2b',
              },
              {
                icone: Zap,
                titulo: 'Inovação Constante',
                subtitulo: 'P&D contínuo em climatização',
                texto: 'Investimos continuamente em pesquisa e desenvolvimento. Nossa linha é atualizada anualmente com melhorias reais baseadas no feedback de clientes e parceiros.',
                destaque: 'Atualização anual',
                corIcone: '#3cbfb3',
              },
              {
                icone: Building2,
                titulo: 'Empresa 100% Brasileira',
                subtitulo: 'Fundada em Araçatuba, SP',
                texto: 'Fundada e operada por brasileiros. Entendemos o clima, o mercado e as necessidades do consumidor brasileiro como ninguém. 30 anos gerando empregos e crescendo no país.',
                destaque: '30 anos',
                corIcone: '#0f2e2b',
              },
            ].map((item, i) => {
              const Icon = item.icone
              return (
                <AnimSection key={i} delay={i * 80}>
                  <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 p-8 h-full flex flex-col relative overflow-hidden">
                    {/* Decoração de fundo */}
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-5 transition-opacity group-hover:opacity-10"
                      style={{ backgroundColor: item.corIcone }}
                    />
                    {/* Ícone */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shrink-0 group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: `${item.corIcone}15` }}
                    >
                      <Icon size={30} style={{ color: item.corIcone }} strokeWidth={1.8} />
                    </div>
                    {/* Badge destaque */}
                    <span
                      className="self-start text-[11px] font-black px-2.5 py-1 rounded-full mb-3 uppercase tracking-wide"
                      style={{ backgroundColor: `${item.corIcone}15`, color: item.corIcone }}
                    >
                      {item.destaque}
                    </span>
                    {/* Título */}
                    <h3 className="text-lg font-extrabold text-gray-900 mb-1 leading-snug">
                      {item.titulo}
                    </h3>
                    {/* Subtítulo */}
                    <p className="text-sm font-semibold mb-3" style={{ color: item.corIcone }}>
                      {item.subtitulo}
                    </p>
                    {/* Linha divisória */}
                    <div className="w-8 h-0.5 rounded-full mb-4" style={{ backgroundColor: item.corIcone }} />
                    {/* Descrição */}
                    <p className="text-sm text-gray-500 leading-relaxed flex-1">
                      {item.texto}
                    </p>
                  </div>
                </AnimSection>
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
            <AnimSection>
              <SectionKicker texto="Transparência" dark />
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
            </AnimSection>

            <AnimSection delay={150}>
              <div className="bg-white/8 border border-white/10 rounded-3xl p-7 backdrop-blur-sm">
                <h3 className="text-xl font-extrabold text-white mb-2">Vamos conversar?</h3>
                <p className="text-white/55 text-sm mb-6 leading-relaxed">
                  Estamos prontos para ajudar com dúvidas, suporte técnico,
                  parcerias ou simplesmente escolher o produto certo para você.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    { icon: Phone, label: 'Vendas',              val: '(18) 99747-4701',         href: 'https://wa.me/5518997474701',    cor: '#25D366' },
                    { icon: Phone, label: 'Assistência Técnica', val: '(11) 93410-2621',          href: 'https://wa.me/5511934102621',    cor: '#3cbfb3' },
                    { icon: Mail,  label: 'E-mail',              val: 'brasil.sixxis@gmail.com',  href: 'mailto:brasil.sixxis@gmail.com', cor: '#8b5cf6' },
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
            </AnimSection>
          </div>
        </div>
      </section>

      {/* ─── MAPA ─── */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimSection>
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
          </AnimSection>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-14" style={{ background: 'linear-gradient(135deg, #0a1f1d 0%, #0f2e2b 100%)' }}>
        <AnimSection className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
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
        </AnimSection>
      </section>
    </div>
  )
}
