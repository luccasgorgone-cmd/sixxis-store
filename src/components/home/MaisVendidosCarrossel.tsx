'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import type { Produto } from '@/types'

interface Props {
  produtos: Produto[]
}

// Renderiza "Mais Vendidos" em 3 modos:
// - Mobile (<md): grid 2 cols (4 primeiros)
// - iPad md (768-1023): carrossel scroll-snap horizontal com setas, 3 cards visiveis
// - Desktop lg+ (>=1024): grid 4 cols (4 primeiros)
export default function MaisVendidosCarrossel({ produtos }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollerRef.current) return
    const card = scrollerRef.current.querySelector('[data-card]') as HTMLElement | null
    const cardWidth = card?.offsetWidth || 240
    const gap = 16
    scrollerRef.current.scrollBy({
      left: dir === 'left' ? -(cardWidth + gap) : cardWidth + gap,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {/* Mobile: grid 2 cols (sem carrossel) */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {produtos.slice(0, 4).map((produto, i) => (
          <CardProduto key={produto.id} produto={produto} priority={i < 3} />
        ))}
      </div>

      {/* iPad md (768-1023px): carrossel com setas */}
      <div className="hidden md:block lg:hidden relative">
        {produtos.length > 3 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
        {produtos.length > 3 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth"
        >
          {produtos.map((produto, i) => (
            <div
              key={produto.id}
              data-card
              className="shrink-0 snap-start"
              style={{ width: 'calc((100% - 2rem) / 3)' }}
            >
              <CardProduto produto={produto} priority={i < 3} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop lg+: grid 4 cols */}
      <div className="hidden lg:grid grid-cols-4 gap-4">
        {produtos.slice(0, 4).map((produto, i) => (
          <CardProduto key={produto.id} produto={produto} priority={i < 3} />
        ))}
      </div>
    </>
  )
}
