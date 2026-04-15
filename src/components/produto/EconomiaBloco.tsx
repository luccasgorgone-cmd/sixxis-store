'use client'
import { useState, useRef, useEffect } from 'react'
import { Zap, TrendingDown, Clock, BadgePercent } from 'lucide-react'

// ── Dados de AC por modelo (consumo real em watts)
const AC_POR_MODELO: Record<string, { btu: number; consumoW: number; descricaoAC: string }> = {
  'm45':         { btu: 9000,  consumoW: 870,  descricaoAC: '9.000 BTU Inverter' },
  'sx040':       { btu: 9000,  consumoW: 870,  descricaoAC: '9.000 BTU Inverter' },
  'sx060':       { btu: 12000, consumoW: 1100, descricaoAC: '12.000 BTU Inverter' },
  'sx070':       { btu: 12000, consumoW: 1100, descricaoAC: '12.000 BTU Inverter' },
  'sx100':       { btu: 15000, consumoW: 1400, descricaoAC: '15.000 BTU Inverter' },
  'sx120':       { btu: 18000, consumoW: 1700, descricaoAC: '18.000 BTU Inverter' },
  'sx200-trend': { btu: 22000, consumoW: 2000, descricaoAC: '22.000 BTU Inverter' },
  'sx200-prime': { btu: 30000, consumoW: 2800, descricaoAC: '30.000 BTU Inverter' },
}

const TARIFA = 0.85
const HORAS_MES = 240 // 8h/dia × 30 dias

function resolverChave(slug: string): string {
  const s = slug.toLowerCase()
  if (s.includes('sx200') && s.includes('prime')) return 'sx200-prime'
  if (s.includes('sx200')) return 'sx200-trend'
  if (s.includes('sx120')) return 'sx120'
  if (s.includes('sx100')) return 'sx100'
  if (s.includes('sx070')) return 'sx070'
  if (s.includes('sx060')) return 'sx060'
  if (s.includes('sx040')) return 'sx040'
  if (s.includes('m45'))   return 'm45'
  return ''
}

const fmt = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  slug: string
  consumoW: number
  preco: number
}

export function EconomiaBloco({ slug, consumoW, preco }: Props) {
  const [visivel, setVisivel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Animar entrada via IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisivel(true); obs.disconnect() }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const chave = resolverChave(slug)
  const ac = AC_POR_MODELO[chave]
  if (!ac || !consumoW) return null

  const custoAC   = (ac.consumoW   / 1000) * HORAS_MES * TARIFA
  const custoClim = (consumoW      / 1000) * HORAS_MES * TARIFA
  const econMes   = custoAC - custoClim
  const econAno   = econMes * 12
  const pctEcon   = Math.round((econMes / custoAC) * 100)
  const mesesPay  = econMes > 0 ? Math.ceil(preco / econMes) : 0

  return (
    <div
      ref={ref}
      className="my-8 transition-all duration-700"
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? 'translateY(0)' : 'translateY(24px)'
      }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#e8f8f7' }}
        >
          <Zap size={17} style={{ color: '#3cbfb3' }} />
        </div>
        <div>
          <h3 className="text-base font-black text-gray-900 leading-tight">
            Quanto você economiza por mês?
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            vs Split {ac.descricaoAC} · 8h/dia · tarifa R$0,85/kWh
          </p>
        </div>
      </div>

      {/* GRID PRINCIPAL — 3 colunas: AC | VS | Sixxis */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4">

        {/* AC */}
        <div className="rounded-2xl border border-red-100 p-4 text-center"
          style={{ backgroundColor: '#fff5f5' }}>
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">
            Ar-condicionado
          </p>
          <p className="text-[11px] text-red-300 mb-3 leading-tight">{ac.descricaoAC}</p>
          <p className="text-2xl font-black text-red-500 leading-none">
            {fmt(custoAC)}
          </p>
          <p className="text-[10px] text-red-300 mt-1">por mês</p>
          <p className="text-[9px] text-red-200 mt-0.5">
            {(ac.consumoW / 1000).toFixed(2).replace('.', ',')} kW/h
          </p>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-black text-gray-300 bg-gray-100 rounded-full px-2 py-1">
            VS
          </span>
        </div>

        {/* Climatizador */}
        <div
          className="rounded-2xl border p-4 text-center"
          style={{ backgroundColor: '#f0fffe', borderColor: '#b2e8e4' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-2"
            style={{ color: '#0f6b64' }}>
            Climatizador Sixxis
          </p>
          <p className="text-[11px] mb-3 leading-tight" style={{ color: '#3cbfb3' }}>
            Este produto
          </p>
          <p className="text-2xl font-black leading-none" style={{ color: '#0f2e2b' }}>
            {fmt(custoClim)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#3cbfb3' }}>por mês</p>
          <p className="text-[9px] mt-0.5" style={{ color: '#7dd3cc' }}>
            {(consumoW / 1000).toFixed(3).replace(/\.?0+$/, '').replace('.', ',')} kW/h
          </p>
        </div>
      </div>

      {/* BARRA DE ECONOMIA */}
      <div
        className="rounded-2xl border p-4 mb-4"
        style={{ backgroundColor: '#f0fff8', borderColor: '#a7f3d0' }}
      >
        {/* Valor de economia */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">
              Você economiza
            </p>
            <p className="text-2xl font-black text-emerald-700 leading-none">
              {fmt(econMes)}
              <span className="text-sm font-semibold text-emerald-500 ml-1">/mês</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-emerald-500 mb-0.5">Por ano</p>
            <p className="text-lg font-black text-emerald-700">{fmt(econAno)}</p>
          </div>
        </div>

        {/* Barra visual */}
        <div className="mb-2">
          <div className="h-2.5 bg-white rounded-full overflow-hidden border border-emerald-100">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: visivel ? `${100 - pctEcon}%` : '0%',
                background: 'linear-gradient(90deg, #10b981, #3cbfb3)',
                transitionDelay: '300ms'
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-emerald-400 mt-1">
            <span>Climatizador: {fmt(custoClim)}</span>
            <span>{pctEcon}% mais barato</span>
          </div>
        </div>
      </div>

      {/* MÉTRICAS EM CARDS HORIZONTAIS */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {
            icon: TrendingDown,
            label: 'Redução na conta',
            valor: `${pctEcon}%`,
            cor: '#10b981',
            bg: '#f0fff8'
          },
          {
            icon: BadgePercent,
            label: 'Economia/ano',
            valor: fmt(econAno).replace('R$ ', 'R$'),
            cor: '#3cbfb3',
            bg: '#f0fffe'
          },
          {
            icon: Clock,
            label: 'Payback',
            valor: mesesPay < 12
              ? `${mesesPay} meses`
              : `${(mesesPay / 12).toFixed(1)} anos`,
            cor: '#0f2e2b',
            bg: '#f8fafc'
          },
        ].map((m, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 p-3 text-center"
            style={{ backgroundColor: m.bg }}
          >
            <m.icon size={14} className="mx-auto mb-1.5" style={{ color: m.cor }} />
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">
              {m.label}
            </p>
            <p className="text-sm font-black leading-none" style={{ color: m.cor }}>
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* NOTA DE TRANSPARÊNCIA */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5">
        <p className="text-[9px] text-gray-400 text-center leading-relaxed">
          * Consumo do AC calculado para Split Inverter {ac.descricaoAC} ({ac.consumoW}W).
          Cálculo baseado em 8h/dia × 30 dias × R$0,85/kWh (tarifa média ANEEL 2024).
          Consumo real pode variar.
        </p>
      </div>
    </div>
  )
}
