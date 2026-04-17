'use client'
import { useState, useRef, useEffect } from 'react'
import { TrendingDown, AirVent, Wind, Zap } from 'lucide-react'

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

// ── REGRAS DE ECONOMIA — NUNCA ALTERAR
const TARIFA = 0.85     // R$/kWh
const HORAS_DIA = 8
const DIAS_MES = 30

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
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  slug: string
  consumoW: number   // Potência em Watts (do campo Potência, NUNCA da Vazão de Ar)
  preco: number
}

export function EconomiaBloco({ slug, consumoW, preco }: Props) {
  const [visivel, setVisivel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  const custoAC      = (ac.consumoW / 1000) * HORAS_DIA * DIAS_MES * TARIFA
  const custoProduto = (consumoW    / 1000) * HORAS_DIA * DIAS_MES * TARIFA
  const economiaMes  = custoAC - custoProduto
  const economiaAno  = economiaMes * 12
  const percentual   = Math.round((economiaMes / custoAC) * 100)
  const retornoAnos  = economiaAno > 0 ? (preco / economiaAno).toFixed(1) : '—'

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-gray-100 bg-white overflow-hidden mt-8 transition-all duration-700"
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      {/* Topo escuro com título */}
      <div className="bg-gradient-to-r from-[#0f2e2b] to-[#1a4f4a] px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingDown size={18} className="text-[#3cbfb3]" />
          <h3 className="text-white font-bold text-base">
            Quanto você economiza por mês?
          </h3>
        </div>
        <p className="text-white/60 text-xs mt-1">
          vs Split {ac.descricaoAC} · {HORAS_DIA}h/dia · tarifa R$ {TARIFA.toFixed(2)}/kWh
        </p>
      </div>

      {/* Comparação lado a lado */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Lado AC */}
        <div className="p-4 text-center bg-gray-50">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <AirVent size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Ar-condicionado</span>
          </div>
          <p className="text-xs text-gray-400 mb-1">Split {ac.descricaoAC}</p>
          <p className="text-2xl font-bold text-gray-700">
            R$ {fmt(custoAC)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">por mês</p>
          <div className="mt-2 inline-flex items-center gap-1 bg-red-50 text-red-500 text-[11px] font-medium px-2 py-0.5 rounded-full">
            <Zap size={10} />
            {ac.consumoW}W de consumo
          </div>
        </div>

        {/* Lado Sixxis */}
        <div className="p-4 text-center bg-white">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Wind size={14} className="text-[#3cbfb3]" />
            <span className="text-xs font-medium text-[#3cbfb3]">Climatizador Sixxis</span>
          </div>
          <p className="text-xs text-gray-400 mb-1">Este produto</p>
          <p className="text-2xl font-bold text-[#3cbfb3]">
            R$ {fmt(custoProduto)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">por mês</p>
          <div className="mt-2 inline-flex items-center gap-1 bg-[#3cbfb3]/10 text-[#3cbfb3] text-[11px] font-medium px-2 py-0.5 rounded-full">
            <Zap size={10} />
            {consumoW}W de consumo
          </div>
        </div>
      </div>

      {/* Banner de economia */}
      <div className="bg-[#3cbfb3] px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-white/80 text-xs">Você economiza</p>
          <p className="text-white text-xl font-bold">
            R$ {fmt(economiaMes)}/mês
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-xs">Por ano</p>
          <p className="text-white text-xl font-bold">
            R$ {fmt(economiaAno)}
          </p>
        </div>
      </div>

      {/* Métricas em 3 colunas */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
        <div className="p-3 text-center">
          <p className="text-[11px] text-gray-400">Redução na conta</p>
          <p className="text-lg font-bold text-[#3cbfb3]">{percentual}%</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-[11px] text-gray-400">Economia/ano</p>
          <p className="text-lg font-bold text-gray-700">
            R${(economiaAno / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-[11px] text-gray-400">Produto se paga em</p>
          <p className="text-lg font-bold text-gray-700">{retornoAnos} anos</p>
        </div>
      </div>

      {/* Rodapé de disclaimer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          * Consumo AC calculado para Split Inverter {ac.descricaoAC} ({ac.consumoW}W).
          Baseado em {HORAS_DIA}h/dia × {DIAS_MES} dias × R$ {TARIFA.toFixed(2)}/kWh (tarifa ANEEL 2024).
          Consumo real pode variar conforme uso.
        </p>
      </div>
    </div>
  )
}
