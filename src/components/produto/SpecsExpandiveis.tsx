'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Spec { label: string; valor: string }

interface Props {
  especificacoes: Spec[]
  initialCount?: number
}

export default function SpecsExpandiveis({ especificacoes, initialCount = 5 }: Props) {
  const [expandido, setExpandido] = useState(false)

  const visiveis = expandido ? especificacoes : especificacoes.slice(0, initialCount)
  const resto = especificacoes.length - initialCount

  return (
    <div className="mt-5 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      {/* Header escuro */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ background: 'linear-gradient(to right, #0f2e2b, #1a4f4a)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#3cbfb3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span className="text-xs font-extrabold text-white uppercase tracking-wider">
          Especificações Técnicas
        </span>
      </div>

      {/* Linhas zebradas — empilha label+valor em mobile, side-by-side em desktop */}
      <dl>
        {visiveis.map(({ label, valor }, i) => (
          <div
            key={label}
            className={`flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-blue-50/20 transition ${
              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
            }`}
          >
            <dt
              className="text-[11px] text-gray-500 font-medium uppercase tracking-wide leading-snug sm:shrink-0 sm:basis-[48%]"
            >
              {label}
            </dt>
            <dd className="text-sm sm:text-[11px] text-gray-900 font-semibold leading-snug sm:flex-1">
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      {/* Botão expand/collapse */}
      {especificacoes.length > initialCount && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setExpandido(v => !v)}
            className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-[#3cbfb3] hover:bg-gray-50 transition"
          >
            {expandido ? (
              <>
                <ChevronUp size={14} />
                Ocultar especificações
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                + {resto} especificações
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
