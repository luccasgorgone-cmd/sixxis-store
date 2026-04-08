'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/banners')
      .then((r) => r.json())
      .then((d) => {
        setBanners(d.banners ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

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

  // Fallback hero estático quando não há banners
  if (loaded && banners.length === 0) {
    return (
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-8">
            <span>🏆</span> Loja Oficial Sixxis — Araçatuba, SP
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Alta Performance para o<br className="hidden sm:block" /> seu Conforto e Bem-Estar
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Climatizadores, aspiradores e equipamentos fitness com qualidade Sixxis e garantia total.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/produtos" className="btn-primary text-base">Explorar Produtos →</Link>
            <Link href="/pecas" className="btn-outline-white text-base">Peças de Reposição</Link>
          </div>
        </div>
      </section>
    )
  }

  if (!loaded || banners.length === 0) {
    return (
      <div className="relative h-[280px] md:h-[500px] bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] animate-pulse" />
    )
  }

  const banner = banners[current]

  const Inner = (
    <div
      className="relative w-full h-[280px] md:h-[500px] overflow-hidden"
      style={{ transition: 'opacity 0.3s ease, transform 0.3s ease', opacity: visible ? 1 : 0 }}
    >
      <Image
        src={banner.imagem}
        alt={banner.titulo ?? 'Banner'}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Texto */}
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
        <Link href={banner.link} className="block">
          {Inner}
        </Link>
      ) : (
        Inner
      )}

      {/* Setas */}
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

      {/* Indicadores (bolinhas) */}
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
