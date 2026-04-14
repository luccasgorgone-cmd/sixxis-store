'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  Shield, CheckCircle, X, Phone, Mail,
  Package, Wind, Bike, Sparkles, ArrowRight, FileText
} from 'lucide-react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible: v }
}
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(20px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>{children}</div>
  )
}

export default function GarantiaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Garantia' }]} />

      {/* ─── Hero ─── */}
      <section className="py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#3cbfb3 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-[#3cbfb3]/15 border border-[#3cbfb3]/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Shield size={28} className="text-[#3cbfb3]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Termo de Garantia Sixxis
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xl mx-auto mb-5">
            Produtos de qualidade com suporte técnico especializado.
            Sua compra protegida por <strong className="text-white/90">12 meses de garantia total</strong>,
            em conformidade com o CDC — Lei nº 8.078/1990.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-white/70 text-xs">Válido para compras na loja oficial a partir de Jan/2025</span>
          </div>
        </div>
      </section>

      {/* ─── Prazos por produto ─── */}
      <section className="py-14 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Cobertura</span>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Prazos de garantia por produto</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Wind,     titulo: 'Climatizadores', prazo: '12 meses', cor: '#3cbfb3',
                cobre: ['Motor e compressor', 'Painel eletrônico', 'Estrutura e corpo', 'Acessórios originais'],
                nao:   ['Filtros e consumíveis', 'Danos por mau uso'],
              },
              {
                icon: Sparkles, titulo: 'Aspiradores',    prazo: '12 meses', cor: '#8b5cf6',
                cobre: ['Motor principal', 'Corpo do aspirador', 'Mangueiras originais', 'Acessórios inclusos'],
                nao:   ['Sacos descartáveis', 'Filtros de uso'],
              },
              {
                icon: Bike,     titulo: 'Bikes Spinning', prazo: '12 meses', cor: '#f59e0b',
                cobre: ['Estrutura metálica', 'Sistema de freio', 'Guidão e selim', 'Pedais originais'],
                nao:   ['Desgaste de correia', 'Partes móveis por uso'],
              },
            ].map((p, i) => {
              const Icon = p.icon
              return (
                <Reveal key={p.titulo} delay={i * 80}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="p-5 border-b border-gray-50"
                    style={{ background: `linear-gradient(135deg, ${p.cor}08, transparent)` }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: p.cor + '18' }}>
                      <Icon size={20} style={{ color: p.cor }} />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900">{p.titulo}</h3>
                    <div className="inline-flex items-center gap-1.5 mt-1.5">
                      <Shield size={11} style={{ color: p.cor }} />
                      <span className="text-xs font-extrabold" style={{ color: p.cor }}>{p.prazo}</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-1.5">
                    <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">Coberto:</p>
                    {p.cobre.map(c => (
                      <div key={c} className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle size={11} className="text-green-500 shrink-0" /> {c}
                      </div>
                    ))}
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mt-3 mb-1">Não coberto:</p>
                    {p.nao.map(n => (
                      <div key={n} className="flex items-center gap-2 text-xs text-gray-400">
                        <X size={11} className="text-red-400 shrink-0" /> {n}
                      </div>
                    ))}
                  </div>
                </Reveal>
              )
            })}
          </div>
          <Reveal className="mt-4">
            <div className="bg-[#e8f8f7] border border-[#3cbfb3]/25 rounded-2xl px-5 py-3.5 text-center">
              <p className="text-xs text-[#0f2e2b] font-semibold">
                A garantia legal do CDC (90 dias para produtos duráveis) é
                <strong> adicional</strong> à garantia contratual Sixxis.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Como acionar ─── */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">Processo</span>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Como acionar a garantia</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { n: '01', titulo: 'Entre em contato', texto: 'Envie e-mail com nº do pedido, descrição do problema e fotos/vídeo do defeito.', cor: '#3cbfb3' },
              { n: '02', titulo: 'Análise técnica',   texto: 'Nossa equipe avalia o chamado em até 2 dias úteis e confirma se está coberto.',    cor: '#8b5cf6' },
              { n: '03', titulo: 'Logística reversa', texto: 'Aprovada a garantia, enviamos etiqueta de devolução gratuita para você.',           cor: '#f59e0b' },
              { n: '04', titulo: 'Reparo ou troca',   texto: 'Produto reparado ou substituído em até 30 dias. Você será notificado em cada etapa.', cor: '#16a34a' },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 80}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-extrabold text-sm"
                  style={{ backgroundColor: step.cor }}>
                  {step.n}
                </div>
                <h3 className="text-sm font-extrabold text-gray-900 mb-2">{step.titulo}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.texto}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-5">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <FileText size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Importante:</strong> Guarde sempre sua nota fiscal.
                Ela é obrigatória para o acionamento da garantia.
                O prazo deve ser solicitado dentro do período vigente.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Não coberto ─── */}
      <section className="py-12 bg-gray-50/40 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Situações não cobertas</h2>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Danos por mau uso, acidentes ou impactos físicos',
                'Desgaste natural por uso prolongado',
                'Modificações por terceiros não autorizados',
                'Danos por tensão elétrica incorreta ou surtos',
                'Danos por agentes externos (umidade, corrosão)',
                'Produtos sem nota fiscal ou número de série adulterado',
                'Produtos fora do prazo de garantia',
                'Reparos em assistências não autorizadas',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">
                  <X size={13} className="text-red-400 shrink-0" />
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA contato ─── */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #0f2e2b, #1a4f4a)' }}>
            <div className="w-12 h-12 bg-[#3cbfb3]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Phone size={20} className="text-[#3cbfb3]" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Precisa acionar a garantia?</h3>
            <p className="text-white/55 text-sm mb-6">
              Nossa equipe técnica está pronta para ajudar.
              Resposta em até 2 dias úteis.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="mailto:brasil.sixxis@gmail.com"
                className="inline-flex items-center gap-2 bg-[#3cbfb3] text-white font-bold px-5 py-3 rounded-xl transition hover:bg-[#2a9d8f] text-sm">
                <Mail size={14} /> brasil.sixxis@gmail.com
              </a>
              <Link href="/pedidos"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-5 py-3 rounded-xl hover:bg-white/10 transition text-sm">
                <Package size={14} /> Ver meus pedidos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
