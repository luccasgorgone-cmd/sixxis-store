'use client'

import { useState, useEffect } from 'react'
import { Shield, ChevronDown, ChevronUp, X } from 'lucide-react'

interface ConsentState {
  necessarios: boolean
  analiticos: boolean
  marketing: boolean
}

const CONSENT_KEY = 'sixxis_cookie_consent'
const SESSION_KEY = 'sixxis_session_id'

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

async function salvarConsentimento(consent: ConsentState) {
  const sessionId = getSessionId()
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...consent, sessionId, timestamp: Date.now() }))
  try {
    await fetch('/api/cookies/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...consent }),
    })
  } catch {
    // silencioso
  }
}

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(false)
  const [expandido, setExpandido] = useState(false)
  const [consent, setConsent] = useState<ConsentState>({
    necessarios: true,
    analiticos: false,
    marketing: false,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY)
      if (!saved) {
        // Delay para não interferir com LCP
        const t = setTimeout(() => setVisivel(true), 800)
        return () => clearTimeout(t)
      }
    } catch {
      setVisivel(true)
    }
  }, [])

  if (!visivel) return null

  async function aceitarTodos() {
    const c: ConsentState = { necessarios: true, analiticos: true, marketing: true }
    await salvarConsentimento(c)
    setVisivel(false)
  }

  async function aceitarSelecionados() {
    await salvarConsentimento(consent)
    setVisivel(false)
  }

  async function rejeitarOpcionais() {
    const c: ConsentState = { necessarios: true, analiticos: false, marketing: false }
    await salvarConsentimento(c)
    setVisivel(false)
  }

  return (
    <>
      {/* Overlay sutil */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] pointer-events-none" aria-hidden="true" />

      {/* Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Preferências de cookies"
      >
        <div
          className="mx-auto max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(60,191,179,0.15)' }}
              >
                <Shield size={18} style={{ color: '#3cbfb3' }} />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-tight">Preferências de privacidade</h2>
                <p className="text-white/50 text-xs mt-0.5">Conforme a LGPD (Lei 13.709/2018)</p>
              </div>
            </div>
            <button
              onClick={rejeitarOpcionais}
              className="text-white/30 hover:text-white/60 transition mt-0.5 shrink-0"
              aria-label="Fechar e recusar cookies opcionais"
            >
              <X size={16} />
            </button>
          </div>

          {/* Texto */}
          <div className="px-6 pb-4">
            <p className="text-white/60 text-xs leading-relaxed">
              Usamos cookies para garantir a funcionalidade da loja, analisar o tráfego e personalizar sua experiência.
              Você pode escolher quais categorias aceitar. Os cookies necessários não podem ser desativados.
            </p>
          </div>

          {/* Categorias expansíveis */}
          <div className="px-6 pb-4">
            <button
              onClick={() => setExpandido(!expandido)}
              className="flex items-center gap-1.5 text-xs font-semibold transition"
              style={{ color: '#3cbfb3' }}
            >
              {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expandido ? 'Ocultar categorias' : 'Personalizar cookies'}
            </button>

            {expandido && (
              <div className="mt-4 space-y-3">
                {/* Necessários */}
                <div
                  className="flex items-start justify-between gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <div>
                    <p className="text-white text-xs font-semibold">Cookies necessários</p>
                    <p className="text-white/40 text-xs mt-0.5">Login, carrinho, preferências básicas. Sempre ativos.</p>
                  </div>
                  <div
                    className="w-9 h-5 rounded-full flex items-center px-0.5 shrink-0 mt-0.5 cursor-not-allowed"
                    style={{ backgroundColor: '#3cbfb3' }}
                  >
                    <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                  </div>
                </div>

                {/* Analíticos */}
                <div
                  className="flex items-start justify-between gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <div>
                    <p className="text-white text-xs font-semibold">Cookies analíticos</p>
                    <p className="text-white/40 text-xs mt-0.5">Páginas visitadas, tempo de sessão, eventos de navegação.</p>
                  </div>
                  <button
                    onClick={() => setConsent((p) => ({ ...p, analiticos: !p.analiticos }))}
                    className="w-9 h-5 rounded-full flex items-center px-0.5 shrink-0 mt-0.5 transition-colors"
                    style={{ backgroundColor: consent.analiticos ? '#3cbfb3' : 'rgba(255,255,255,0.15)' }}
                    aria-pressed={consent.analiticos}
                  >
                    <div
                      className="w-4 h-4 bg-white rounded-full transition-transform"
                      style={{ transform: consent.analiticos ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {/* Marketing */}
                <div
                  className="flex items-start justify-between gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <div>
                    <p className="text-white text-xs font-semibold">Cookies de marketing</p>
                    <p className="text-white/40 text-xs mt-0.5">Anúncios personalizados e remarketing.</p>
                  </div>
                  <button
                    onClick={() => setConsent((p) => ({ ...p, marketing: !p.marketing }))}
                    className="w-9 h-5 rounded-full flex items-center px-0.5 shrink-0 mt-0.5 transition-colors"
                    style={{ backgroundColor: consent.marketing ? '#3cbfb3' : 'rgba(255,255,255,0.15)' }}
                    aria-pressed={consent.marketing}
                  >
                    <div
                      className="w-4 h-4 bg-white rounded-full transition-transform"
                      style={{ transform: consent.marketing ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="px-6 pb-5 flex flex-col sm:flex-row gap-2">
            <button
              onClick={aceitarTodos}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 14px rgba(60,191,179,0.30)' }}
            >
              Aceitar todos
            </button>
            {expandido ? (
              <button
                onClick={aceitarSelecionados}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.80)' }}
              >
                Salvar preferências
              </button>
            ) : (
              <button
                onClick={rejeitarOpcionais}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.80)' }}
              >
                Apenas necessários
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
