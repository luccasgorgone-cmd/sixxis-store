'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  CheckCircle, Star, TrendingUp, Users, Package,
  Headphones, Award, ChevronLeft, ChevronRight,
  ArrowRight, Shield, Zap, Heart, MapPin, Phone, Mail
} from 'lucide-react'

// ─── Reveal hook ──────────────────────────────────────────────
function useReveal(threshold = 0.12) {
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

function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ─── Card de depoimento ────────────────────────────────────────
function CardDepoimento({ av }: { av: any }) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 relative overflow-hidden h-full flex flex-col">
      {/* Aspas decorativas de fundo */}
      <div className="absolute top-4 right-5 pointer-events-none select-none"
        style={{ fontSize: '120px', lineHeight: 1, color: '#3cbfb3', opacity: 0.05, fontFamily: 'Georgia, serif' }}>
        "
      </div>

      {/* Estrelas */}
      <div className="flex gap-1 mb-4">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={15}
            className={i <= (av.nota || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
        ))}
      </div>

      {/* Título */}
      {av.titulo && (
        <p className="text-sm font-extrabold text-gray-900 mb-3 leading-snug">
          &ldquo;{av.titulo}&rdquo;
        </p>
      )}

      {/* Comentário */}
      <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">
        {av.comentario}
      </p>

      {/* Autor */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm"
          style={{ backgroundColor: av.corAvatar || '#3cbfb3' }}
        >
          {av.avatarInicial || av.nomeCompleto?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-gray-900 leading-none">{av.nomeCompleto}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-none">
            {[av.cargo, av.empresa].filter(Boolean).join(' · ')}
          </p>
          {av.cidade && (
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#3cbfb3' }}>
              {av.cidade}
            </p>
          )}
        </div>
        {av.destaque && (
          <span className="text-[9px] font-extrabold px-2 py-1 rounded-full shrink-0"
            style={{ backgroundColor: '#e8f8f7', color: '#0f2e2b' }}>
            DESTAQUE
          </span>
        )}
      </div>
    </div>
  )
}

