'use client'

import { useState } from 'react'

// ── AC Equivalence Table ──────────────────────────────────────────────────────

const AC_TABLE = [
  { btu: 60000, area: 100, consumoW: 5500, preco: 9000 },
  { btu: 48000, area: 80,  consumoW: 4400, preco: 7000 },
  { btu: 36000, area: 60,  consumoW: 3300, preco: 5500 },
  { btu: 30000, area: 45,  consumoW: 2800, preco: 4500 },
  { btu: 24000, area: 35,  consumoW: 2200, preco: 3800 },
  { btu: 18000, area: 30,  consumoW: 1600, preco: 3000 },
  { btu: 12000, area: 20,  consumoW: 1100, preco: 2200 },
  { btu:  9000, area: 15,  consumoW:  900, preco: 1800 },
]

type AcItem = typeof AC_TABLE[number]

function calcularEquivalenteAC(areaM2: number): {
  combinacao: AcItem[]
  totalConsumoW: number
  totalPrecoEquipamentos: number
  totalPrecoInstalacao: number
} {
  let areaRestante = areaM2
  const combinacao: AcItem[] = []

  while (areaRestante > 0) {
    const acOtimo = AC_TABLE.find(ac => ac.area >= areaRestante) ?? AC_TABLE[0]
    combinacao.push(acOtimo)
    areaRestante -= acOtimo.area
    if (combinacao.length > 10) break // safety
  }

  return {
    combinacao,
    totalConsumoW: combinacao.reduce((s, ac) => s + ac.consumoW, 0),
    totalPrecoEquipamentos: combinacao.reduce((s, ac) => s + ac.preco, 0),
    totalPrecoInstalacao: combinacao.length * 400,
  }
}

function calcularCustoMensal(consumoW: number, horasDia = 8, diasMes = 30, tarifaKwh = 0.85): number {
  return (consumoW / 1000) * horasDia * diasMes * tarifaKwh
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  consumoW: number
  areaM2: number
  precoClimatizador: number
}

