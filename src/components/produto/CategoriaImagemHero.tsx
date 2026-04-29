'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Wind, Bike, Fan } from 'lucide-react'

type Categoria = 'climatizadores' | 'aspiradores' | 'spinning'

const FALLBACK_ICON: Record<Categoria, typeof Wind> = {
  climatizadores: Wind,
  aspiradores:    Fan,
  spinning:       Bike,
}

interface Props {
  src: string
  alt: string
  categoria: Categoria
  className?: string
}

// Wrapper de imagem decorativa de categoria com fallback gracioso quando a
// URL R2 retorna 404 (acontece quando o admin remove um produto sem atualizar
// os links hardcoded da home). Em vez de quebrar o layout, mostra um ícone
// grande da categoria.
export default function CategoriaImagemHero({ src, alt, categoria, className }: Props) {
  const [erro, setErro] = useState(false)
  const Icon = FALLBACK_ICON[categoria]

  if (erro) {
    return (
      <div className={`flex items-end justify-center ${className ?? ''}`}>
        <Icon
          size={140}
          strokeWidth={1.2}
          className="text-white/30 drop-shadow-2xl"
          aria-hidden
        />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      unoptimized
      loading="lazy"
      onError={() => setErro(true)}
    />
  )
}