export default function SejaRevendedorPage() {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [indice, setIndice] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [form, setForm] = useState({
    nome: '', empresa: '', email: '',
    telefone: '', cidade: '', segmento: '', mensagem: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    fetch('/api/avaliacoes-parceiros')
      .then(r => r.json())
      .then(d => setAvaliacoes(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!autoplay || avaliacoes.length < 2) return
    const id = setInterval(() => setIndice(i => (i + 1) % avaliacoes.length), 5000)
    return () => clearInterval(id)
  }, [autoplay, avaliacoes.length])

  const prev = () => { setAutoplay(false); setIndice(i => (i - 1 + avaliacoes.length) % avaliacoes.length) }
  const next = () => { setAutoplay(false); setIndice(i => (i + 1) % avaliacoes.length) }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tipo: 'parceiro' }),
      })
      setEnviado(true)
    } catch { /* silent */ }
    finally { setEnviando(false) }
  }

  const BENEFICIOS = [
    { icon: TrendingUp, titulo: 'Margem Atrativa', texto: 'Tabela de preços exclusiva para revendedores com comissões competitivas e lucratividade real.', cor: '#3cbfb3' },
    { icon: Package, titulo: 'Portfólio Completo', texto: 'Climatizadores, aspiradores e bikes spinning. Linha diversificada para todos os perfis de cliente.', cor: '#0f2e2b' },
    { icon: Headphones, titulo: 'Suporte Dedicado', texto: 'Gerente de conta exclusivo, treinamentos online e materiais de venda prontos para usar.', cor: '#8b5cf6' },
    { icon: Award, titulo: 'Produto Certificado', texto: '100% originais Sixxis com certificação de qualidade, garantia de 12 meses e índice zero de recall.', cor: '#f59e0b' },
    { icon: Users, titulo: 'Comunidade Sixxis', texto: 'Rede de 200+ parceiros, eventos exclusivos e programa de recompensas anuais para os melhores.', cor: '#16a34a' },
    { icon: Shield, titulo: 'Parceria Transparente', texto: 'Contratos claros, sem letras miúdas. Crescemos juntos — seu sucesso é o nosso sucesso.', cor: '#2563eb' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Seja um Parceiro' }]} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden py-20 sm:py-28"
        style={{ background: 'linear-gradient(135deg, #0a1f1d 0%, #0f2e2b 40%, #1a4f4a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(#3cbfb3 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3cbfb3 0%, transparent 70%)', transform: 'translate(25%, -25%)' }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-8"
            style={{ background: 'radial-gradient(circle, #3cbfb3 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 mb-6 rounded-full px-4 py-2 border"
              style={{ backgroundColor: 'rgba(60,191,179,0.1)', borderColor: 'rgba(60,191,179,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#3cbfb3] animate-pulse" />
              <span className="text-[#3cbfb3] text-xs font-bold tracking-widest uppercase">
                Programa de Parceiros — Sixxis
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
              Cresça com a marca<br />
              <span style={{ color: '#3cbfb3' }}>que o Brasil confia há 30 anos</span>
            </h1>
            <p className="text-white/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              Mais de 200 revendedores em todo o Brasil já faturam mais com a linha Sixxis.
              Produtos que se vendem sozinhos, suporte real e parceria de verdade.
            </p>
            <a href="#formulario"
              className="inline-flex items-center gap-2 font-extrabold text-[#0f2e2b] px-7 py-4 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[0.98] text-sm"
              style={{ backgroundColor: '#3cbfb3', boxShadow: '0 6px 24px rgba(60,191,179,0.45)' }}>
              Quero ser parceiro
              <ArrowRight size={16} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ─── NÚMEROS ─── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { num: '200+', label: 'Parceiros ativos', cor: '#3cbfb3' },
              { num: '30+', label: 'Anos no mercado', cor: '#0f2e2b' },
              { num: '1M+', label: 'Clientes atendidos', cor: '#8b5cf6' },
              { num: '12m', label: 'Garantia total', cor: '#16a34a' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}
                className="text-center p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <p className="text-3xl sm:text-4xl font-black mb-1 leading-none" style={{ color: s.cor }}>{s.num}</p>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFÍCIOS ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-12">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Por que ser parceiro</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              Vantagens reais para o seu negócio
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFICIOS.map((b, i) => {
              const Icon = b.icon
              return (
                <Reveal key={b.titulo} delay={i * 60}
                  className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: b.cor + '15' }}>
                    <Icon size={18} style={{ color: b.cor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 mb-1">{b.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{b.texto}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── DEPOIMENTOS ─── */}
      {avaliacoes.length > 0 && (
        <section className="py-20 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0f2e2b 0%, #1a4f4a 60%, #0d2826 100%)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-12">
              <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Depoimentos</span>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-2">
                Quem já é parceiro, recomenda
              </h2>
              <p className="text-white/50 text-sm">Histórias reais de parceiros que construíram negócios sólidos com a Sixxis</p>
            </Reveal>

            {/* Carrossel */}
            <div className="relative">
              <div className="relative overflow-hidden" style={{ minHeight: '280px' }}>
                {avaliacoes.map((av, i) => (
                  <div key={av.id || i}
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      opacity: i === indice ? 1 : 0,
                      transform: i === indice ? 'translateX(0) scale(1)' : `translateX(${i > indice ? 40 : -40}px) scale(0.97)`,
                      pointerEvents: i === indice ? 'auto' : 'none',
                      zIndex: i === indice ? 1 : 0,
                    }}>
                    <CardDepoimento av={av} />
                  </div>
                ))}
              </div>

              {/* Controles */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={prev} aria-label="Anterior"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-2 items-center">
                  {avaliacoes.map((_, i) => (
                    <button key={i} aria-label={`Depoimento ${i+1}`}
                      onClick={() => { setAutoplay(false); setIndice(i) }}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === indice ? '20px' : '6px',
                        height: '6px',
                        backgroundColor: i === indice ? '#3cbfb3' : 'rgba(255,255,255,0.25)',
                      }} />
                  ))}
                </div>
                <button onClick={next} aria-label="Próximo"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── COMO FUNCIONA ─── */}
      <section className="py-20 bg-gray-50/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-12">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Processo</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Como funciona a parceria</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '01', titulo: 'Cadastre-se', texto: 'Preencha o formulário abaixo. Leva menos de 2 minutos.', cor: '#3cbfb3' },
              { n: '02', titulo: 'Análise', texto: 'Nossa equipe avalia e entra em contato em até 24h.', cor: '#8b5cf6' },
              { n: '03', titulo: 'Ativação', texto: 'Você recebe acesso à tabela de preços e materiais.', cor: '#f59e0b' },
              { n: '04', titulo: 'Venda', texto: 'Comece a vender e faturar com suporte completo.', cor: '#16a34a' },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 80} className="relative">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-extrabold text-sm"
                    style={{ backgroundColor: step.cor }}>
                    {step.n}
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-1">{step.titulo}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.texto}</p>
                </div>
                {i < 3 && (
                  <div className="hidden sm:block absolute top-1/2 -right-2 z-10"
                    style={{ transform: 'translateY(-50%)' }}>
                    <ArrowRight size={16} className="text-gray-300" />
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FORMULÁRIO ─── */}
      <section id="formulario" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Cadastro</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Quero ser parceiro Sixxis</h2>
            <p className="text-gray-500 text-sm mt-2">Nossa equipe entra em contato em até 24 horas.</p>
          </Reveal>

          {enviado ? (
            <Reveal className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Cadastro recebido!</h3>
              <p className="text-gray-500 text-sm">Nossa equipe comercial entrará em contato em até 24 horas úteis.</p>
            </Reveal>
          ) : (
            <Reveal className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <form onSubmit={enviar} className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { k: 'nome',     l: 'Nome completo',       ph: 'Seu nome',                       req: true, full: true },
                    { k: 'empresa',  l: 'Empresa',             ph: 'Nome da empresa ou "Autônomo"' },
                    { k: 'email',    l: 'E-mail',              ph: 'seu@email.com',                  req: true, type: 'email' },
                    { k: 'telefone', l: 'WhatsApp',            ph: '(00) 00000-0000',                req: true },
                    { k: 'cidade',   l: 'Cidade / Estado',     ph: 'Ex: São Paulo - SP' },
                    { k: 'segmento', l: 'Segmento',            ph: 'Ex: Varejo, Distribuidora...' },
                  ].map(f => (
                    <div key={f.k} className={(f as any).full ? 'sm:col-span-2' : ''}>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        {f.l}{f.req && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
                      <input
                        type={f.type || 'text'}
                        required={f.req}
                        placeholder={f.ph}
                        value={form[f.k as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                        className="w-full border border-gray-200 focus:border-[#3cbfb3] focus:ring-1 focus:ring-[#3cbfb3]/25 rounded-xl px-4 py-3 text-sm outline-none transition bg-white"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                      Mensagem (opcional)
                    </label>
                    <textarea
                      value={form.mensagem}
                      onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))}
                      placeholder="Conte um pouco sobre seu negócio..."
                      rows={3}
                      className="w-full border border-gray-200 focus:border-[#3cbfb3] focus:ring-1 focus:ring-[#3cbfb3]/25 rounded-xl px-4 py-3 text-sm outline-none resize-none bg-white"
                    />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <button type="submit" disabled={enviando}
                    className="w-full flex items-center justify-center gap-2 font-extrabold text-white py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 text-sm"
                    style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 16px rgba(60,191,179,0.35)' }}>
                    {enviando ? 'Enviando...' : <><span>Enviar cadastro</span><ArrowRight size={15} /></>}
                  </button>
                  <p className="text-center text-[10px] text-gray-400">
                    Sem taxa de adesão · Aprovação em até 24h · Dados protegidos pela LGPD
                  </p>
                </div>
              </form>
            </Reveal>
          )}
        </div>
      </section>

      {/* ─── CONTATO RÁPIDO ─── */}
      <section className="py-12 border-t border-gray-100 bg-gray-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Phone, titulo: 'WhatsApp Comercial', sub: '(18) 99747-4701', href: 'https://wa.me/5518997474701', cor: '#25D366' },
              { icon: Mail, titulo: 'E-mail', sub: 'brasil.sixxis@gmail.com', href: 'mailto:brasil.sixxis@gmail.com', cor: '#3cbfb3' },
              { icon: MapPin, titulo: 'Araçatuba, SP', sub: 'R. Anhanguera, 1711', href: '#', cor: '#8b5cf6' },
            ].map(item => {
              const Icon = item.icon
              return (
                <a key={item.titulo} href={item.href}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.cor + '15' }}>
                    <Icon size={16} style={{ color: item.cor }} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900">{item.titulo}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
