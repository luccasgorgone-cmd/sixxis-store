'use client'

import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'

interface PopupConfig {
  ativado:        boolean
  bannerDesktop?: string | null
  bannerMobile?:  string | null
  altText?:       string | null
  linkDestino?:   string | null
  abrirNovaAba?:  boolean
  titulo?:        string | null
  texto?:         string | null
  corBotao?:      string | null
  textoBotao?:    string | null
  delaySegundos?: number
  frequencia?:    'sessao' | 'dia' | 'semana'
  paginas?:       string[]
}

const KEY_SESSAO = 'popup-fechado-sessao'
const KEY_DIA    = 'popup-ultimo-dia'
const KEY_SEMANA = 'popup-ultima-semana'

function paginaAtualMatch(paginas: string[] | undefined): boolean {
  if (!paginas || paginas.length === 0) return false
  if (paginas.includes('*')) return true
  const path = window.location.pathname
  if (paginas.includes('home') && (path === '/' || path === '')) return true
  return paginas.some((p) => p !== 'home' && p !== '*' && path.startsWith('/' + p))
}

function jaFechouNoPeriodo(freq: PopupConfig['frequencia']): boolean {
  if (typeof window === 'undefined') return true
  if (sessionStorage.getItem(KEY_SESSAO)) return true
  if (freq === 'dia') {
    const ultimo = localStorage.getItem(KEY_DIA)
    if (ultimo === new Date().toDateString()) return true
  }
  if (freq === 'semana') {
    const ultimo = localStorage.getItem(KEY_SEMANA)
    const semana = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    if (ultimo === String(semana)) return true
  }
  return false
}

export default function PopupInicial() {
  const [config, setConfig] = useState<PopupConfig | null>(null)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    let cancelado = false
    if (jaFechouNoPeriodo(undefined)) return

    fetch('/api/popup-inicial')
      .then((r) => r.json())
      .then((c: PopupConfig) => {
        if (cancelado || !c.ativado) return
        if (!paginaAtualMatch(c.paginas)) return
        if (jaFechouNoPeriodo(c.frequencia)) return
        setConfig(c)
        const delay = (c.delaySegundos ?? 3) * 1000
        const t = setTimeout(() => setAberto(true), delay)
        return () => clearTimeout(t)
      })
      .catch(() => {})
    return () => { cancelado = true }
  }, [])

  const fechar = useCallback(() => {
    sessionStorage.setItem(KEY_SESSAO, '1')
    if (config?.frequencia === 'dia') {
      localStorage.setItem(KEY_DIA, new Date().toDateString())
    }
    if (config?.frequencia === 'semana') {
      const semana = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
      localStorage.setItem(KEY_SEMANA, String(semana))
    }
    setAberto(false)
  }, [config])

  // Escape pra fechar
  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, fechar])

  if (!aberto || !config) return null

  const banner = config.bannerDesktop || config.bannerMobile
  const link = config.linkDestino || undefined
  const target = config.abrirNovaAba ? '_blank' : '_self'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-titulo"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) fechar() }}
    >
      <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={fechar}
          aria-label="Fechar pop-up"
          className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
        >
          <X size={18} />
        </button>

        {banner && (
          link ? (
            <a href={link} target={target} rel={target === '_blank' ? 'noopener' : undefined} onClick={fechar} className="block">
              <picture>
                {config.bannerMobile && <source media="(max-width: 768px)" srcSet={config.bannerMobile} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.bannerDesktop || config.bannerMobile || ''} alt={config.altText || ''} className="w-full h-auto block" />
              </picture>
            </a>
          ) : (
            <picture>
              {config.bannerMobile && <source media="(max-width: 768px)" srcSet={config.bannerMobile} />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.bannerDesktop || config.bannerMobile || ''} alt={config.altText || ''} className="w-full h-auto block" />
            </picture>
          )
        )}

        {(config.titulo || config.texto || config.textoBotao) && (
          <div className="p-7 text-center">
            {config.titulo && (
              <h2 id="popup-titulo" className="text-xl sm:text-2xl font-black text-gray-900 mb-3">
                {config.titulo}
              </h2>
            )}
            {config.texto && (
              <div
                className="text-gray-700 text-sm sm:text-base mb-5 prose prose-sm max-w-none mx-auto"
                dangerouslySetInnerHTML={{ __html: config.texto }}
              />
            )}
            {config.textoBotao && (
              <a
                href={link || '#'}
                target={target}
                rel={target === '_blank' ? 'noopener' : undefined}
                onClick={fechar}
                className="inline-block px-7 py-3 rounded-xl font-bold text-sm sm:text-base text-white shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: config.corBotao || '#3cbfb3' }}
              >
                {config.textoBotao}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
