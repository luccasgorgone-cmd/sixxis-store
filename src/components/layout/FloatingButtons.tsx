'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import WhatsAppBotao from './WhatsAppBotao'

const LunaWidget = dynamic(() => import('./LunaWidget'), { ssr: false, loading: () => null })

interface Props {
  agenteAtivo: boolean
}

export default function FloatingButtons({ agenteAtivo }: Props) {
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [lunaOculta, setLunaOculta]   = useState(false)
  const observerRef = useRef<MutationObserver | null>(null)

  // Load hide states from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    setLunaOculta(localStorage.getItem('sixxis_luna_oculto') === '1')
  }, [])

  // Watch for data-drawer-open on body
  useEffect(() => {
    function sync() {
      setDrawerAberto(document.body.hasAttribute('data-drawer-open'))
    }
    sync()
    observerRef.current = new MutationObserver(sync)
    observerRef.current.observe(document.body, { attributes: true, attributeFilter: ['data-drawer-open'] })
    return () => observerRef.current?.disconnect()
  }, [])

  // Hide everything on mobile when drawer is open
  const containerStyle: React.CSSProperties = {
    right: drawerAberto ? 'calc(420px + 24px)' : '24px',
    transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  if (drawerAberto && typeof window !== 'undefined' && window.innerWidth < 768) {
    containerStyle.display = 'none'
  }

  function ocultarLuna() {
    setLunaOculta(true)
    localStorage.setItem('sixxis_luna_oculto', '1')
  }

  return (
    <div
      className="fixed bottom-6 z-[999] flex flex-col-reverse items-end gap-3"
      style={containerStyle}
    >
      <WhatsAppBotao />

      {agenteAtivo && !lunaOculta && (
        <div className="relative group/luna">
          <button
            type="button"
            onClick={ocultarLuna}
            aria-label="Ocultar assistente"
            className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center opacity-0 group-hover/luna:opacity-100 transition-opacity duration-200 shadow-md hover:bg-gray-900"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d="M1 1l6 6M7 1L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <LunaWidget />
        </div>
      )}
    </div>
  )
}
