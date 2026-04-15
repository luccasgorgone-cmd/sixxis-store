'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ZoomIn, X, ChevronLeft, ChevronRight, Play, Grid3X3, ImageIcon } from 'lucide-react'

export interface GaleriaItemCB {
  tipo: 'imagem' | 'video'
  url: string
  thumb?: string // thumbnail para vídeo (auto-gerado se YouTube)
}

interface Props {
  itens: GaleriaItemCB[]
  nome: string
}

const ZOOM_SCALE = 2.5
const MAX_THUMBS_INLINE = 8

// ── Extrair ID do YouTube ─────────────────────────────────────
function extrairYtId(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

// URL de embed do YouTube (lida com watch?v=, youtu.be/, /embed/)
function ytEmbed(url: string, autoplay = false): string {
  const id = extrairYtId(url)
  if (id) return `https://www.youtube.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`
  return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
}

function isMP4(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
}

// Thumbnail de vídeo: usa hqdefault do YouTube, ou a prop thumb
function getVideoThumb(item: GaleriaItemCB): string | null {
  if (item.thumb) return item.thumb
  const id = extrairYtId(item.url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

// ── Componente ────────────────────────────────────────────────
export default function GaleriaCB({ itens, nome }: Props) {
  const [ativo, setAtivo] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [lightbox, setLightbox] = useState(false)
  const [lbIndex, setLbIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const itemAtivo = itens[ativo]
  const itemLb = itens[lbIndex]

  // ── Navegação no lightbox ─────────────────────────────────
  const lbAnterior = useCallback(() =>
    setLbIndex(i => (i - 1 + itens.length) % itens.length), [itens.length])
  const lbProximo = useCallback(() =>
    setLbIndex(i => (i + 1) % itens.length), [itens.length])

  // ── Teclado no lightbox ───────────────────────────────────
  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') lbProximo()
      else if (e.key === 'ArrowLeft') lbAnterior()
      else if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, lbProximo, lbAnterior])

  // ── Trava scroll do body ──────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  // ── Abrir lightbox ────────────────────────────────────────
  const abrirLightbox = (index: number) => {
    setLbIndex(index)
    setLightbox(true)
  }

  // ── Zoom com mouse ────────────────────────────────────────
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current || itemAtivo?.tipo !== 'imagem') return
    const rect = containerRef.current.getBoundingClientRect()
    const pctX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const pctY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setZoomPos({ x: pctX, y: pctY })
    setZoom(true)
  }

  if (!itens.length) return (
    <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 border border-gray-200">
      <ImageIcon size={48} strokeWidth={1.5} />
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-3">

        {/* ── IMAGEM/VÍDEO PRINCIPAL ───────────────────────── */}
        <div className="relative">
          <div
            ref={containerRef}
            className="relative bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-crosshair group select-none"
            style={{ aspectRatio: '1/1' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoom(false)}
          >
            {itemAtivo?.tipo === 'imagem' && (
              <>
                <Image
                  src={itemAtivo.url}
                  alt={`${nome} — imagem ${ativo + 1}`}
                  fill
                  className="object-contain p-6 pointer-events-none"
                  unoptimized
                  priority={ativo === 0}
                />
                {/* Botão expandir fullscreen */}
                <button
                  onClick={() => abrirLightbox(ativo)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center
                             bg-white/90 backdrop-blur-sm shadow-md border border-gray-100
                             opacity-0 group-hover:opacity-100 transition-all duration-200
                             hover:bg-white hover:scale-110 z-10"
                  title="Ver em tela cheia"
                >
                  <ZoomIn size={15} className="text-gray-600" />
                </button>
              </>
            )}

            {itemAtivo?.tipo === 'video' && (
              <>
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  {extrairYtId(itemAtivo.url) ? (
                    <iframe
                      src={ytEmbed(itemAtivo.url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Vídeo — ${nome}`}
                    />
                  ) : isMP4(itemAtivo.url) ? (
                    <video
                      src={itemAtivo.url}
                      className="w-full h-full object-contain"
                      controls
                      playsInline
                    />
                  ) : null}
                </div>
                {/* Badge vídeo */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1
                               bg-gray-900/80 backdrop-blur-sm rounded-full text-white text-xs font-bold pointer-events-none z-10">
                  <Play size={9} fill="white" />
                  VÍDEO
                </div>
              </>
            )}

            {/* Dots indicador */}
            {itens.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {itens.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setAtivo(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === ativo
                        ? 'w-5 h-2 bg-white shadow'
                        : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Ir para ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Painel de zoom ML-style — desktop only */}
          {zoom && itemAtivo?.tipo === 'imagem' && (
            <div
              className="absolute top-0 left-full ml-4 z-50 rounded-2xl border-2 border-gray-200
                         overflow-hidden shadow-2xl pointer-events-none hidden lg:block"
              style={{
                width: 420, height: 420,
                backgroundImage: `url(${itemAtivo.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${ZOOM_SCALE * 100}%`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              }}
            >
              <span className="absolute top-2 left-2 bg-black/55 text-white text-[10px]
                               font-bold px-2 py-0.5 rounded-full">
                {ZOOM_SCALE}× ZOOM
              </span>
            </div>
          )}
        </div>

        {/* ── FAIXA DE THUMBNAILS ──────────────────────────── */}
        {itens.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAtivo(i => Math.max(0, i - 1))}
              disabled={ativo === 0}
              className="shrink-0 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center
                         hover:bg-gray-200 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={14} className="text-gray-600" />
            </button>

            <div className="flex gap-2 flex-1 overflow-x-auto scrollbar-hide pb-0.5">
              {itens.slice(0, MAX_THUMBS_INLINE).map((item, i) => {
                const isAtivo = i === ativo
                const thumb = item.tipo === 'video' ? getVideoThumb(item) : null

                return (
                  <button
                    key={i}
                    onClick={() => setAtivo(i)}
                    className={`relative shrink-0 w-[68px] h-[68px] rounded-xl border-2 overflow-hidden
                                flex items-center justify-center bg-white transition-all duration-150 ${
                      isAtivo
                        ? 'border-[#3cbfb3] shadow-md shadow-[#3cbfb3]/20 scale-105'
                        : 'border-gray-100 hover:border-gray-300 hover:scale-105'
                    }`}
                    aria-label={item.tipo === 'video' ? 'Ver vídeo' : `Imagem ${i + 1}`}
                  >
                    {item.tipo === 'video' ? (
                      <>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt="thumb vídeo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-900" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40">
                          <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                            <Play size={10} fill="currentColor" className="text-gray-800 ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <Image
                        src={item.url}
                        alt={`thumb ${i + 1}`}
                        fill
                        className="object-contain p-1.5"
                        unoptimized
                      />
                    )}
                    {isAtivo && (
                      <div className="absolute inset-0 ring-2 ring-[#3cbfb3] ring-inset rounded-xl pointer-events-none" />
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setAtivo(i => Math.min(itens.length - 1, i + 1))}
              disabled={ativo === itens.length - 1}
              className="shrink-0 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center
                         hover:bg-gray-200 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={14} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* ── BOTÃO "VER TODAS AS FOTOS" ────────────────────── */}
        {itens.length > MAX_THUMBS_INLINE && (
          <button
            onClick={() => abrirLightbox(0)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                       border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600
                       hover:border-[#3cbfb3]/50 hover:bg-[#3cbfb3]/5 hover:text-[#3cbfb3]
                       transition-all duration-200 group"
          >
            <Grid3X3 size={15} />
            Ver todas as {itens.filter(m => m.tipo === 'imagem').length} fotos
            {itens.some(m => m.tipo === 'video') && (
              <span className="text-gray-400">+ vídeo</span>
            )}
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* ═══════ LIGHTBOX ═══════ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ backgroundColor: 'rgba(0,0,0,0.97)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(60,191,179,0.18)' }}>
                {itemLb?.tipo === 'video'
                  ? <Play size={13} fill="white" className="text-white ml-0.5" />
                  : <ImageIcon size={13} className="text-[#3cbfb3]" />}
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">{nome}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {lbIndex + 1} / {itens.length}
                  {itemLb?.tipo === 'video' ? ' · Vídeo' : ' · Foto'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLightbox(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center
                         bg-white/10 hover:bg-white/20 text-white transition-all"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mídia principal */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden px-16 min-h-0">
            {/* Seta esquerda */}
            {itens.length > 1 && (
              <button
                onClick={lbAnterior}
                className="absolute left-3 z-10 w-12 h-12 rounded-full flex items-center justify-center
                           bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Anterior"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Conteúdo */}
            {itemLb?.tipo === 'imagem' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={itemLb.url}
                  alt={`${nome} — foto ${lbIndex + 1}`}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                  draggable={false}
                />
              </div>
            )}

            {itemLb?.tipo === 'video' && (() => {
              const ytId = extrairYtId(itemLb.url)
              return (
                <div className="w-full" style={{ maxWidth: 900 }}>
                  {ytId ? (
                    <div className="relative" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={ytEmbed(itemLb.url, true)}
                        className="absolute inset-0 w-full h-full rounded-xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`Vídeo — ${nome}`}
                      />
                    </div>
                  ) : isMP4(itemLb.url) ? (
                    <video
                      src={itemLb.url}
                      className="w-full rounded-xl"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : null}
                </div>
              )
            })()}

            {/* Seta direita */}
            {itens.length > 1 && (
              <button
                onClick={lbProximo}
                className="absolute right-3 z-10 w-12 h-12 rounded-full flex items-center justify-center
                           bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Próximo"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Faixa de thumbnails do lightbox */}
          {itens.length > 1 && (
            <div className="border-t border-white/10 px-4 py-3 shrink-0">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                {itens.map((item, i) => {
                  const thumb = item.tipo === 'video' ? getVideoThumb(item) : null
                  const isAtivo = i === lbIndex
                  return (
                    <button
                      key={i}
                      onClick={() => setLbIndex(i)}
                      className={`shrink-0 relative w-[56px] h-[56px] rounded-lg overflow-hidden
                                  border-2 transition-all duration-200 ${
                        isAtivo
                          ? 'border-[#3cbfb3] scale-105 opacity-100'
                          : 'border-white/20 opacity-50 hover:opacity-80 hover:border-white/50'
                      }`}
                    >
                      {item.tipo === 'video' ? (
                        <>
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover bg-gray-900" />
                          ) : (
                            <div className="w-full h-full bg-gray-900" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play size={10} fill="white" className="text-white ml-0.5" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.url}
                          alt={`thumb ${i + 1}`}
                          className="w-full h-full object-contain bg-gray-900 p-0.5"
                          draggable={false}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
