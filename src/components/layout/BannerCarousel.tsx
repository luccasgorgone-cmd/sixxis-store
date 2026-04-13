'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id: string
  imagem: string
  titulo?: string | null
  subtitulo?: string | null
  link?: string | null
  tempoCads?: number
}

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % banners.length), [banners.length])
  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length])

  useEffect(() => {
    if (paused || banners.length <= 1) return
    const t = setInterval(next, ((banners[current] as Banner | undefined)?.tempoCads || 5) * 1000)
    return () => clearInterval(t)
  }, [current, paused, banners, next])

  if (!banners.length) return null

  const banner = banners[current]

  return (
    <div
      className="relative w-full overflow-hidden bg-[#0f2e2b] select-none"
      style={{ aspectRatio: '1920/500', maxHeight: '500px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Imagem do banner — SEM overlay */}
      {banner.link ? (
        <Link href={banner.link} className="block w-full h-full">
          <Image
            key={banner.id}
            src={banner.imagem}
            alt={banner.titulo || 'Banner Sixxis'}
            fill
            className="object-cover w-full h-full"
            priority
            unoptimized
          />
        </Link>
      ) : (
        <Image
          key={banner.id}
          src={banner.imagem}
          alt={banner.titulo || 'Banner Sixxis'}
          fill
          className="object-cover w-full h-full"
          priority
          unoptimized
        />
      )}

      {/* Seta esquerda */}
      {banners.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
          aria-label="Banner anterior"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Seta direita */}
      {banners.length > 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
          aria-label="Próximo banner"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Indicadores estilo Casas Bahia */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-6 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Ir para banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
