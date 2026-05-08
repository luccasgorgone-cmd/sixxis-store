'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  Shield, CheckCircle, X, Phone, Mail,
  Package, FileText, Clock,
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
          <p className="text-white/60 text-sm leading-relaxed max-w-xl mx-auto">
            Produtos de qualidade com suporte técnico especializado.
            Sua compra protegida por <strong className="text-white/90">12 meses de garantia total</strong>,
            em conformidade com o CDC — Lei nº 8.078/1990.
          </p>
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

      {/* ─── O que está incluso ─── */}
      <section className="py-14 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <span className="text-[#3cbfb3] text-xs font-extrabold uppercase tracking-widest">O que está incluso</span>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Sua garantia Sixxis cobre</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
              Proteção integral por 12 meses, sem letras miúdas. Veja o que entra na cobertura padrão de toda a linha:
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Defeitos de fabricação (motor, peças internas, eletrônica)',
                'Desgaste prematuro de componentes oficiais',
                'Falhas em até 12 meses do recebimento',
                'Mão de obra de reparo gratuita',
                'Logística reversa (envio + retorno) gratuita',
              ].map(item => (
                <div key={item}
                  className="flex items-start gap-2.5 bg-white rounded-xl px-4 py-3 border border-[#3cbfb3]/20">
                  <CheckCircle size={14} className="text-[#3cbfb3] shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="mt-5">
            <div className="bg-[#e8f8f7] border border-[#3cbfb3]/25 rounded-2xl px-5 py-3.5 text-center">
              <p className="text-xs text-[#0f2e2b] font-semibold">
                A garantia legal do CDC (90 dias para produtos duráveis) é
                <strong> adicional</strong> à garantia contratual Sixxis.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Garantia estendida (em breve) ─── */}
      <section className="py-12 bg-gray-50/40 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#3cbfb3]/15 border border-[#3cbfb3]/25 flex items-center justify-center">
                <Clock size={20} className="text-[#3cbfb3]" />
              </div>
              <div className="flex-1">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#3cbfb3] mb-1">
                  Em breve
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">
                  Garantia Estendida
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Quer mais tranquilidade? Em breve, nossa garantia estendida estará disponível
                  para até 24 meses adicionais.{' '}
                  <Link href="/?ref=newsletter-garantia" className="text-[#3cbfb3] hover:underline font-medium">
                    Cadastre-se na newsletter
                  </Link>{' '}
                  para ser avisado quando lançarmos.
                </p>
              </div>
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
