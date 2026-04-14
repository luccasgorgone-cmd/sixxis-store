'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Eye, MousePointer2, Cookie, TrendingUp, Clock, Globe } from 'lucide-react'

interface AnalyticsData {
  periodo: string
  visitas: {
    total: number
    porDia: { dia: string; total: number }[]
  }
  eventos: {
    total: number
    porTipo: { tipo: string; total: number }[]
    recentes: { id: string; tipo: string; pagina: string | null; dados: unknown; createdAt: string; sessionId: string }[]
  }
  cookies: {
    total: number
    analiticos: number
    marketing: number
    taxaAnalitico: number
    taxaMarketing: number
  }
  paginas: { pagina: string; total: number }[]
}

function StatCard({ icon: Icon, label, value, sub, color = '#3cbfb3' }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-[#1a2535] rounded-2xl p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-white text-2xl font-extrabold mt-0.5">{value}</p>
        {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ label, value, max, color = '#3cbfb3' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-xs truncate max-w-[65%]">{label}</span>
        <span className="text-white/50 text-xs font-semibold">{value.toLocaleString('pt-BR')}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function MiniBar({ data }: { data: { dia: string; total: number }[] }) {
  if (!data.length) return <p className="text-white/30 text-xs">Sem dados</p>
  const max = Math.max(...data.map((d) => d.total), 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.total / max) * 64))
        return (
          <div key={d.dia} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-sm transition-opacity group-hover:opacity-80"
              style={{ height: `${h}px`, backgroundColor: '#3cbfb3' }}
            />
            <span className="text-white/20 text-[9px] hidden group-hover:block absolute -top-5 bg-[#0f1f1d] px-1 rounded text-white/70 whitespace-nowrap">
              {d.dia.slice(5)}: {d.total}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [dados, setDados] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('7d')

  const carregar = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?periodo=${p}`)
      if (res.ok) setDados(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar(periodo) }, [periodo, carregar])

  const periodos = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-white text-2xl font-extrabold">Analytics</h1>
          <p className="text-white/40 text-sm mt-0.5">Visitas, eventos e consentimentos LGPD</p>
        </div>
        <div className="flex gap-2">
          {periodos.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                periodo === p.value
                  ? { backgroundColor: '#3cbfb3', color: '#fff' }
                  : { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.60)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#3cbfb3]/30 border-t-[#3cbfb3] rounded-full animate-spin" />
        </div>
      ) : !dados ? (
        <p className="text-white/40 text-center py-16">Erro ao carregar dados.</p>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Eye} label="Visitas" value={dados.visitas.total.toLocaleString('pt-BR')} sub={`Últimos ${periodo === '7d' ? '7' : periodo === '30d' ? '30' : '90'} dias`} />
            <StatCard icon={MousePointer2} label="Eventos" value={dados.eventos.total.toLocaleString('pt-BR')} color="#f59e0b" />
            <StatCard icon={Cookie} label="Consentimentos" value={dados.cookies.total.toLocaleString('pt-BR')} color="#8b5cf6" />
            <StatCard
              icon={TrendingUp}
              label="Taxa analítica"
              value={`${dados.cookies.taxaAnalitico}%`}
              sub={`${dados.cookies.analiticos} aceitaram`}
              color="#10b981"
            />
          </div>

          {/* Linha 2: gráfico + cookies */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico visitas por dia */}
            <div className="lg:col-span-2 bg-[#1a2535] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} style={{ color: '#3cbfb3' }} />
                <h2 className="text-white font-bold text-sm">Visitas por dia</h2>
              </div>
              <MiniBar data={dados.visitas.porDia} />
              {dados.visitas.porDia.length === 0 && (
                <p className="text-white/30 text-xs mt-2">Sem visitas registradas neste período.</p>
              )}
            </div>

            {/* Cookie consent breakdown */}
            <div className="bg-[#1a2535] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cookie size={16} style={{ color: '#8b5cf6' }} />
                <h2 className="text-white font-bold text-sm">Consentimentos</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 text-xs">Analíticos</span>
                    <span className="text-white/50 text-xs font-bold">{dados.cookies.taxaAnalitico}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#3cbfb3]" style={{ width: `${dados.cookies.taxaAnalitico}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 text-xs">Marketing</span>
                    <span className="text-white/50 text-xs font-bold">{dados.cookies.taxaMarketing}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${dados.cookies.taxaMarketing}%` }} />
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Total consentimentos</span>
                    <span className="text-white/70 font-semibold">{dados.cookies.total}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Aceitaram analíticos</span>
                    <span className="text-white/70 font-semibold">{dados.cookies.analiticos}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Aceitaram marketing</span>
                    <span className="text-white/70 font-semibold">{dados.cookies.marketing}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Linha 3: páginas + eventos por tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Páginas mais visitadas */}
            <div className="bg-[#1a2535] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} style={{ color: '#3cbfb3' }} />
                <h2 className="text-white font-bold text-sm">Páginas mais visitadas</h2>
              </div>
              {dados.paginas.length === 0 ? (
                <p className="text-white/30 text-xs">Sem dados neste período.</p>
              ) : (
                <div className="space-y-3">
                  {dados.paginas.map((p, i) => (
                    <ProgressBar key={i} label={p.pagina} value={p.total} max={dados.paginas[0].total} />
                  ))}
                </div>
              )}
            </div>

            {/* Eventos por tipo */}
            <div className="bg-[#1a2535] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MousePointer2 size={16} style={{ color: '#f59e0b' }} />
                <h2 className="text-white font-bold text-sm">Eventos por tipo</h2>
              </div>
              {dados.eventos.porTipo.length === 0 ? (
                <p className="text-white/30 text-xs">Sem eventos neste período.</p>
              ) : (
                <div className="space-y-3">
                  {dados.eventos.porTipo.map((e, i) => (
                    <ProgressBar key={i} label={e.tipo} value={e.total} max={dados.eventos.porTipo[0].total} color="#f59e0b" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Eventos recentes */}
          {dados.eventos.recentes.length > 0 && (
            <div className="bg-[#1a2535] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} style={{ color: '#3cbfb3' }} />
                <h2 className="text-white font-bold text-sm">Eventos recentes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/30 uppercase tracking-wide text-[10px]">
                      <th className="text-left pb-3 pr-4">Tipo</th>
                      <th className="text-left pb-3 pr-4">Página</th>
                      <th className="text-left pb-3 pr-4">Sessão</th>
                      <th className="text-left pb-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dados.eventos.recentes.map((e) => (
                      <tr key={e.id} className="hover:bg-white/5 transition">
                        <td className="py-2.5 pr-4">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                          >
                            {e.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-white/50 max-w-[140px] truncate">{e.pagina ?? '—'}</td>
                        <td className="py-2.5 pr-4 text-white/30 font-mono">{e.sessionId.slice(0, 12)}…</td>
                        <td className="py-2.5 text-white/30">
                          {new Date(e.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
