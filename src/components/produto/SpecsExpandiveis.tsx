'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Spec { label: string; valor: string }

interface Props {
  especificacoes: Spec[]
  initialCount?: number
}

export default function SpecsExpandiveis({ especificacoes, initialCount = 10 }: Props) {
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

      {/* Linhas zebradas */}
      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          {visiveis.map(({ label, valor }, i) => (
            <div
              key={label}
              className={`flex items-start px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-blue-50/20 transition ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
              }`}
            >
              <span className="text-[11px] text-gray-500 font-medium shrink-0 leading-snug" style={{ width: '48%' }}>
                {label}
              </span>
              <span className="text-[11px] text-gray-900 font-semibold leading-snug flex-1">
                {valor}
              </span>
            </div>
          ))}
        </div>
      </div>

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
