'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id:        string
  imagem:    string
  titulo:    string | null
  subtitulo: string | null
  link:      string | null
  tempoCads: number
}

interface Props {
  banners: Banner[]
}

export default function BannerCarousel({ banners }: Props) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback((index: number) => {
    setVisible(false)
    setTimeout(() => {
      setCurrent(index)
      setVisible(true)
    }, 300)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % banners.length)
  }, [current, banners.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length)
  }, [current, banners.length, goTo])

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1) return
    const ms = (banners[current]?.tempoCads ?? 5) * 1000
    timerRef.current = setTimeout(next, ms)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, banners, next])

  if (banners.length === 0) return null

  const banner = banners[current]

  const Inner = (
    <div
      className="relative w-full h-[280px] md:h-[500px] overflow-hidden"
      style={{ transition: 'opacity 0.3s ease', opacity: visible ? 1 : 0 }}
    >
      <Image
        src={banner.imagem}
        alt={banner.titulo ?? 'Banner'}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {(banner.titulo || banner.subtitulo) && (
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-16 md:pb-14 text-white">
          {banner.titulo && (
            <h2 className="text-2xl md:text-5xl font-extrabold leading-tight drop-shadow-lg mb-2">
              {banner.titulo}
            </h2>
          )}
          {banner.subtitulo && (
            <p className="text-sm md:text-xl text-white/80 drop-shadow">{banner.subtitulo}</p>
          )}
        </div>
      )}
    </div>
  )

  return (
    <section className="relative group select-none">
      {banner.link ? (
        <Link href={banner.link} className="block">{Inner}</Link>
      ) : (
        Inner
      )}

      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
