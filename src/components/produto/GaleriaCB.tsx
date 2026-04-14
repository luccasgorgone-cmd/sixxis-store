'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Play, ZoomIn, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface GaleriaItemCB {
  tipo: 'imagem' | 'video'
  url: string
}

interface Props {
  itens: GaleriaItemCB[]
  nome: string
}

const ZOOM_FACTOR = 2.8

export default function GaleriaCB({ itens, nome }: Props) {
  const [ativo, setAtivo] = useState(0)
  const [lupa, setLupa] = useState(false)
  const [lupaPos, setLupaPos] = useState({ x: 0, y: 0 })
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 })
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const itemAtivo = itens[ativo]

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current || itemAtivo?.tipo !== 'imagem') return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pctX = (x / rect.width) * 100
    const pctY = (y / rect.height) * 100
    setLupaPos({ x, y })
    setBgPos({ x: pctX, y: pctY })
    setLupa(true)
  }

  return (
    <>
      <div className="flex gap-3">
        {/* Thumbnails coluna esquerda */}
        <div className="flex flex-col gap-2 w-[72px] shrink-0">
          {itens.slice(0, 6).map((item, i) => (
            <button
              key={i}
              onClick={() => setAtivo(i)}
              className={`relative w-[72px] h-[72px] rounded-xl border-2 overflow-hidden flex items-center justify-center bg-white shrink-0 transition-all duration-150 ${
                i === ativo ? 'border-[#3cbfb3] shadow-md' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {item.tipo === 'video' ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Play size={18} fill="white" className="text-white" />
                </div>
              ) : (
                <Image src={item.url} alt="" fill className="object-contain p-1.5" unoptimized />
              )}
            </button>
          ))}
          {itens.length > 6 && (
            <button
              onClick={() => setFullscreen(true)}
              className="w-[72px] h-[72px] rounded-xl border-2 border-gray-200 flex items-center justify-center bg-gray-50 text-gray-600 font-bold text-sm hover:border-[#3cbfb3] transition"
            >
              +{itens.length - 6}
            </button>
          )}
        </div>

        {/* Imagem principal */}
        <div className="flex-1 relative group">
          <div
            ref={containerRef}
            className="relative bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-crosshair"
            style={{ aspectRatio: '1/1' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setLupa(false)}
          >
            {itemAtivo?.tipo === 'imagem' && (
              <Image
                src={itemAtivo.url}
                alt={`${nome} — imagem ${ativo + 1}`}
                fill
                className="object-contain p-6 pointer-events-none"
                unoptimized
                priority={ativo === 0}
              />
            )}

            {itemAtivo?.tipo === 'video' && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl">
                {itemAtivo.url.includes('youtube') || itemAtivo.url.includes('youtu.be') ? (
                  <iframe
                    src={itemAtivo.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full rounded-xl"
                    allowFullScreen
                    title={nome}
                  />
                ) : (
                  <video src={itemAtivo.url} controls className="w-full h-full object-contain rounded-xl" />
                )}
              </div>
            )}

            {/* Lupa magnifier */}
            {lupa && itemAtivo?.tipo === 'imagem' && (
              <div
                className="absolute pointer-events-none rounded-full border-2 border-[#3cbfb3] z-30 overflow-hidden"
                style={{
                  width: 140,
                  height: 140,
                  left: lupaPos.x - 70,
                  top: lupaPos.y - 70,
                  backgroundImage: `url(${itemAtivo.url})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${ZOOM_FACTOR * 100}%`,
                  backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
                  boxShadow: '0 0 0 2px #3cbfb3, 0 8px 32px rgba(0,0,0,0.2)',
                }}
              />
            )}

            {/* Hint zoom */}
            {!lupa && itemAtivo?.tipo === 'imagem' && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full pointer-events-none">
                <ZoomIn size={11} />
                Passe o mouse
              </div>
            )}

            {/* Fullscreen button */}
            <button
              onClick={() => setFullscreen(true)}
              className="absolute top-3 right-3 bg-white/80 hover:bg-white border border-gray-200 rounded-xl p-2 transition opacity-0 group-hover:opacity-100"
            >
              <Maximize2 size={15} className="text-gray-600" />
            </button>
          </div>

          {/* Dots mobile */}
          {itens.length > 1 && (
            <div className="flex justify-center gap-2 mt-3 lg:hidden">
              {itens.map((_, i) => (
                <button key={i} onClick={() => setAtivo(i)}
                  className={`w-2 h-2 rounded-full transition ${i === ativo ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition"
          >
            <X size={24} />
          </button>

          <button
            onClick={() => setAtivo(a => Math.max(0, a - 1))}
            disabled={ativo === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl disabled:opacity-30 transition"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative w-full max-w-2xl" style={{ aspectRatio: '1/1' }}>
            {itemAtivo?.tipo === 'imagem' && (
              <Image src={itemAtivo.url} alt={nome} fill className="object-contain" unoptimized />
            )}
          </div>

          <button
            onClick={() => setAtivo(a => Math.min(itens.length - 1, a + 1))}
            disabled={ativo === itens.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl disabled:opacity-30 transition"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {itens.map((_, i) => (
              <button key={i} onClick={() => setAtivo(i)}
                className={`w-2.5 h-2.5 rounded-full transition ${i === ativo ? 'bg-[#3cbfb3]' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
