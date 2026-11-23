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
    <div className="mt-16 border-t border-[#2A3937] pt-2">
      {/* Header das abas */}
      <div className="border-b border-[#2A3937] mb-8">
        <div className="flex gap-0 overflow-x-auto">
          {abas.map(a => (
            <button
              key={a}
              onClick={() => handleSetAba(a)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                aba === a
                  ? 'border-[#00cfb5] text-[#00cfb5]'
                  : 'border-transparent text-[#B0BFBC] hover:text-[#D7E0DD]'
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
                className="prose prose-sm max-w-none text-[#D7E0DD] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: descricao }}
              />
            ) : (
              <p className="text-[#B0BFBC] text-sm">Descrição não disponível.</p>
            )}
          </div>
        )}

        {/* ABA: Especificações */}
        {aba === 'Especificações' && especificacoes && especificacoes.length > 0 && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-extrabold text-[#F4F7F6] mb-4">Especificações Técnicas</h3>
            <div className="rounded-2xl border border-[#2A3937] overflow-hidden">
              {especificacoes.map(({ label, valor }, i) => (
                <AnimatedCard
                  key={label}
                  className={`flex items-start gap-4 px-5 py-3.5 ${i % 2 === 0 ? 'bg-[#111717]' : 'bg-[#192221]'}`}
                >
                  <span className="text-sm text-[#B0BFBC] w-48 shrink-0 font-medium">{label}</span>
                  <span className="text-sm text-[#F4F7F6] font-semibold">{valor}</span>
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
                className="border border-[#2A3937] rounded-2xl overflow-hidden hover:border-[#00cfb5]/30 transition"
              >
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left bg-[#111717] hover:bg-[#192221] transition"
                >
                  <span className="font-semibold text-[#F4F7F6] text-sm pr-4">{faq.pergunta}</span>
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      faqAberto === i
                        ? 'border-[#00cfb5] bg-[#00cfb5] rotate-180'
                        : 'border-[#2A3937] bg-[#111717]'
                    }`}
                  >
                    <ChevronDown size={14} className={faqAberto === i ? 'text-white' : 'text-[#8a9794]'} />
                  </div>
                </button>
                {faqAberto === i && (
                  <div className="px-6 py-4 bg-[#f8fffe] border-t border-[#00cfb5]/15">
                    <p className="text-[#B0BFBC] text-sm leading-relaxed">{faq.resposta}</p>
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
