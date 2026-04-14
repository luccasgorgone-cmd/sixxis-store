'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import AvaliacoesProduto from '@/components/produto/AvaliacoesProduto'

interface EspecificacaoRow { label: string; valor: string }
interface FaqRow { pergunta: string; resposta: string }

interface Props {
  descricao: string | null
  produtoId: string
  especificacoes?: EspecificacaoRow[]
  faqs?: FaqRow[]
}

const ABAS_BASE = ['Descrição', 'Avaliações']

export default function AbasProduto({ descricao, produtoId, especificacoes, faqs }: Props) {
  const abas = [
    'Descrição',
    ...(especificacoes && especificacoes.length > 0 ? ['Especificações'] : []),
    ...(faqs && faqs.length > 0 ? ['Perguntas Frequentes'] : []),
    'Avaliações',
  ]

  const [aba, setAba] = useState('Descrição')
  const [faqAberto, setFaqAberto] = useState<number | null>(null)

  return (
    <div className="mt-16 border-t border-gray-100 pt-2">
      {/* Header das abas */}
      <div className="border-b border-gray-100 mb-8">
        <div className="flex gap-0 overflow-x-auto">
          {abas.map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                aba === a
                  ? 'border-[#3cbfb3] text-[#3cbfb3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* ABA: Descrição */}
      {aba === 'Descrição' && (
        <div className="max-w-3xl">
          {descricao ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: descricao }}
            />
          ) : (
            <p className="text-gray-500 text-sm">Descrição não disponível.</p>
          )}
        </div>
      )}

      {/* ABA: Especificações */}
      {aba === 'Especificações' && especificacoes && especificacoes.length > 0 && (
        <div className="max-w-2xl">
          <h3 className="text-lg font-extrabold text-gray-900 mb-4">Especificações Técnicas</h3>
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            {especificacoes.map(({ label, valor }, i) => (
              <div
                key={label}
                className={`flex items-start gap-4 px-5 py-3.5 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <span className="text-sm text-gray-500 w-48 shrink-0 font-medium">{label}</span>
                <span className="text-sm text-gray-900 font-semibold">{valor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Perguntas Frequentes */}
      {aba === 'Perguntas Frequentes' && faqs && faqs.length > 0 && (
        <div className="max-w-2xl space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-2xl overflow-hidden hover:border-[#3cbfb3]/30 transition"
            >
              <button
                onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900 text-sm pr-4">{faq.pergunta}</span>
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    faqAberto === i
                      ? 'border-[#3cbfb3] bg-[#3cbfb3] rotate-180'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <ChevronDown size={14} className={faqAberto === i ? 'text-white' : 'text-gray-400'} />
                </div>
              </button>
              {faqAberto === i && (
                <div className="px-6 py-4 bg-[#f8fffe] border-t border-[#3cbfb3]/15">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.resposta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ABA: Avaliações */}
      {aba === 'Avaliações' && (
        <AvaliacoesProduto produtoId={produtoId} />
      )}
    </div>
  )
}
