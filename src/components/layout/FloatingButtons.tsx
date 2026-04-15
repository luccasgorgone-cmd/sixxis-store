'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import WhatsAppBotao from './WhatsAppBotao'

const LunaWidget = dynamic(() => import('./LunaWidget'), { ssr: false, loading: () => null })

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = 'sixxis_botoes_ocultos'

type BotaoOcultado = {
  wa: boolean
  luna: boolean
  expiresAt: number | null
}

function lerEstado(): BotaoOcultado {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { wa: false, luna: false, expiresAt: null }
    const parsed: BotaoOcultado = JSON.parse(raw)
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(LS_KEY)
      return { wa: false, luna: false, expiresAt: null }
    }
    return parsed
  } catch {
    return { wa: false, luna: false, expiresAt: null }
  }
}

function salvarEstado(estado: Omit<BotaoOcultado, 'expiresAt'>) {
  const comExpiracao: BotaoOcultado = { ...estado, expiresAt: Date.now() + 86400000 }
  localStorage.setItem(LS_KEY, JSON.stringify(comExpiracao))
}

function limparEstado() {
  localStorage.removeItem(LS_KEY)
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  agenteAtivo: boolean
}

export default function FloatingButtons({ agenteAtivo }: Props) {
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [oculto, setOculto] = useState<BotaoOcultado>({ wa: false, luna: false, expiresAt: null })
  const [toast, setToast] = useState<{ visivel: boolean; mensagem: string; tipo: 'wa' | 'luna' | null }>({
    visivel: false, mensagem: '', tipo: null,
  })
  const [toastProgress, setToastProgress] = useState(100)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastProgressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)

  // Migrate old keys + load state
  useEffect(() => {
    if (typeof window === 'undefined') return
    const waAntigo = localStorage.getItem('sixxis_wa_oculto')
    const lunaAntigo = localStorage.getItem('sixxis_luna_oculto')
    if (waAntigo !== null || lunaAntigo !== null) {
      const estadoMigrado: BotaoOcultado = {
        wa: waAntigo === 'true' || waAntigo === '1',
        luna: lunaAntigo === 'true' || lunaAntigo === '1',
        expiresAt: Date.now() + 86400000,
      }
      localStorage.setItem(LS_KEY, JSON.stringify(estadoMigrado))
      localStorage.removeItem('sixxis_wa_oculto')
      localStorage.removeItem('sixxis_luna_oculto')
      setOculto(estadoMigrado)
    } else {
      setOculto(lerEstado())
    }
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

  // Expose restore function globally
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sixxisRestaurarBotoes = restaurarTodos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => { delete (window as any).sixxisRestaurarBotoes }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (toastProgressRef.current) clearInterval(toastProgressRef.current)
    }
  }, [])

  // Hide everything on mobile when drawer is open
  const containerStyle: React.CSSProperties = {
    right: drawerAberto ? 'calc(420px + 24px)' : '24px',
    transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }
  if (drawerAberto && typeof window !== 'undefined' && window.innerWidth < 768) {
    containerStyle.display = 'none'
  }

  function ocultarBotao(tipo: 'wa' | 'luna') {
    const novoEstado = { ...oculto, [tipo]: true }
    setOculto({ ...novoEstado, expiresAt: Date.now() + 86400000 })
    salvarEstado(novoEstado)

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastProgressRef.current) clearInterval(toastProgressRef.current)
    setToastProgress(100)
    setToast({ visivel: true, mensagem: tipo === 'wa' ? 'WhatsApp ocultado' : 'Luna ocultada', tipo })

    let p = 100
    toastProgressRef.current = setInterval(() => {
      p -= 100 / 60
      setToastProgress(Math.max(0, p))
    }, 100)
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visivel: false }))
      if (toastProgressRef.current) clearInterval(toastProgressRef.current)
    }, 6000)
  }

  function desfazerOcultamento() {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastProgressRef.current) clearInterval(toastProgressRef.current)
    setOculto({ wa: false, luna: false, expiresAt: null })
    limparEstado()
    setToast({ visivel: false, mensagem: '', tipo: null })
  }

  function restaurarTodos() {
    setOculto({ wa: false, luna: false, expiresAt: null })
    limparEstado()
  }

  return (
    <>
      <div
        className="fixed bottom-6 z-[999] flex flex-col-reverse items-end gap-3"
        style={containerStyle}
      >
        {!oculto.wa && (
          <WhatsAppBotao onOcultar={() => ocultarBotao('wa')} />
        )}

        {agenteAtivo && !oculto.luna && (
          <div className="relative group/luna">
            <button
              type="button"
              onClick={() => ocultarBotao('luna')}
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

      {/* TOAST DESFAZER */}
      <div
        className={`fixed z-[10000] transition-all duration-300 ease-out ${
          toast.visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ bottom: '88px', right: '20px' }}
      >
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', minWidth: '240px' }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              {toast.tipo === 'wa' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="14" r="7" fill="#3cbfb3"/>
                  <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#3cbfb3"/>
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold leading-none">{toast.mensagem}</p>
              <p className="text-white/40 text-[10px] mt-0.5">Volta automaticamente em 24h</p>
            </div>
            <button
              onClick={desfazerOcultamento}
              className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
            >
              Desfazer ↩
            </button>
            <button
              onClick={() => setToast(prev => ({ ...prev, visivel: false }))}
              className="w-5 h-5 rounded-lg flex items-center justify-center text-white/30 hover:text-white transition-colors shrink-0"
            >
              <span className="text-[12px] leading-none">×</span>
            </button>
          </div>
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full transition-none"
              style={{ width: `${toastProgress}%`, backgroundColor: '#3cbfb3' }}
            />
          </div>
        </div>
      </div>

      {/* MINI-TAB LATERAL */}
      {(oculto.wa || oculto.luna) && (
        <div className="fixed z-[998] right-0 transition-all duration-300" style={{ bottom: '120px' }}>
          <button
            onClick={restaurarTodos}
            className="flex flex-col items-center gap-1.5 bg-white rounded-l-2xl shadow-xl px-2.5 py-3 border border-r-0 border-gray-100 hover:shadow-2xl hover:bg-[#f0fffe] transition-all duration-200 group"
            title="Restaurar botões de atendimento"
            aria-label="Restaurar atendimento"
          >
            <div className="flex flex-col items-center gap-1">
              {oculto.luna && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(145deg, #0f2e2b, #3cbfb3)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="14" r="7" fill="rgba(255,255,255,0.9)"/>
                    <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="rgba(255,255,255,0.7)"/>
                  </svg>
                </div>
              )}
              {oculto.wa && (
                <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  </svg>
                </div>
              )}
            </div>
            <p
              className="text-[8px] font-bold text-[#3cbfb3] leading-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
            >
              Atendimento
            </p>
          </button>
        </div>
      )}
    </>
  )
}
