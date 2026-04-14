'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'

interface Props {
  imagens: string[]
  nome: string
}

export default function GaleriaProduto({ imagens, nome }: Props) {
  const [ativa, setAtiva] = useState(0)

  if (imagens.length === 0) {
    return (
      <div className="aspect-square bg-[#f8f9fa] rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-300 border border-gray-200">
        <Package size={56} strokeWidth={1.5} />
        <span className="text-sm text-gray-400">Sem imagem</span>
      </div>
    )
  }

  return (
    <div>
      {/* Imagem principal */}
      <div className="relative aspect-square bg-[#f8f9fa] rounded-2xl overflow-hidden mb-4 border border-gray-200 group cursor-zoom-in">
        <Image
          src={imagens[ativa]}
          alt={nome}
          fill
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {imagens.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imagens.map((img, i) => (
            <button
              key={i}
              onClick={() => setAtiva(i)}
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === ativa
                  ? 'border-[#3cbfb3] shadow-md shadow-[#3cbfb3]/20'
                  : 'border-gray-200 hover:border-[#3cbfb3]/50'
              }`}
              aria-label={`Ver imagem ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${nome} — imagem ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
