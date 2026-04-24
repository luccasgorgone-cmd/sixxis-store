'use client'

import { useEffect, useState } from 'react'
import { Loader2, Gift, TrendingUp, Users, DollarSign, Save, Trophy, Medal, Award } from 'lucide-react'
import { NIVEIS_CONFIG, ORDEM_NIVEIS_GEM } from '@/lib/avatares'
import { IconeNivel } from '@/components/ui/NivelIcons'

interface ClienteFidelidade {
  id:               string
  nome:             string
  email:            string
  totalGasto:       number
  cashbackSaldo:    number
  nivel:            string
  cashbackAcumulado: number
  ultimaCompra:     string | null
}

interface Stats {
  totalClientes:     number
  saldoEmCirculacao: number
  emitidoMes:        number
  resgatadoMes:      number
}

const NIVEL_CONFIG: Record<string, { cor: string; bg: string; texto: string }> = Object.fromEntries(
  ORDEM_NIVEIS_GEM.map(n => [n, { cor: NIVEIS_CONFIG[n].cor, bg: NIVEIS_CONFIG[n].bg, texto: NIVEIS_CONFIG[n].corTexto }])
)

const NIVEIS_LISTA = [...ORDEM_NIVEIS_GEM]

function formatValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function MedalhaRank({ idx }: { idx: number }) {
  if (idx === 0) return <Trophy size={16} className="text-amber-500" />
  if (idx === 1) return <Medal size={16} className="text-gray-400" />
  if (idx === 2) return <Award size={16} className="text-orange-500" />
  return <span className="text-gray-400">#{idx + 1}</span>
}

export default function AdminFidelidadePage() {
  const [clientes, setClientes]   = useState<ClienteFidelidade[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [loading, setLoading]     = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig]       = useState<any>(null)
  const [salvando, setSalvando]   = useState(false)
  const [savedOk, setSavedOk]     = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/fidelidade').then(r => r.json()),
      fetch('/api/admin/cashback-config').then(r => r.json()),
    ]).then(([fid, cfg]) => {
      setClientes(fid.clientes ?? [])
      setStats(fid.stats ?? null)
      setConfig(cfg)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const distribuicaoNiveis = NIVEIS_LISTA.map(nome => ({
    nome,
    count: clientes.filter(c => c.nivel === nome).length,
    pct:   clientes.length > 0 ? Math.round((clientes.filter(c => c.nivel === nome).length / clientes.length) * 100) : 0,
    ...NIVEL_CONFIG[nome],
  }))

  async function salvarConfig() {
    setSalvando(true)
    try {
      await fetch('/api/admin/cashback-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programa de Fidelidade</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cashback por nível, ranking e configurações</p>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,      iconBg: 'bg-[#3cbfb3]/10', iconColor: 'text-[#3cbfb3]', label: 'Clientes com cashback', value: String(stats?.totalClientes ?? 0) },
          { icon: DollarSign, iconBg: 'bg-emerald-50',   iconColor: 'text-emerald-600', label: 'Saldo em circulação',   value: formatValor(stats?.saldoEmCirculacao ?? 0) },
          { icon: TrendingUp, iconBg: 'bg-indigo-50',    iconColor: 'text-indigo-500',  label: 'Emitido este mês',      value: formatValor(stats?.emitidoMes ?? 0) },
          { icon: Gift,       iconBg: 'bg-cyan-50',      iconColor: 'text-cyan-500',    label: 'Resgatado este mês',    value: formatValor(stats?.resgatadoMes ?? 0) },
        ].map(({ icon: Icon, iconBg, iconColor, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── DISTRIBUIÇÃO DE NÍVEIS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribuição por Nível</h2>
        <div className="space-y-3">
          {distribuicaoNiveis.map(n => (
            <div key={n.nome} className="flex items-center gap-3">
              <IconeNivel nivel={n.nome} size={28} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-gray-900">{n.nome}</span>
                  <span className="text-xs text-gray-400">{n.count} clientes ({n.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${n.pct}%`, backgroundColor: n.cor }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RANKING ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Ranking de Clientes</h2>
          <span className="text-xs text-gray-400">{clientes.length} clientes</span>
        </div>
        {clientes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhum cliente ainda</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['#', 'Cliente', 'Nível', 'Total Gasto', 'Saldo CB', 'Última Compra'].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, idx) => {
                  const nc = NIVEL_CONFIG[c.nivel] || NIVEL_CONFIG.Cristal
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold inline-flex items-center">
                          <MedalhaRank idx={idx} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{c.nome}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <IconeNivel nivel={c.nivel} size={20} />
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: nc.bg, color: nc.texto }}>
                            {c.nivel}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900">{formatValor(c.totalGasto)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-[#3cbfb3]">{formatValor(c.cashbackSaldo)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CONFIGURAÇÕES ── */}
      {config && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Configurações de Cashback</h2>
              <p className="text-xs text-gray-400 mt-0.5">Percentuais por nível e regras de uso</p>
            </div>
            <button
              onClick={salvarConfig}
              disabled={salvando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
              style={{ backgroundColor: savedOk ? '#059669' : '#3cbfb3', color: '#0f2e2b' }}>
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {savedOk ? 'Salvo!' : salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Percentuais por nível */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Percentual de cashback por nível</p>
              <div className="space-y-2">
                {NIVEIS_LISTA.map(nome => {
                  const nc = NIVEL_CONFIG[nome]
                  return (
                    <div key={nome} className="flex items-center gap-3">
                      <IconeNivel nivel={nome} size={24} />
                      <span className="text-sm font-semibold text-gray-700 w-20">{nome}</span>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={Math.round((config[nome] ?? 0.02) * 100 * 10) / 10}
                          onChange={e => setConfig({ ...config, [nome]: Number(e.target.value) / 100 })}
                          className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3cbfb3] text-right"
                          style={{ borderColor: nc.cor + '40' }}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Regras de uso */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Regras de uso</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">Valor mínimo de saldo para uso (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={config.valorMinimo ?? 10}
                    onChange={e => setConfig({ ...config, valorMinimo: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3cbfb3]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">Limite máximo por pedido (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={config.limitePorcentagem ?? 20}
                      onChange={e => setConfig({ ...config, limitePorcentagem: Number(e.target.value) })}
                      className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3cbfb3]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Percentual máximo do valor do pedido que pode ser pago com cashback</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
