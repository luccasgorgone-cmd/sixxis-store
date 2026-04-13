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
  const proximoIdx = (atual + 1) % banners.length
  const proximoBanner = banners.length > 1 ? banners[proximoIdx] : null

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: '#0f2e2b', aspectRatio: '16 / 5', maxHeight: '560px' }}
    >
      {/* Imagem — object-contain para mostrar o banner inteiro */}
      {banner.imagem && (
        <Image
          src={banner.imagem}
          alt={banner.titulo || 'Banner Sixxis'}
          fill
          className="object-contain"
          priority
          unoptimized
        />
      )}

      {/* Preload do próximo banner */}
      {proximoBanner?.imagem && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proximoBanner.imagem}
          alt=""
          aria-hidden
          style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }}
        />
      )}

      {/* Texto sobreposto */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-10 w-full">
          {banner.titulo && (
            <h2 className="text-4xl font-extrabold text-white mb-4 max-w-lg">
              {banner.titulo}
            </h2>
          )}
          {banner.subtitulo && (
            <p className="text-white/80 text-lg mb-6 max-w-md">
              {banner.subtitulo}
            </p>
          )}
          {banner.link && (
            <Link
              href={banner.link}
              className="inline-flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Ver produto →
            </Link>
          )}
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
