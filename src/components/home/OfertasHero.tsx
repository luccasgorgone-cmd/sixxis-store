'use client'

import { useState, useEffect } from 'react'

function TimerBloco({ valor, label }: { valor: number; label: string }) {
  const str = String(valor).padStart(2, '0')
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1a3d38, #0f2e2b)',
          border: '1px solid rgba(60,191,179,0.2)',
          boxShadow: '0 0 20px rgba(60,191,179,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/30 z-10" />
        <div className="absolute top-0 inset-x-0 h-1/2 bg-white/5 rounded-t-2xl" />
        <span className="text-2xl font-black text-white relative z-20 tracking-widest tabular-nums leading-none">
          {str}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mt-1.5">{label}</span>
    </div>
  )
}

export default function OfertasHero({ targetDate }: { targetDate: string }) {
  const [horas,    setHoras]    = useState(0)
  const [minutos,  setMinutos]  = useState(0)
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    const calcular = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now())
      setHoras(Math.floor(diff / 3600000))
      setMinutos(Math.floor((diff % 3600000) / 60000))
      setSegundos(Math.floor((diff % 60000) / 1000))
    }
    calcular()
    const t = setInterval(calcular, 1000)
    return () => clearInterval(t)
  }, [targetDate])

  return (
    <section
      className="relative rounded-2xl overflow-hidden mb-10 text-center py-14 px-6"
      style={{ background: 'linear-gradient(135deg, #0b1f1d 0%, #0f2e2b 40%, #111 100%)' }}
    >
      {/* Decorações de fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10"
          style={{ background: 'radial-gradient(ellipse at right center, #3cbfb3 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#3cbfb3 1px, transparent 1px), linear-gradient(90deg, #3cbfb3 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        <svg className="absolute left-6 top-6 opacity-15" width="60" height="100" viewBox="0 0 60 100" fill="#ffd700">
          <path d="M35 0L5 55H30L15 100L55 40H28L35 0Z" />
        </svg>
        <svg className="absolute right-8 bottom-8 opacity-10" width="40" height="70" viewBox="0 0 60 100" fill="#3cbfb3">
          <path d="M35 0L5 55H30L15 100L55 40H28L35 0Z" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30
                        text-red-400 text-xs font-black uppercase tracking-widest px-3 py-1.5
                        rounded-full mb-5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Oferta por tempo limitado
        </div>

        {/* Título */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg width="28" height="46" viewBox="0 0 60 100" fill="#ffd700">
            <path d="M35 0L5 55H30L15 100L55 40H28L35 0Z" />
          </svg>
          <h1 className="text-4xl font-black text-white tracking-tight">Oferta Relâmpago</h1>
          <svg width="28" height="46" viewBox="0 0 60 100" fill="#ffd700">
            <path d="M35 0L5 55H30L15 100L55 40H28L35 0Z" />
          </svg>
        </div>
        <p className="text-white/50 mb-6">Preços imperdíveis por tempo limitado</p>

        {/* Timer */}
        <div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Termina em</p>
          <div className="flex items-center gap-2 justify-center">
            <TimerBloco valor={horas} label="H" />
            <span className="text-2xl font-black text-[#3cbfb3] animate-pulse mb-3">:</span>
            <TimerBloco valor={minutos} label="MIN" />
            <span className="text-2xl font-black text-[#3cbfb3] animate-pulse mb-3">:</span>
            <TimerBloco valor={segundos} label="SEG" />
          </div>
        </div>
      </div>
    </section>
  )
}
