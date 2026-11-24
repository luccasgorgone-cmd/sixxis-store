'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import AvaliacoesProduto from '@/components/produto/AvaliacoesProduto'

interface EspecificacaoRow { label: string; valor: string }
interface FaqRow { pergunta: string; resposta: string }

interface Props {
  descricao: string | null
  produtoId: string
  especificacoes?: EspecificacaoRow[]
  faqs?: FaqRow[]
  hideDescricao?: boolean
}

function AnimatedCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {children}
    </div>
  )
}

export default function AbasProduto({ descricao, produtoId, especificacoes, faqs, hideDescricao }: Props) {
  const abas = [
    ...(hideDescricao ? [] : ['Descrição']),
    ...(especificacoes && especificacoes.length > 0 ? ['Especificações'] : []),
    ...(faqs && faqs.length > 0 ? ['Perguntas Frequentes'] : []),
    'Avaliações',
  ]

  const defaultAba = hideDescricao
    ? (faqs && faqs.length > 0 ? 'Perguntas Frequentes' : 'Avaliações')
    : 'Descrição'

  const [aba, setAba] = useState(defaultAba)
  const [abaKey, setAbaKey] = useState(0)
  const [faqAberto, setFaqAberto] = useState<number | null>(null)

  function handleSetAba(a: string) {
    setAba(a)
    setAbaKey(k => k + 1)
    setFaqAberto(null)
  }

  return (
    <div className="mt-16 border-t border-sx-line pt-2">
      {/* Header das abas */}
      <div className="border-b border-sx-line mb-8">
        <div className="flex gap-0 overflow-x-auto">
          {abas.map(a => (
            <button
              key={a}
              onClick={() => handleSetAba(a)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                aba === a
                  ? 'border-sx-accent text-sx-accent-text'
                  : 'border-transparent text-sx-muted hover:text-sx-text-2'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da aba com fade */}
      <div key={abaKey} className="animate-fade-in-up">

        {/* ABA: Descrição */}
        {aba === 'Descrição' && (
          <div className="max-w-3xl">
            {descricao ? (
              <div
                className="prose prose-sm max-w-none text-sx-text-2 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: descricao }}
              />
            ) : (
              <p className="text-sx-muted text-sm">Descrição não disponível.</p>
            )}
          </div>
        )}

        {/* ABA: Especificações */}
        {aba === 'Especificações' && especificacoes && especificacoes.length > 0 && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-extrabold text-sx-text mb-4">Especificações Técnicas</h3>
            <div className="rounded-2xl border border-sx-line overflow-hidden">
              {especificacoes.map(({ label, valor }, i) => (
                <AnimatedCard
                  key={label}
                  className={`flex items-start gap-4 px-5 py-3.5 ${i % 2 === 0 ? 'bg-sx-surface' : 'bg-sx-raised'}`}
                >
                  <span className="text-sm text-sx-muted w-48 shrink-0 font-medium">{label}</span>
                  <span className="text-sm text-sx-text font-semibold">{valor}</span>
                </AnimatedCard>
              ))}
            </div>
          </div>
        )}

        {/* ABA: Perguntas Frequentes */}
        {aba === 'Perguntas Frequentes' && faqs && faqs.length > 0 && (
          <div className="max-w-2xl space-y-3">
            {faqs.map((faq, i) => (
              <AnimatedCard
                key={i}
                className="border border-sx-line rounded-2xl overflow-hidden hover:border-sx-accent/30 transition"
              >
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left bg-sx-surface hover:bg-sx-raised transition"
                >
                  <span className="font-semibold text-sx-text text-sm pr-4">{faq.pergunta}</span>
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      faqAberto === i
                        ? 'border-sx-accent bg-sx-accent rotate-180'
                        : 'border-sx-line bg-sx-surface'
                    }`}
                  >
                    <ChevronDown size={14} className={faqAberto === i ? 'text-white' : 'text-sx-subtle'} />
                  </div>
                </button>
                {faqAberto === i && (
                  <div className="px-6 py-4 bg-sx-raised border-t border-sx-accent/15">
                    <p className="text-sx-muted text-sm leading-relaxed">{faq.resposta}</p>
                  </div>
                )}
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* ABA: Avaliações */}
        {aba === 'Avaliações' && (
          <AvaliacoesProduto produtoId={produtoId} />
        )}

      </div>
    </div>
  )
}
