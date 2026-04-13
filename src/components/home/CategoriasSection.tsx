'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const CATEGORIAS = [
  {
    nome: 'Climatizadores',
    href: '/produtos?categoria=climatizadores',
    img: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775737122831-k4d1lc1.jpg',
    emoji: '❄️',
    cor: '#1a4f4a',
    badge: null,
  },
  {
    nome: 'Aspiradores',
    href: '/produtos?categoria=aspiradores',
    img: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775743809308-70oi3e0.png',
    emoji: '🌀',
    cor: '#1a4f4a',
    badge: null,
  },
  {
    nome: 'Spinning',
    href: '/produtos?categoria=spinning',
    img: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775754930452-4ixi773.png',
    emoji: '🚴',
    cor: '#1a4f4a',
    badge: null,
  },
  {
    nome: 'Ofertas',
    href: '/ofertas',
    img: null,
    emoji: '%',
    cor: '#f59e0b',
    badge: 'HOT',
  },
]

type Categoria = (typeof CATEGORIAS)[number]

function CategoriaCard({ cat }: { cat: Categoria }) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link
      href={cat.href}
      className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300"
    >
      <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
        {imgError || !cat.img ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: cat.cor }}
          >
            <span className="text-white text-2xl font-black">{cat.emoji}</span>
          </div>
        ) : (
          <Image
            src={cat.img}
            alt={cat.nome}
            width={80}
            height={80}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            unoptimized
            onError={() => setImgError(true)}
          />
        )}
        {cat.badge && (
          <span className="absolute top-1 right-1 bg-[#f59e0b] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase leading-none">
            {cat.badge}
          </span>
        )}
      </div>
      <span className="text-sm font-bold text-gray-800 text-center">{cat.nome}</span>
    </Link>
  )
}

export default function CategoriasSection() {
  return (
    <section className="bg-white w-full border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="section-title mb-8">Categorias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIAS.map((cat) => (
            <CategoriaCard key={cat.nome} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  )
}
