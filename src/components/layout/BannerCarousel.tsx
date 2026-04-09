'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id: string
  imagem: string
  titulo: string | null
  subtitulo: string | null
  link: string | null
  tempoCads: number
}

interface Props {
  banners: Banner[]
}

export default function BannerCarousel({ banners }: Props) {
  const [atual, setAtual] = useState(0)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  const proximo = useCallback(() => {
    setAtual((i) => (i + 1) % banners.length)
  }, [banners.length])

  const anterior = useCallback(() => {
    setAtual((i) => (i - 1 + banners.length) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (!montado || banners.length <= 1) return
    const tempo = (banners[atual]?.tempoCads || 5) * 1000
    const timer = setTimeout(proximo, tempo)
    return () => clearTimeout(timer)
  }, [atual, montado, banners, proximo])

  if (!banners.length) return null

  const banner = banners[atual]

  return (
    /* Mobile: 260px | Desktop: clamp(280px, 50vw, 560px) */
    <div
      className="relative w-full overflow-hidden bg-[#0f1f1e]"
      style={{ height: 'clamp(260px, 50vw, 560px)' }}
    >
      {/* Imagem */}
      <div className="absolute inset-0">
        {banner.imagem && (
          <Image
            src={banner.imagem}
            alt={banner.titulo || 'Banner Sixxis'}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 w-full">
          <div className="max-w-xl">
            {banner.titulo && (
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3 sm:mb-4">
                {banner.titulo}
              </h2>
            )}
            {banner.subtitulo && (
              <p className="text-white/80 text-sm sm:text-lg mb-5 sm:mb-8 leading-relaxed hidden sm:block">
                {banner.subtitulo}
              </p>
            )}
            {banner.link && (
              <Link
                href={banner.link}
                className="inline-flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-3 sm:px-8 sm:py-4 text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-[#3cbfb3]/40 hover:-translate-y-0.5"
              >
                Ver produto →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Setas */}
      {banners.length > 1 && (
        <>
          <button
            onClick={anterior}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={proximo}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
            aria-label="Próximo"
          >
            <ChevronRight size={18} />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setAtual(i)}
                className={`h-2 rounded-full transition-all ${i === atual ? 'w-8 bg-[#3cbfb3]' : 'w-2 bg-white/50'}`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
