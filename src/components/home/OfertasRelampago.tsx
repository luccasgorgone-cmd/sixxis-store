'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Timer } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import type { Produto } from '@/types'

interface Props {
  produtos: Produto[]
}

interface Tempo {
  h: string
  m: string
  s: string
}

export default function OfertasRelampago({ produtos }: Props) {
  const [tempo, setTempo] = useState<Tempo>({ h: '00', m: '00', s: '00' })

  useEffect(() => {
    const calcular = () => {
      const agora = new Date()
      const fim   = new Date()
      fim.setHours(23, 59, 59, 0)
      const diff = Math.max(0, fim.getTime() - agora.getTime())
      setTempo({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }
    calcular()
    const t = setInterval(calcular, 1000)
    return () => clearInterval(t)
  }, [])

  if (produtos.length === 0) return null

  return (
    <section className="bg-transparent border-b border-white/10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white/[0.08] border border-white/15 backdrop-blur-sm rounded-2xl p-5 sm:p-6">

          {/* ── Header com timer ──────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">

            {/* Título esquerda */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-md shadow-red-600/30">
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white leading-none">
                  Ofertas Relâmpago
                </h2>
                <p className="text-white/60 text-xs mt-0.5">Aproveite antes que acabe!</p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Timer size={13} className="text-red-400" />
                <span className="text-white/70 text-xs font-semibold">Termina em:</span>
              </div>

              {/* Blocos do contador */}
              <div className="flex items-center gap-1">
                {[
                  { val: tempo.h, label: 'HORAS' },
                  { val: tempo.m, label: 'MIN'   },
                  { val: tempo.s, label: 'SEG'   },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className="flex flex-col items-center">
                      <span className="bg-red-600 text-white font-mono font-extrabold px-3 py-1.5 rounded-lg text-base min-w-[42px] text-center tabular-nums leading-none shadow-md shadow-red-600/30">
                        {item.val}
                      </span>
                      <span className="text-red-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                        {item.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <span className="text-red-400 font-extrabold text-lg pb-4">:</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Grid de produtos ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {produtos.slice(0, 4).map(p => (
              <CardProduto key={p.id} produto={p} />
            ))}
          </div>

          {/* ── Link ver todas ────────────────────────────────────────────── */}
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
