'use client'
import { useState, useRef, useEffect } from 'react'
import { TrendingDown, AirVent, Wind, Zap, BadgeCheck } from 'lucide-react'

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
      className="mt-8 transition-all duration-700"
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      {/* Card interno sobre o wallpaper */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '2px solid #0f2e2b' }}
      >
        {/* Cabeçalho com título + badge */}
        <div className="px-4 sm:px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <TrendingDown size={20} strokeWidth={2} color="#0f2e2b" className="mt-0.5 shrink-0 sm:w-6 sm:h-6" />
              <h3 className="font-bold text-sm sm:text-base leading-snug" style={{ color: '#0f2e2b' }}>
                Faça as contas: quanto você deixa de pagar por mês
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs mt-1 leading-snug" style={{ color: '#0f2e2b', opacity: 0.75 }}>
              Comparação real com ar-condicionado split 9.000 BTU, 8h/dia, 30 dias — tarifa R$ 0,85/kWh
            </p>
          </div>
          <span
            className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0"
            style={{ backgroundColor: '#0f2e2b', color: '#3cbfb3' }}
          >
            <BadgeCheck size={14} strokeWidth={2.5} />
            Economia comprovada
          </span>
        </div>

        {/* Valor em destaque */}
        <div className="px-4 sm:px-5 pb-5 text-center">
          <p className="font-bold leading-none text-4xl sm:text-[56px]" style={{ color: '#0f2e2b' }}>
            R$ {fmt(economiaMes)}
          </p>
          <p className="text-sm font-semibold mt-2" style={{ color: '#0f2e2b' }}>
            você economiza <span className="opacity-80">por mês</span>
          </p>
        </div>

        {/* MOBILE: cards empilhados Ar-condicionado vs Climatizador */}
        <div className="md:hidden px-4 pb-5 space-y-2">
          {/* Card AC */}
          <div className="rounded-xl p-3" style={{ border: '1px solid rgba(15,46,43,0.20)', backgroundColor: 'rgba(15,46,43,0.03)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AirVent size={18} strokeWidth={2} color="#0f2e2b" />
              <span className="font-bold text-sm" style={{ color: '#0f2e2b' }}>Ar-condicionado</span>
              <span className="ml-auto text-[10px]" style={{ color: '#0f2e2b', opacity: 0.6 }}>{ac.descricaoAC}</span>
            </div>
            <dl className="text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <dt style={{ color: '#0f2e2b', opacity: 0.75 }}>Consumo</dt>
                <dd className="font-semibold" style={{ color: '#0f2e2b' }}>{ac.consumoW} W</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt style={{ color: '#0f2e2b', opacity: 0.75 }}>Custo / mês</dt>
                <dd className="font-semibold" style={{ color: '#0f2e2b' }}>R$ {fmt(custoAC)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt style={{ color: '#0f2e2b', opacity: 0.75 }}>Custo / ano</dt>
                <dd className="font-semibold" style={{ color: '#0f2e2b' }}>R$ {fmt(custoAC * 12)}</dd>
              </div>
            </dl>
          </div>

          {/* Card Climatizador Sixxis (destaque tiffany) */}
          <div className="rounded-xl p-3 relative" style={{ border: '2px solid #3cbfb3', backgroundColor: 'rgba(60,191,179,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Wind size={18} strokeWidth={2} color="#0f2e2b" />
              <span className="font-bold text-sm" style={{ color: '#0f2e2b' }}>Climatizador Sixxis</span>
            </div>
            <div className="flex justify-center mb-2">
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black"
                style={{ backgroundColor: '#3cbfb3', color: '#ffffff' }}
              >
                {percentual}% mais econômico
              </span>
            </div>
            <dl className="text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <dt style={{ color: '#0f2e2b', opacity: 0.75 }}>Consumo</dt>
                <dd className="font-bold" style={{ color: '#3cbfb3' }}>{consumoW} W</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt style={{ color: '#0f2e2b', opacity: 0.75 }}>Custo / mês</dt>
                <dd className="font-bold" style={{ color: '#3cbfb3' }}>R$ {fmt(custoProduto)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt style={{ color: '#0f2e2b', opacity: 0.75 }}>Custo / ano</dt>
                <dd className="font-bold" style={{ color: '#3cbfb3' }}>R$ {fmt(custoProduto * 12)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* DESKTOP: tabela comparativa */}
        <div className="hidden md:block px-5 pb-5">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(15,46,43,0.30)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15,46,43,0.30)' }}>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: '#0f2e2b' }}></th>
                  <th className="text-center px-3 py-2 font-semibold" style={{ color: '#0f2e2b' }}>
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <AirVent size={24} strokeWidth={2} color="#0f2e2b" />
                      Ar-condicionado
                    </div>
                  </th>
                  <th className="text-center px-3 py-2 font-semibold" style={{ color: '#0f2e2b' }}>
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <Wind size={24} strokeWidth={2} color="#0f2e2b" />
                      Climatizador Sixxis
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(15,46,43,0.30)' }}>
                  <td className="px-3 py-2.5" style={{ color: '#0f2e2b' }}>Consumo</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#0f2e2b' }}>{ac.consumoW}W</td>
                  <td className="px-3 py-2.5 text-center font-bold" style={{ color: '#3cbfb3' }}>{consumoW}W</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(15,46,43,0.30)' }}>
                  <td className="px-3 py-2.5" style={{ color: '#0f2e2b' }}>Custo por mês</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#0f2e2b' }}>R$ {fmt(custoAC)}</td>
                  <td className="px-3 py-2.5 text-center font-bold" style={{ color: '#3cbfb3' }}>R$ {fmt(custoProduto)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(15,46,43,0.30)' }}>
                  <td className="px-3 py-2.5" style={{ color: '#0f2e2b' }}>Custo por ano</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#0f2e2b' }}>R$ {fmt(custoAC * 12)}</td>
                  <td className="px-3 py-2.5 text-center font-bold" style={{ color: '#3cbfb3' }}>R$ {fmt(custoProduto * 12)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5" style={{ color: '#0f2e2b' }}>Redução</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#0f2e2b' }}>—</td>
                  <td className="px-3 py-2.5 text-center font-bold" style={{ color: '#3cbfb3' }}>{percentual}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Métricas em 3 colunas — items-stretch + min-h pra altura igual,
            flex-col + justify-between alinha label no topo e valor no rodape */}
        <div className="grid grid-cols-3 items-stretch" style={{ borderTop: '1px solid rgba(15,46,43,0.30)' }}>
          <div className="p-3 text-center flex flex-col justify-between min-h-[80px]" style={{ borderRight: '1px solid rgba(15,46,43,0.30)' }}>
            <p className="text-[10px] sm:text-[11px] leading-tight" style={{ color: '#0f2e2b', opacity: 0.75 }}>Economia/mês</p>
            <p className="text-base sm:text-lg font-bold mt-1" style={{ color: '#3cbfb3' }}>R$ {fmt(economiaMes)}</p>
          </div>
          <div className="p-3 text-center flex flex-col justify-between min-h-[80px]" style={{ borderRight: '1px solid rgba(15,46,43,0.30)' }}>
            <p className="text-[10px] sm:text-[11px] leading-tight" style={{ color: '#0f2e2b', opacity: 0.75 }}>Economia/ano</p>
            <p className="text-base sm:text-lg font-bold mt-1" style={{ color: '#3cbfb3' }}>
              R$ {(economiaAno / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="p-3 text-center flex flex-col justify-between min-h-[80px]">
            <p className="text-[10px] sm:text-[11px] leading-tight" style={{ color: '#0f2e2b', opacity: 0.75 }}>Produto se<br />paga em</p>
            <p className="text-base sm:text-lg font-bold mt-1" style={{ color: '#0f2e2b' }}>{retornoAnos} anos</p>
          </div>
        </div>

        {/* Rodapé de disclaimer */}
        <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(15,46,43,0.30)', backgroundColor: 'rgba(15,46,43,0.04)' }}>
          <p className="text-[10px] leading-relaxed flex items-center gap-1.5" style={{ color: '#0f2e2b', opacity: 0.70 }}>
            <Zap size={24} strokeWidth={2} color="#0f2e2b" style={{ width: 12, height: 12, flexShrink: 0 }} />
            Consumo AC calculado para Split Inverter {ac.descricaoAC} ({ac.consumoW}W).
            Baseado em {HORAS_DIA}h/dia × {DIAS_MES} dias × R$ {TARIFA.toFixed(2)}/kWh (tarifa ANEEL 2024).
            Consumo real pode variar conforme uso.
          </p>
        </div>
      </div>
    </div>
  )
}
