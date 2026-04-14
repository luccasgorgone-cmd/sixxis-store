'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Subcategoria {
  label: string
  href: string
  emoji: string
  img?: string
}

const SUBCATS: Record<string, Subcategoria[]> = {
  climatizadores: [
    { label: 'Residencial', href: '/produtos?categoria=climatizadores&tipo=residencial', emoji: '🏠' },
    { label: 'Comercial', href: '/produtos?categoria=climatizadores&tipo=comercial', emoji: '🏢' },
    { label: 'Tanque Grande', href: '/produtos?categoria=climatizadores&min_litros=40', emoji: '💧' },
    { label: 'Bivolt', href: '/produtos?categoria=climatizadores&voltagem=bivolt', emoji: '⚡' },
    { label: 'Mais Vendidos', href: '/produtos?categoria=climatizadores&ordem=vendidos', emoji: '🏆' },
    { label: 'Melhores Preços', href: '/produtos?categoria=climatizadores&ordem=preco-asc', emoji: '💰' },
  ],
  aspiradores: [
    { label: 'Portátil', href: '/produtos?categoria=aspiradores&tipo=portatil', emoji: '🤲' },
    { label: 'Robô', href: '/produtos?categoria=aspiradores&tipo=robo', emoji: '🤖' },
    { label: 'Vertical', href: '/produtos?categoria=aspiradores&tipo=vertical', emoji: '⬆️' },
    { label: 'Mais Vendidos', href: '/produtos?categoria=aspiradores&ordem=vendidos', emoji: '🏆' },
    { label: 'Melhores Preços', href: '/produtos?categoria=aspiradores&ordem=preco-asc', emoji: '💰' },
  ],
  spinning: [
    { label: 'Profissional', href: '/produtos?categoria=spinning&tipo=profissional', emoji: '🏅' },
    { label: 'Residencial', href: '/produtos?categoria=spinning&tipo=residencial', emoji: '🏠' },
    { label: 'Mais Vendidos', href: '/produtos?categoria=spinning&ordem=vendidos', emoji: '🏆' },
    { label: 'Melhores Preços', href: '/produtos?categoria=spinning&ordem=preco-asc', emoji: '💰' },
  ],
  '': [
    { label: 'Climatizadores', href: '/produtos?categoria=climatizadores', emoji: '❄️' },
    { label: 'Aspiradores', href: '/produtos?categoria=aspiradores', emoji: '🌀' },
    { label: 'Spinning', href: '/produtos?categoria=spinning', emoji: '🚴' },
    { label: 'Ofertas', href: '/ofertas', emoji: '🏷️' },
    { label: 'Mais Vendidos', href: '/produtos?ordem=vendidos', emoji: '🔥' },
    { label: 'Novidades', href: '/produtos?ordem=recentes', emoji: '✨' },
  ],
}

interface Props {
  categoria: string
}

export default function SubcategoriasCarrossel({ categoria }: Props) {
  const subcats = SUBCATS[categoria] ?? SUBCATS['']

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto py-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {subcats.map(sub => (
            <Link
              key={sub.label}
              href={sub.href}
              className="flex flex-col items-center gap-2 shrink-0 group px-3"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all duration-200 bg-gray-50 border-gray-100 group-hover:border-[#3cbfb3]/50 group-hover:bg-[#f0fffe]">
                {sub.img ? (
                  <Image src={sub.img} alt={sub.label} width={64} height={64} className="object-contain p-2" unoptimized />
                ) : (
                  <span className="text-2xl">{sub.emoji}</span>
                )}
              </div>
              <span className="text-xs font-semibold text-center leading-tight max-w-[70px] text-gray-600 group-hover:text-[#3cbfb3] transition-colors">
                {sub.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
