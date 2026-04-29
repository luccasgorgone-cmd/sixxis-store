'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ZoomIn, X, ChevronLeft, ChevronRight, Play, Package } from 'lucide-react'

export interface GaleriaItem {
  tipo: 'imagem' | 'video'
  url: string
  thumb?: string
}

interface Props {
  itens: GaleriaItem[]
  nomeProduto: string
}

export default function GaleriaProduto({ itens, nomeProduto }: Props) {
  const [ativo, setAtivo] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [fullscreen, setFullscreen] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  if (!itens.length) {
    return (
      <div className="aspect-square bg-[#f8f9fa] rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-300 border border-gray-200">
        <Package size={56} strokeWidth={1.5} />
        <span className="text-sm text-gray-400">Sem imagem</span>
      </div>
    )
  }

  const itemAtivo = itens[ativo]

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || itemAtivo?.tipo === 'video') return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
    setZoom(true)
  }, [itemAtivo])

  const handleMouseLeave = () => setZoom(false)

  const anterior = useCallback(() => setAtivo(i => i > 0 ? i - 1 : itens.length - 1), [itens.length])
  const proximo = useCallback(() => setAtivo(i => i < itens.length - 1 ? i + 1 : 0), [itens.length])

  // Swipe nativo (mobile) — sem dependência externa.
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return // limiar p/ ignorar tap
    if (dx > 0) anterior()
    else proximo()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Imagem/Vídeo principal */}
      <div className="relative">
        <div
          ref={imgRef}
          className={`relative bg-white rounded-2xl border-2 border-gray-100 overflow-hidden aspect-square touch-pan-y${itemAtivo?.tipo === 'imagem' ? ' cursor-zoom-in' : ''}`}
          style={{ minHeight: '400px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {itemAtivo?.tipo === 'imagem' && (
            <>
              <Image
                src={itemAtivo.url}
                alt={`${nomeProduto} — imagem ${ativo + 1}`}
                fill
                className={`object-contain p-6 transition-transform duration-100${zoom ? ' scale-150' : ' scale-100'}`}
                style={zoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                unoptimized
                priority={ativo === 0}
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-100 pointer-events-none">
                <ZoomIn size={16} className="text-gray-500" />
              </div>
            </>
          )}

          {itemAtivo?.tipo === 'video' && (
            <div className="w-full h-full flex items-center justify-center">
              {itemAtivo.url.includes('youtube') || itemAtivo.url.includes('youtu.be') ? (
                <iframe
                  src={itemAtivo.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Vídeo do produto"
                />
              ) : (
                <video src={itemAtivo.url} controls className="w-full h-full object-contain rounded-xl" />
              )}
            </div>
          )}

          {itens.length > 1 && (
            <>
              <button
                onClick={anterior}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm border border-gray-100 rounded-xl p-2 shadow-md transition z-10"
                aria-label="Imagem anterior"
              >
                <ChevronLeft size={18} className="text-gray-700" />
              </button>
              <button
                onClick={proximo}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm border border-gray-100 rounded-xl p-2 shadow-md transition z-10"
                aria-label="Próxima imagem"
              >
                <ChevronRight size={18} className="text-gray-700" />
              </button>
            </>
          )}

          {itemAtivo?.tipo === 'imagem' && (
            <button
              onClick={() => setFullscreen(true)}
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-white transition flex items-center gap-1.5 z-10"
            >
              <ZoomIn size={12} />
              Ver ampliado
            </button>
          )}

          {itens.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
              {ativo + 1}/{itens.length}
            </div>
          )}
        </div>

        {itemAtivo?.tipo === 'imagem' && !zoom && (
          <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1" aria-hidden="true">
            <ZoomIn size={11} />
          </p>
        )}
      </div>

      {/* Thumbnails */}
      {itens.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {itens.map((item, i) => (
            <button
              key={i}
              onClick={() => setAtivo(i)}
              className={`relative shrink-0 w-[72px] h-[72px] rounded-xl border-2 overflow-hidden transition-all duration-150 bg-white${
                i === ativo
                  ? ' border-[#3cbfb3] shadow-md shadow-[#3cbfb3]/20 scale-105'
                  : ' border-gray-100 hover:border-gray-300'
              }`}
              aria-label={`Ver ${item.tipo === 'video' ? 'vídeo' : `imagem ${i + 1}`}`}
            >
              {item.tipo === 'video' ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  {item.thumb && (
                    <Image src={item.thumb} alt="thumb" fill className="object-cover opacity-70" unoptimized />
                  )}
                  <Play size={20} className="text-white absolute z-10" fill="white" />
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={`thumb ${i + 1}`}
                  fill
                  className="object-contain p-1.5"
                  unoptimized
                />
              )}
              {i === ativo && (
                <div className="absolute inset-0 ring-2 ring-[#3cbfb3] ring-inset rounded-xl pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Modal Fullscreen */}
      {fullscreen && itemAtivo?.tipo === 'imagem' && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white rounded-xl p-2.5 transition z-10"
            onClick={(e) => { e.stopPropagation(); setFullscreen(false) }}
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={itemAtivo.url}
              alt={nomeProduto}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          {itens.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); anterior() }}
                className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-xl p-3 transition z-10"
                aria-label="Anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); proximo() }}
                className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-xl p-3 transition z-10"
                aria-label="Próxima"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
