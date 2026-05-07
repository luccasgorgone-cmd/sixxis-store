'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id: string
  imagem: string
  imagemTablet?: string | null
  imagemMobile?: string | null
  titulo?: string | null
  subtitulo?: string | null
  link?: string | null
  tempoCads?: number
  aspectMobile?: string | null
  aspectTablet?: string | null
  aspectDesktop?: string | null
  maxHeightDesktop?: string | null
}

function normalizeAspect(value?: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  // Aceita "16/9", "16:9", "1.78" — CSS aspect-ratio prefere "W / H"
  if (trimmed.includes('/')) return trimmed.replace(/\//g, ' / ')
  if (trimmed.includes(':')) return trimmed.replace(/:/g, ' / ')
  return trimmed
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
            className="banner-container w-full rounded-2xl animate-pulse"
            style={{
              background:
                'linear-gradient(135deg, rgba(26,79,74,0.35) 0%, rgba(15,46,43,0.55) 60%, rgba(15,46,43,0.7) 100%)',
            }}
          />
        </div>
      </section>
    )
  }

  const banner = banners[current]

  const aspectVars: Record<string, string> = {}
  const aMobile  = normalizeAspect(banner.aspectMobile)
  const aTablet  = normalizeAspect(banner.aspectTablet)
  const aDesktop = normalizeAspect(banner.aspectDesktop)
  const mhDesk   = banner.maxHeightDesktop?.trim()
  if (aMobile)  aspectVars['--aspect-mobile']  = aMobile
  if (aTablet)  aspectVars['--aspect-tablet']  = aTablet
  if (aDesktop) aspectVars['--aspect-desktop'] = aDesktop
  if (mhDesk)   aspectVars['--max-h-desktop']  = mhDesk

  return (
    /* Outer: full width, sem background — sem espaço acima/abaixo */
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="banner-container relative w-full overflow-hidden rounded-2xl select-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(26,79,74,0.35) 0%, rgba(15,46,43,0.55) 100%)',
            ...aspectVars,
          } as React.CSSProperties}
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
                {banner.imagemTablet && (
                  <source media="(min-width: 768px) and (max-width: 1023px)" srcSet={banner.imagemTablet} />
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
              {banner.imagemTablet && (
                <source media="(min-width: 768px) and (max-width: 1023px)" srcSet={banner.imagemTablet} />
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
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
              aria-label="Banner anterior"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Seta direita */}
          {banners.length > 1 && (
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
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
