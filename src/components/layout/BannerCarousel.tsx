'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id: string
  imagem: string
  imagemMobile?: string | null
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

  if (!banners.length) {
    return (
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className="w-full rounded-2xl animate-pulse"
            style={{
              background:
                'linear-gradient(135deg, rgba(26,79,74,0.35) 0%, rgba(15,46,43,0.55) 60%, rgba(15,46,43,0.7) 100%)',
              aspectRatio: '1920/560',
              maxHeight: '560px',
              minHeight: '220px',
            }}
          />
        </div>
      </section>
    )
  }

  const banner = banners[current]

  return (
    /* Outer: full width, sem background — sem espaço acima/abaixo */
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="relative w-full overflow-hidden rounded-2xl select-none"
          style={{
            aspectRatio: '1920/560',
            maxHeight: '560px',
            background:
              'linear-gradient(135deg, rgba(26,79,74,0.35) 0%, rgba(15,46,43,0.55) 100%)',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Imagem do banner — usa <picture> para servir imagemMobile no mobile */}
          {banner.link ? (
            <Link href={banner.link} className="block w-full h-full">
              <picture key={banner.id}>
                {banner.imagemMobile && (
                  <source media="(max-width: 767px)" srcSet={banner.imagemMobile} />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imagem}
                  alt={banner.titulo || 'Banner Sixxis'}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: 'center top' }}
                  loading="eager"
                />
              </picture>
            </Link>
          ) : (
            <picture key={banner.id}>
              {banner.imagemMobile && (
                <source media="(max-width: 767px)" srcSet={banner.imagemMobile} />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imagem}
                alt={banner.titulo || 'Banner Sixxis'}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center top' }}
                loading="eager"
              />
            </picture>
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

          {/* Indicadores */}
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
      </div>
    </section>
  )
}
