'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  CheckCircle, Star, TrendingUp, Users, Package,
  Headphones, Award, ChevronLeft, ChevronRight,
  ArrowRight, Quote,
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
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvaliacaoParceiro {
  id:           string
  nomeCompleto: string
  empresa?:     string
  cargo?:       string
  cidade?:      string
  nota:         number
  titulo:       string
  comentario:   string
  avatarInicial?: string
  corAvatar:    string
  aprovada:     boolean
  destaque:     boolean
  ordem:        number
}

// ─── Card de avaliação ────────────────────────────────────────────────────────

function CardAvaliacao({ av }: { av: AvaliacaoParceiro }) {
  return (
    <div className="bg-white rounded-3xl p-7 shadow-xl border border-gray-100 relative overflow-hidden h-full flex flex-col">
      {/* Aspas decorativas */}
      <Quote size={72} className="absolute top-3 right-4 text-[#3cbfb3]" style={{ opacity: 0.07 }} />

      {/* Estrelas */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={15}
            className={i <= av.nota ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'} />
        ))}
      </div>

      {/* Título */}
      <p className="text-base font-extrabold text-gray-900 mb-3 leading-snug">
        &ldquo;{av.titulo}&rdquo;
      </p>

      {/* Comentário */}
      <p className="text-sm text-gray-600 leading-relaxed flex-1 italic">
        {av.comentario}
      </p>

      {/* Autor */}
      <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-50">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-md"
          style={{ backgroundColor: av.corAvatar || '#3cbfb3' }}
        >
          {av.avatarInicial || av.nomeCompleto?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-gray-900 truncate">{av.nomeCompleto}</p>
          <p className="text-xs text-gray-500 truncate">
            {av.cargo}{av.empresa ? ` · ${av.empresa}` : ''}
          </p>
          {av.cidade && (
            <p className="text-[10px] text-[#3cbfb3] font-semibold mt-0.5">{av.cidade}</p>
          )}
        </div>
        {av.destaque && (
          <span className="text-[9px] font-black px-2 py-1 rounded-full bg-[#e8f8f7] text-[#0f2e2b] uppercase tracking-wider shrink-0">
            Destaque
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Formulário ───────────────────────────────────────────────────────────────

interface FormState {
  nome:      string
  empresa:   string
  email:     string
  telefone:  string
  cidade:    string
  segmento:  string
  mensagem:  string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SejaRevendedorPage() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoParceiro[]>([])
  const [indice, setIndice]         = useState(0)
  const [autoplay, setAutoplay]     = useState(true)

  const [form, setForm] = useState<FormState>({
    nome: '', empresa: '', email: '', telefone: '',
    cidade: '', segmento: '', mensagem: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')

  useEffect(() => {
    fetch('/api/avaliacoes-parceiros')
      .then(r => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d)) setAvaliacoes(d)
      })
      .catch(() => {})
  }, [])

  // Autoplay
  useEffect(() => {
    if (!autoplay || avaliacoes.length < 2) return
    const id = setInterval(() => {
      setIndice(i => (i + 1) % avaliacoes.length)
    }, 5500)
    return () => clearInterval(id)
  }, [autoplay, avaliacoes.length])

  const prev = useCallback(() => {
    setAutoplay(false)
    setIndice(i => (i - 1 + avaliacoes.length) % avaliacoes.length)
  }, [avaliacoes.length])

  const next = useCallback(() => {
    setAutoplay(false)
    setIndice(i => (i + 1) % avaliacoes.length)
  }, [avaliacoes.length])

  const handleChange = (k: keyof FormState, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setErroEnvio('')
    try {
      await fetch('/api/contato', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, tipo: 'parceiro' }),
      })
      setEnviado(true)
    } catch {
      setErroEnvio('Erro ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const beneficios = [
    { icon: Package,    titulo: 'Linha Completa',    texto: 'Climatizadores, aspiradores e bikes spinning. Portfolio diversificado para atender todos os perfis de cliente.', cor: '#3cbfb3' },
    { icon: TrendingUp, titulo: 'Margem Atrativa',   texto: 'Comissões competitivas e estrutura de preço que garante lucratividade real para o seu negócio.',                cor: '#0f2e2b' },
    { icon: Headphones, titulo: 'Suporte Dedicado',  texto: 'Gerente de conta exclusivo, materiais de venda e treinamentos para sua equipe.',                                 cor: '#8b5cf6' },
    { icon: Award,      titulo: 'Produto Premiado',   texto: 'Certificação de qualidade, garantia real de 12 meses e índice zero de recall.',                                  cor: '#f59e0b' },
    { icon: Users,      titulo: 'Comunidade Sixxis', texto: 'Acesso à rede de parceiros, eventos exclusivos e programa de recompensas anuais.',                               cor: '#16a34a' },
    { icon: CheckCircle,titulo: 'Parceria de Verdade',texto: 'Contratos transparentes, sem letras miúdas. Crescemos quando você cresce.',                                     cor: '#2563eb' },
  ]

  const numeros = [
    { num: '200+', label: 'Parceiros ativos',       cor: '#3cbfb3' },
    { num: '30+',  label: 'Anos no mercado',         cor: '#0f2e2b' },
    { num: '1M+',  label: 'Clientes atendidos',      cor: '#8b5cf6' },
    { num: '12m',  label: 'Garantia nos produtos',   cor: '#16a34a' },
  ]

  const campos: {
    key:       keyof FormState
    label:     string
    placeholder?: string
    required?: boolean
    type?:     string
    col2?:     boolean
  }[] = [
    { key: 'nome',     label: 'Nome completo',         placeholder: 'Seu nome',            required: true, col2: true },
    { key: 'empresa',  label: 'Empresa / CNPJ',        placeholder: 'Nome da empresa' },
    { key: 'email',    label: 'E-mail',                placeholder: 'seu@email.com',       required: true, type: 'email' },
    { key: 'telefone', label: 'Telefone / WhatsApp',   placeholder: '(11) 99999-9999',     required: true },
    { key: 'cidade',   label: 'Cidade / Estado',       placeholder: 'São Paulo - SP' },
    { key: 'segmento', label: 'Segmento',              placeholder: 'Ex: Varejo, Distribuidora...' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={[
        { label: 'Início', href: '/' },
        { label: 'Seja um Parceiro' },
      ]} />

      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 sm:py-28"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 60%, #0f2e2b 100%)' }}
      >
        {/* Decoração */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(60,191,179,0.15), transparent)', transform: 'translate(20%, -20%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(#3cbfb3 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#3cbfb3]/15 border border-[#3cbfb3]/30 rounded-full px-4 py-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3cbfb3] animate-pulse" />
            <span className="text-[#3cbfb3] text-xs font-bold tracking-widest uppercase">
              Programa de Parceiros Sixxis
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Cresça com a marca<br />
            <span style={{ color: '#3cbfb3' }}>que o Brasil confia</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Há mais de 30 anos formando parcerias sólidas. Revenda produtos Sixxis
            e aumente o faturamento do seu negócio com uma linha que se vende sozinha.
          </p>
          <a
            href="#formulario"
            className="inline-flex items-center gap-2 font-extrabold text-[#0f2e2b] px-7 py-4 rounded-2xl transition hover:-translate-y-0.5 text-sm"
            style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 20px rgba(60,191,179,0.4)' }}
          >
            Quero ser parceiro
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* ─── NÚMEROS ──────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {numeros.map((s, i) => (
              <RevealCard key={s.label} delay={i * 80}
                className="text-center p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-3xl font-extrabold mb-1" style={{ color: s.cor }}>{s.num}</p>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFÍCIOS ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <RevealCard className="text-center mb-12">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Vantagens</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Por que ser parceiro Sixxis?</h2>
          </RevealCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beneficios.map((item, i) => {
              const Icon = item.icon
              return (
                <RevealCard key={item.titulo} delay={i * 60}
                  className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: item.cor + '18' }}>
                    <Icon size={18} style={{ color: item.cor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 mb-1">{item.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.texto}</p>
                  </div>
                </RevealCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── AVALIAÇÕES DE PARCEIROS ───────────────────────────────────────────── */}
      {avaliacoes.length > 0 && (
        <section
          className="py-20"
          style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <RevealCard className="text-center mb-10">
              <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Depoimentos</span>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-2">
                Quem já é parceiro, recomenda
              </h2>
              <p className="text-white/55 text-sm">
                Histórias reais de quem construiu negócios sólidos com a Sixxis
              </p>
            </RevealCard>

            {/* Carrossel */}
            <div className="relative">
              {/* Container de altura fixa para evitar layout shift */}
              <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
                {avaliacoes.map((av, i) => (
                  <div
                    key={av.id}
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      opacity:       i === indice ? 1 : 0,
                      transform:     i === indice ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.98)',
                      pointerEvents: i === indice ? 'auto' : 'none',
                      zIndex:        i === indice ? 1 : 0,
                    }}
                  >
                    <CardAvaliacao av={av} />
                  </div>
                ))}
              </div>

              {/* Controles */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={prev}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex gap-2">
                  {avaliacoes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setAutoplay(false); setIndice(i) }}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width:           i === indice ? 24 : 8,
                        height:          8,
                        backgroundColor: i === indice ? '#3cbfb3' : 'rgba(255,255,255,0.3)',
                      }}
                      aria-label={`Ir para depoimento ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                  aria-label="Próximo"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Contador */}
              <p className="text-center text-white/30 text-xs mt-3">
                {indice + 1} / {avaliacoes.length}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── FORMULÁRIO ───────────────────────────────────────────────────────── */}
      <section id="formulario" className="py-20 bg-gray-50/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <RevealCard className="text-center mb-10">
            <span className="text-[#3cbfb3] text-sm font-extrabold uppercase tracking-widest">Cadastro</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Quero ser parceiro Sixxis</h2>
            <p className="text-gray-500 text-sm mt-2">
              Preencha o formulário e nossa equipe entrará em contato em até 24 horas.
            </p>
          </RevealCard>

          {enviado ? (
            <RevealCard className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Cadastro recebido!</h3>
              <p className="text-gray-500 text-sm mb-4">
                Nossa equipe entrará em contato em até 24 horas.
              </p>
              <Link href="/"
                className="text-[#3cbfb3] text-sm font-bold hover:underline">
                Voltar ao início
              </Link>
            </RevealCard>
          ) : (
            <RevealCard className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <form onSubmit={enviar} className="p-6 sm:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {campos.map(f => (
                    <div key={f.key} className={f.col2 ? 'sm:col-span-2' : ''}>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                        {f.label}
                        {f.required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
                      <input
                        type={f.type || 'text'}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={form[f.key]}
                        onChange={e => handleChange(f.key, e.target.value)}
                        className="w-full border border-gray-200 focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 rounded-xl px-4 py-3 text-sm outline-none transition bg-white"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Mensagem (opcional)
                    </label>
                    <textarea
                      placeholder="Conte um pouco sobre seu negócio..."
                      value={form.mensagem}
                      onChange={e => handleChange('mensagem', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 rounded-xl px-4 py-3 text-sm outline-none transition resize-none bg-white"
                    />
                  </div>
                </div>

                {erroEnvio && (
                  <p className="text-sm text-red-500 text-center">{erroEnvio}</p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full flex items-center justify-center gap-2 font-extrabold text-white py-4 rounded-2xl transition-all disabled:opacity-60 text-sm active:scale-[0.98]"
                  style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 16px rgba(60,191,179,0.35)' }}
                >
                  {enviando ? 'Enviando...' : (
                    <>
                      Enviar cadastro
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </RevealCard>
          )}
        </div>
      </section>
    </div>
  )
}
