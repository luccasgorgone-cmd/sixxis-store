'use client'

import { useState, useEffect } from 'react'
import { Truck, ShieldCheck, CreditCard, type LucideIcon } from 'lucide-react'

interface AnnItem {
  icon: LucideIcon
  titulo: string
  sub?: string
}

interface Props {
  items: { titulo: string; sub?: string }[]
  /** Intervalo de rotação em ms (default 3500). */
  intervalMs?: number
}

const ICONS: LucideIcon[] = [Truck, ShieldCheck, CreditCard]

/**
 * Barra de anúncio fina e rotativa — mostra UM dizer por vez, alternando com
 * fade. Usada no mobile no lugar dos 3 selos empilhados do TrustBar, deixando
 * o topo mais limpo e profissional. Fundo verde-escuro da marca.
 */
export default function AnnouncementBar({ items, intervalMs = 3500 }: Props) {
  const anns: AnnItem[] = items.map((it, i) => ({ ...it, icon: ICONS[i % ICONS.length] }))
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    if (anns.length <= 1) return
    const t = setInterval(() => {
      // fade-out, troca, fade-in
      setFade(false)
      setTimeout(() => {
        setIdx((c) => (c + 1) % anns.length)
        setFade(true)
      }, 250)
    }, intervalMs)
    return () => clearInterval(t)
  }, [anns.length, intervalMs])

  const atual = anns[idx]
  const Icon = atual.icon

  return (
    <div
      className="w-full border-t border-b border-white/10 overflow-hidden"
      style={{ backgroundColor: '#0f2e2b' }}
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto px-4 py-2.5">
        <div
          className="flex items-center justify-center gap-2 text-center transition-opacity duration-250"
          style={{ opacity: fade ? 1 : 0 }}
        >
          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-[#3cbfb3]" strokeWidth={2} />
          </span>
          <p className="text-[12px] font-bold text-white leading-tight">
            {atual.titulo}
            {atual.sub && (
              <span className="font-normal text-white/60"> · {atual.sub}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
