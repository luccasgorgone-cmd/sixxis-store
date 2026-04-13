'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CardProduto from '@/components/produto/CardProduto'
import type { Produto } from '@/types'

interface Props {
  produtos: Produto[]
}

interface Tempo {
  d: string
  h: string
  m: string
  s: string
}

export default function OfertasRelampago({ produtos }: Props) {
  const [tempo, setTempo] = useState<Tempo>({ d: '0', h: '00', m: '00', s: '00' })

  useEffect(() => {
    const calcular = () => {
      const agora = new Date()
      const fim   = new Date()
      fim.setHours(23, 59, 59, 0)
      const diff = Math.max(0, fim.getTime() - agora.getTime())
      setTempo({
        d: String(Math.floor(diff / 86400000)),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }
    calcular()
    const t = setInterval(calcular, 1000)
    return () => clearInterval(t)
  }, [])

  if (produtos.length === 0) return null

  const blocos = [
    { val: tempo.d, label: 'DIAS'  },
    { val: tempo.h, label: 'HORAS' },
    { val: tempo.m, label: 'MIN'   },
    { val: tempo.s, label: 'SEG'   },
  ]

  return (
    <section className="bg-[#f0f2f5] pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#e8f8f7] border border-[#3cbfb3]/20 rounded-2xl p-5 sm:p-6">

          {/* Header com timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

            {/* Título */}
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">⚡</span>
              <div>
                <h2 className="text-2xl font-extrabold text-[#0f2e2b] leading-none">
                  Ofertas Relâmpago
                </h2>
                <p className="text-[#3cbfb3] text-sm font-semibold mt-0.5">
                  Aproveite antes que acabe!
                </p>
              </div>
            </div>

            {/* Timer estilo Casas Bahia */}
            <div className="flex items-end gap-1.5">
              <span className="text-[#1a4f4a] font-semibold text-sm hidden sm:inline mb-3">
                Termina em:
              </span>
              {blocos.map((bloco, i) => (
                <div key={bloco.label} className="flex items-end gap-1.5">
                  <div className="flex flex-col items-center">
                    <span className="bg-[#1a4f4a] text-white font-mono font-extrabold px-3 py-2 rounded-lg text-lg sm:text-xl min-w-[48px] text-center tabular-nums leading-none">
                      {bloco.val}
                    </span>
                    <span className="text-[#1a4f4a] text-[9px] font-bold uppercase tracking-wider mt-1">
                      {bloco.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <span className="text-[#3cbfb3] font-extrabold text-xl mb-4 leading-none">:</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Grid de produtos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {produtos.slice(0, 4).map(p => (
              <CardProduto key={p.id} produto={p} />
            ))}
          </div>

          {/* Link ver todas */}
          <div className="text-center mt-5">
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-2 bg-[#1a4f4a] hover:bg-[#0f2e2b] text-white font-bold px-6 py-3 rounded-xl transition text-sm"
            >
              Ver todas as ofertas →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
