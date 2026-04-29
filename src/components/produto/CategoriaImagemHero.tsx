'use client'

import { useEffect, useState } from 'react'
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
//
// Usa <img> nativo (não next/image) porque:
// 1. URLs externas R2 unoptimized não ganham vantagem do next/image
// 2. onError nativo é mais confiável (next/image às vezes silencia erros)
// 3. Garante que o handler de erro dispare na 1ª request 404, não no retry
export default function CategoriaImagemHero({ src, alt, categoria, className }: Props) {
  const [erro, setErro] = useState(false)
  const Icon = FALLBACK_ICON[categoria]

  // Pré-validação via HEAD: se o servidor responder !ok, marca erro antes
  // de renderizar a <img>. Evita layout shift do "carrega → falha → fallback".
  useEffect(() => {
    let cancelado = false
    fetch(src, { method: 'HEAD' })
      .then((r) => { if (!cancelado && !r.ok) setErro(true) })
      .catch(() => { if (!cancelado) setErro(true) })
    return () => { cancelado = true }
  }, [src])

  if (erro) {
    return (
      <div className={`absolute inset-0 flex items-end justify-center ${className ?? ''}`}>
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 w-full h-full ${className ?? ''}`}
      loading="lazy"
      decoding="async"
      onError={() => setErro(true)}
    />
  )
}
