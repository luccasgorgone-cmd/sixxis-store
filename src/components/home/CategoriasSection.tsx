'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const CATEGORIAS = [
  {
    nome: 'Climatizadores',
    href: '/produtos?categoria=climatizadores',
    img: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775737122831-k4d1lc1.jpg',
    badge: null,
    bgColor: null,
  },
  {
    nome: 'Aspiradores',
    href: '/produtos?categoria=aspiradores',
    img: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775743809308-70oi3e0.png',
    badge: null,
    bgColor: null,
  },
  {
    nome: 'Spinning',
    href: '/produtos?categoria=spinning',
    img: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775754930452-4ixi773.png',
    badge: null,
    bgColor: null,
  },
  {
    nome: 'Ofertas',
    href: '/ofertas',
    img: null,
    badge: 'HOT',
    bgColor: '#f59e0b',
  },
]

function CategoriaItem({ cat }: { cat: typeof CATEGORIAS[0] }) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link
      href={cat.href}
      className="flex flex-col items-center gap-2.5 min-w-[80px] group cursor-pointer"
    >
      <div
        className="w-[76px] h-[76px] rounded-2xl overflow-hidden border-2 border-white/20 group-hover:border-[#3cbfb3] group-hover:shadow-lg transition-all duration-300 bg-gray-100 flex items-center justify-center relative"
        style={cat.bgColor ? { backgroundColor: cat.bgColor } : {}}
      >
        {cat.img && !imgError ? (
          <Image
            src={cat.img}
            alt={cat.nome}
            width={76}
            height={76}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : cat.bgColor ? (
          <span className="text-white text-2xl font-black">%</span>
        ) : (
          <span className="text-gray-400 text-xs font-bold text-center px-1">{cat.nome}</span>
        )}
      </div>
      <div className="text-center">
        <span className="text-xs font-semibold text-white group-hover:text-[#3cbfb3] transition-colors block leading-tight">
          {cat.nome}
        </span>
        {cat.badge && (
          <span className="inline-block bg-[#f59e0b] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full mt-0.5 uppercase tracking-wide">
            {cat.badge}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function CategoriasSection() {
  return (
    <section className="bg-[#1a4f4a] border-b border-[#3cbfb3]/20 py-5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-10 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIAS.map(cat => (
            <CategoriaItem key={cat.nome} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  )
}
