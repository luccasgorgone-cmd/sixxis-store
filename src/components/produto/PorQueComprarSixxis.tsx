'use client'

import { useRef, useState, useEffect } from 'react'

const RAZOES = [
  { num: '01', titulo: '30 anos de mercado', desc: 'Fundada em 1993 em Araçatuba-SP, a Sixxis tem mais de 1 milhão de clientes atendidos. Não é promessa — é história comprovada.', cor: '#3cbfb3', bg: '#e8f8f7' },
  { num: '02', titulo: 'Garantia real de 12 meses', desc: 'Sem letras miúdas. Se qualquer problema ocorrer dentro da garantia, resolvemos. Temos assistência técnica própria em Araçatuba.', cor: '#10b981', bg: '#f0fff8' },
  { num: '03', titulo: 'Plug & play: sem instalação', desc: 'Sem furos, sem obra, sem técnico. Liga na tomada e está pronto para usar. Muda de ambiente quando quiser.', cor: '#3b82f6', bg: '#eff6ff' },
  { num: '04', titulo: 'Economia real na conta de luz', desc: 'Um climatizador Sixxis consome entre 80% e 87% menos energia que um ar-condicionado equivalente. O produto se paga com a própria economia.', cor: '#f59e0b', bg: '#fffbeb' },
  { num: '05', titulo: 'Ar mais saudável', desc: 'Ao contrário do ar-condicionado que resseca, o climatizador evaporativo umidifica o ar — ideal para pele, garganta e vias respiratórias.', cor: '#8b5cf6', bg: '#faf5ff' },
  { num: '06', titulo: 'Entrega rastreada para todo o Brasil', desc: 'Frete grátis para compras acima de R$ 500. Seu pedido sai com código de rastreamento e você acompanha cada etapa.', cor: '#0f2e2b', bg: '#f8fafc' },
]

export function PorQueComprarSixxis() {
  const [ativo, setAtivo] = useState(0)
  const [visivel, setVisivel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisivel(true); obs.disconnect() } },
      { threshold: 0.10 },
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="mt-12 mb-8 transition-all duration-700"
      style={{ opacity: visivel ? 1 : 0, transform: visivel ? 'translateY(0)' : 'translateY(24px)' }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <h2 className="text-xl font-black text-gray-900 whitespace-nowrap px-2">
          Por que comprar na Sixxis?
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RAZOES.map((r, i) => (
          <button
            key={i}
            onClick={() => setAtivo(ativo === i ? -1 : i)}
            className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md ${
              ativo === i ? 'shadow-md scale-[1.01]' : 'border-gray-100 hover:border-gray-200'
            }`}
            style={ativo === i ? { backgroundColor: r.bg, borderColor: r.cor + '55' } : { backgroundColor: 'white' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-black mt-0.5 shrink-0 leading-none" style={{ color: r.cor }}>
                {r.num}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black leading-tight transition-colors ${ativo === i ? 'text-gray-900' : 'text-gray-700'}`}>
                  {r.titulo}
                </p>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: ativo === i ? '120px' : '0px', opacity: ativo === i ? 1 : 0, marginTop: ativo === i ? 6 : 0 }}
                >
                  <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={r.cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0 mt-0.5 transition-transform duration-300"
                style={{ transform: ativo === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#e8f8f7' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3cbfb3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-gray-900">Dúvidas? Fale com nossa equipe</p>
            <p className="text-xs text-gray-500 mt-0.5">
              WhatsApp <strong>(18) 99747-4701</strong> · Seg–Sex 8h–18h · Sáb 8h–12h
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