export default function EconomiaComparador({ consumoW, areaM2, precoClimatizador }: Props) {
  const { combinacao, totalConsumoW, totalPrecoEquipamentos, totalPrecoInstalacao } =
    calcularEquivalenteAC(areaM2)

  const custoMensalAC = calcularCustoMensal(totalConsumoW)
  const custoMensalClimatizador = calcularCustoMensal(consumoW)
  const economiaMensal = custoMensalAC - custoMensalClimatizador
  const economiaAnual = economiaMensal * 12
  const custoTotalAC = totalPrecoEquipamentos + totalPrecoInstalacao
  const mesesPayback = economiaMensal > 0 ? Math.ceil(precoClimatizador / economiaMensal) : 0
  const percentualEconomia = Math.round(100 - (custoMensalClimatizador / custoMensalAC) * 100)

  const [tabAtiva, setTabAtiva] = useState<'energia' | 'investimento'>('energia')

  const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR')

  return (
    <div
      className="rounded-2xl overflow-hidden border border-[#3cbfb3]/30 mt-6"
      style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#3cbfb3]/20 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3cbfb3" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white font-black text-sm">Quanto você economiza por mês?</h3>
            <p className="text-white/50 text-[11px]">Comparação real e transparente com ar-condicionado equivalente</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'energia', label: '⚡ Conta de Luz' },
          { id: 'investimento', label: '💸 Investimento' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabAtiva(tab.id as 'energia' | 'investimento')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
              tabAtiva === tab.id
                ? 'text-[#3cbfb3] border-b-2 border-[#3cbfb3]'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">

        {/* Transparência — qual AC foi usado */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/60 leading-relaxed">
            <span className="text-[#3cbfb3] font-bold">📐 Comparação justa:</span>{' '}
            Para cobrir <strong className="text-white">{areaM2}m²</strong>, você precisaria de{' '}
            {combinacao.length === 1 ? (
              <strong className="text-white">
                1 ar-condicionado de {(combinacao[0].btu / 1000).toFixed(0)} mil BTU
              </strong>
            ) : (
              <strong className="text-white">
                {combinacao.length} ares-condicionados:{' '}
                {combinacao.map(ac => `${(ac.btu / 1000).toFixed(0)}k BTU`).join(' + ')}
              </strong>
            )}.{' '}
            Consumo total: <strong className="text-white">{(totalConsumoW / 1000).toFixed(1)} kW/h</strong>.
          </p>
        </div>

        {tabAtiva === 'energia' && (
          <>
            {/* Comparativo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-red-300 text-[11px] font-bold uppercase tracking-wide mb-1">
                  {combinacao.length === 1 ? 'Ar-condicionado' : `${combinacao.length}× Ar-cond.`}
                </p>
                <p className="text-red-200 text-2xl font-black">R$ {fmt(custoMensalAC)}</p>
                <p className="text-red-300/70 text-[10px] mt-0.5">por mês</p>
                <p className="text-red-300/50 text-[10px]">{(totalConsumoW / 1000).toFixed(1)} kW/h</p>
              </div>
              <div className="bg-[#3cbfb3]/15 border border-[#3cbfb3]/40 rounded-xl p-4 text-center">
                <p className="text-[#3cbfb3] text-[11px] font-bold uppercase tracking-wide mb-1">Climatizador Sixxis</p>
                <p className="text-white text-2xl font-black">R$ {fmt(custoMensalClimatizador)}</p>
                <p className="text-[#3cbfb3]/70 text-[10px] mt-0.5">por mês</p>
                <p className="text-[#3cbfb3]/50 text-[10px]">{(consumoW / 1000).toFixed(3)} kW/h</p>
              </div>
            </div>

            {/* Economia */}
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-emerald-300 text-[11px] font-bold uppercase tracking-wide">Você economiza</p>
                  <p className="text-white text-3xl font-black mt-0.5">
                    R$ {fmt(economiaMensal)}<span className="text-lg font-semibold text-white/60">/mês</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-300 text-[11px]">Por ano:</p>
                  <p className="text-emerald-300 text-xl font-black">R$ {fmt(economiaAnual)}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                  <span>Climatizador Sixxis</span>
                  <span>{Math.round((custoMensalClimatizador / custoMensalAC) * 100)}% do custo do AC</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3cbfb3]"
                    style={{ width: `${(custoMensalClimatizador / custoMensalAC) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-300 mt-1">↓ {percentualEconomia}% mais barato na conta de luz</p>
              </div>
            </div>

            {/* Payback */}
            {mesesPayback > 0 && (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <span className="text-xl shrink-0">⏱</span>
                <p className="text-white/70 text-xs leading-relaxed">
                  Com a economia gerada, o climatizador se paga em{' '}
                  <strong className="text-white">
                    {mesesPayback < 12
                      ? `${mesesPayback} ${mesesPayback === 1 ? 'mês' : 'meses'}`
                      : `${(mesesPayback / 12).toFixed(1).replace('.', ',')} anos`}
                  </strong>. Depois disso, a economia é pura.
                </p>
              </div>
            )}
          </>
        )}

        {tabAtiva === 'investimento' && (
          <div className="space-y-3">
            {/* AC custo total */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-300 text-[11px] font-bold uppercase tracking-wide mb-3">
                Ar-condicionado equivalente ({areaM2}m²)
              </p>
              {combinacao.map((ac, i) => (
                <div key={i} className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/70">
                    {combinacao.length > 1 ? `AC ${i + 1}:` : 'Equipamento:'} {(ac.btu / 1000).toFixed(0)}k BTU
                  </span>
                  <span className="text-white font-semibold">R$ {ac.preco.toLocaleString('pt-BR')}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-white/70">
                  Instalação ({combinacao.length} {combinacao.length === 1 ? 'unidade' : 'unidades'})
                </span>
                <span className="text-white font-semibold">R$ {totalPrecoInstalacao.toLocaleString('pt-BR')}</span>
              </div>
              <div className="border-t border-red-500/20 pt-2 mt-2 flex justify-between">
                <span className="text-red-300 font-bold text-sm">Total investimento AC</span>
                <span className="text-red-200 font-black">R$ {custoTotalAC.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {/* Climatizador */}
            <div className="bg-[#3cbfb3]/15 border border-[#3cbfb3]/40 rounded-xl p-4">
              <p className="text-[#3cbfb3] text-[11px] font-bold uppercase tracking-wide mb-3">Climatizador Sixxis</p>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-white/70">Equipamento</span>
                <span className="text-white font-semibold">R$ {precoClimatizador.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-white/70">Instalação</span>
                <span className="text-emerald-300 font-semibold">R$ 0 (sem obra)</span>
              </div>
              <div className="border-t border-[#3cbfb3]/20 pt-2 mt-2 flex justify-between">
                <span className="text-[#3cbfb3] font-bold text-sm">Total investimento</span>
                <span className="text-white font-black">R$ {precoClimatizador.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {/* Diferença */}
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 text-center">
              <p className="text-emerald-300 text-xs font-bold mb-1">Você investe</p>
              <p className="text-white text-3xl font-black">
                R$ {(custoTotalAC - precoClimatizador).toLocaleString('pt-BR')}
              </p>
              <p className="text-emerald-300 text-sm">a menos no investimento inicial</p>
            </div>
          </div>
        )}

        {/* Nota de rodapé */}
        <p className="text-white/30 text-[10px] text-center leading-relaxed">
          * Cálculo baseado em 8h/dia por 30 dias. Tarifa média: R$0,85/kWh.
          Preços de AC estimados para splits inverter de mercado. Consumo real pode variar.
        </p>
      </div>
    </div>
  )
}
