'use client'

import { useState } from 'react'

function WaIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="white" width={size} height={size} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
    </svg>
  )
}

export default function WhatsAppButton() {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Sub-botões — visíveis quando aberto */}
      {aberto && (
        <>
          {/* Assistência Técnica */}
          <a
            href="https://wa.me/5511934102621"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[#0a0a0a] hover:bg-gray-800 text-white text-sm font-semibold pl-3 pr-4 py-2.5 rounded-2xl shadow-xl transition-all animate-fade-in-up border border-white/10"
            aria-label="WhatsApp Assistência Técnica"
          >
            <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
              <WaIcon size={16} />
            </span>
            <div>
              <p className="leading-none">Assistência Técnica</p>
              <p className="text-gray-400 text-xs mt-0.5">(11) 93410-2621</p>
            </div>
          </a>

          {/* Vendas */}
          <a
            href="https://wa.me/5518997474701"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-semibold pl-3 pr-4 py-2.5 rounded-2xl shadow-xl transition-all animate-fade-in-up"
            aria-label="WhatsApp Vendas"
          >
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <WaIcon size={16} />
            </span>
            <div>
              <p className="leading-none">Vendas</p>
              <p className="text-white/70 text-xs mt-0.5">(18) 99747-4701</p>
            </div>
          </a>
        </>
      )}

      {/* Botão principal */}
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? 'Fechar atendimento' : 'Atendimento WhatsApp'}
        className={`wa-pulse w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 ${
          aberto ? 'bg-gray-700 wa-pulse-off' : 'bg-[#25D366]'
        }`}
        style={{ animation: aberto ? 'none' : undefined }}
      >
        {aberto ? (
          <svg viewBox="0 0 24 24" fill="white" width="22" height="22" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <WaIcon size={26} />
        )}
      </button>
    </div>
  )
}
