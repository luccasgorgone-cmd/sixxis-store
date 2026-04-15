'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Area, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, Eye, ShoppingCart, TrendingUp, Monitor,
  Cookie, Search, RefreshCw, AlertCircle, Package,
  ShoppingBag, XCircle, DollarSign, Zap, Activity,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIFFANY = '#3cbfb3'
const DARK    = '#0f2e2b'
const CORES   = ['#3cbfb3', '#0f2e2b', '#2563eb', '#7c3aed', '#f59e0b', '#ef4444', '#16a34a']

function fmtValor(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TTip({ active, payload, label, moeda = false }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-3">
      <p className="text-[10px] text-gray-400 mb-1.5 font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
          <span className="text-xs text-gray-500">{p.name}:</span>
          <span className="text-xs font-black text-gray-900">
            {moeda ? fmtValor(p.value) : p.value?.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ItemCarrinho {
  produtoNome: string; produtoSlug: string; variacao: string | null
  quantidade: number; preco: number; valor: number
  adicionadoEm: string; comprado: boolean; sessionId: string
}
interface Cliente {
  sessionId: string; ultimaVisita: string; totalVisitas: number
  totalPaginas: number; dispositivo: string; carrinhosAbertos: number
  comprasFeitas: number; totalGasto: number
}
interface DadosAnalytics {
  ok: boolean; periodo: number
  resumo: {
    totalVisitas: number; aceitaram: number; recusaram: number; taxaAceite: number
    totalEventos: number; compras: number; taxaConversao: number; receita: number
    totalSessoesCarrinho: number; carrinhosAbandonados: number; valorAbandonado: number
  }
  topPaginas: { pagina: string; visitas: number }[]
  topBuscas: { termo: string; count: number }[]
  topProdutos: { produto: string; views: number }[]
  dispositivoStats: { dispositivo: string; count: number }[]
  itensCarrinho: ItemCarrinho[]
  clientes: Cliente[]
  visitasPorDia?: { date: string; visitas: number }[]
  horariosPico?: { hora: number; visitas: number }[]
  paginasPorSessao?: number
  demograficos?: {
    generoPie: { nome: string; count: number }[]
    faixaEtaria: { faixa: string; count: number }[]
    aniversariantesMes: { nome: string; email: string; dia: number }[]
  }
}

type TabId = 'visao-geral' | 'carrinho' | 'visitantes' | 'eventos'

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [dados,        setDados]        = useState<DadosAnalytics | null>(null)
  const [periodo,      setPeriodo]      = useState('7')
  const [loading,      setLoading]      = useState(true)
  const [erro,         setErro]         = useState('')
  const [tab,          setTab]          = useState<TabId>('visao-geral')
  const [ultimaAtt,    setUltimaAtt]    = useState<Date | null>(null)
  const [autoRefresh,  setAutoRefresh]  = useState(false)

  const buscar = useCallback(async (p: string) => {
    setLoading(true); setErro('')
    try {
      const res  = await fetch(`/api/admin/analytics?periodo=${p}`, { cache: 'no-store' })
      const data = await res.json() as DadosAnalytics & { detalhes?: string; erro?: string }
      if (!res.ok || !data.ok) throw new Error(data.detalhes || data.erro || `HTTP ${res.status}`)
      setDados(data)
      setUltimaAtt(new Date())
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { buscar(periodo) }, [periodo, buscar])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => buscar(periodo), 30000)
    return () => clearInterval(id)
  }, [autoRefresh, periodo, buscar])

  if (erro) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-800 font-bold text-base mb-2">Erro ao carregar analytics</p>
        <p className="text-red-600 text-sm font-mono bg-red-100 rounded-xl px-4 py-2 mb-5 break-all">{erro}</p>
        <button onClick={() => buscar(periodo)}
          className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition">
          Tentar novamente
        </button>
      </div>
    </div>
  )

  const r = dados?.resumo

  const fmtKpi = (val: number, type: string) => {
    if (type === 'brl') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    if (type === 'pct') return `${val}%`
    return val.toLocaleString('pt-BR')
  }

  const KPIS = [
    { icon: Users,        label: 'Visitantes Únicos',      val: r?.totalVisitas ?? 0,           cor: TIFFANY,    fmt: 'num' },
    { icon: Eye,          label: 'Total de Eventos',        val: r?.totalEventos ?? 0,           cor: DARK,       fmt: 'num' },
    { icon: ShoppingCart, label: 'Carrinhos Abertos',       val: r?.totalSessoesCarrinho ?? 0,   cor: '#8b5cf6',  fmt: 'num' },
    { icon: XCircle,      label: 'Carrinhos Abandonados',   val: r?.carrinhosAbandonados ?? 0,   cor: '#ef4444',  fmt: 'num' },
    { icon: ShoppingBag,  label: 'Compras Realizadas',      val: r?.compras ?? 0,                cor: '#16a34a',  fmt: 'num' },
    { icon: DollarSign,   label: 'Receita Rastreada',       val: r?.receita ?? 0,                cor: '#f59e0b',  fmt: 'brl' },
    { icon: TrendingUp,   label: 'Taxa de Conversão',       val: r?.taxaConversao ?? 0,          cor: '#2563eb',  fmt: 'pct' },
    { icon: Cookie,       label: 'Taxa Aceite Cookies',     val: r?.taxaAceite ?? 0,             cor: '#6366f1',  fmt: 'pct' },
  ] as const

  const TABS: { id: TabId; label: string }[] = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'carrinho',    label: 'Carrinhos' },
    { id: 'visitantes',  label: 'Visitantes' },
    { id: 'eventos',     label: 'Páginas & Buscas' },
  ]

  // Visitas por dia para ComposedChart
  const visitasGraf = (dados?.visitasPorDia || []).map(d => ({
    data: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
    Visitas: d.visitas,
  }))

  // Horários pico
  const horasPico = Array.from({ length: 24 }, (_, i) => ({
    hora: `${String(i).padStart(2,'0')}h`,
    Visitas: dados?.horariosPico?.find(h => h.hora === i)?.visitas || 0,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Zap size={22} className="text-[#3cbfb3]" /> Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Comportamento dos visitantes em tempo real</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            {[{ v:'1',l:'Hoje' },{ v:'7',l:'7 dias' },{ v:'30',l:'30 dias' },{ v:'90',l:'90 dias' }].map(p => (
              <button key={p.v} onClick={() => setPeriodo(p.v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  periodo === p.v ? 'bg-[#3cbfb3] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                {p.l}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <button onClick={() => setAutoRefresh(v => !v)}
              className={`w-8 h-4 rounded-full relative transition-colors ${autoRefresh ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${autoRefresh ? 'left-4' : 'left-0.5'}`} />
            </button>
            <span className="text-xs text-gray-500 font-medium">Tempo real</span>
          </label>
          {ultimaAtt && (
            <span className="text-[10px] text-gray-400">{ultimaAtt.toLocaleTimeString('pt-BR')}</span>
          )}
          <button onClick={() => buscar(periodo)} disabled={loading}
            className="flex items-center gap-1 text-xs font-bold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-[#3cbfb3] hover:text-[#3cbfb3] disabled:opacity-50 transition">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* KPIs skeleton or content */}
      {loading && !dados ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {KPIS.map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5"
                    style={{ backgroundColor: kpi.cor + '15' }}>
                    <Icon size={15} style={{ color: kpi.cor }} />
                  </div>
                  <p className="text-xl font-extrabold text-gray-900 leading-none">{fmtKpi(kpi.val, kpi.fmt)}</p>
                  <p className="text-[10px] text-gray-500 mt-1 leading-tight">{kpi.label}</p>
                </div>
              )
            })}
          </div>

          {/* Carrinho abandonado destaque */}
          {(r?.valorAbandonado ?? 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-red-800">Valor em Carrinhos Abandonados</p>
                  <p className="text-xs text-red-600">{r?.carrinhosAbandonados || 0} carrinho(s) não finalizados</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-red-700 shrink-0">
                R$ {(r?.valorAbandonado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Visão Geral ──────────────────────────────────────────────── */}
          {tab === 'visao-geral' && (
            <div className="space-y-4">
              {/* Gráfico visitas por dia */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-black text-gray-900">Visitas por Dia</h2>
                    <p className="text-xs text-gray-400">Evolução de pageviews no período</p>
                  </div>
                  {dados?.paginasPorSessao !== undefined && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Páginas / sessão</p>
                      <p className="text-lg font-black text-gray-900">{dados.paginasPorSessao}</p>
                    </div>
                  )}
                </div>
                {visitasGraf.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sem dados de visitas ainda</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={visitasGraf} margin={{ top:5, right:10, left:0, bottom:5 }}>
                      <defs>
                        <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TIFFANY} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={TIFFANY} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="data" tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false}
                        interval={visitasGraf.length > 15 ? Math.floor(visitasGraf.length / 8) : 0} />
                      <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<TTip moeda={false} />} />
                      <Legend />
                      <Area type="monotone" dataKey="Visitas" fill="url(#gV)" stroke={TIFFANY} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Visitas" stroke={DARK} strokeWidth={1.5} dot={false} strokeDasharray="4 2" legendType="none" />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Horários pico */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-gray-900 mb-1">Horários de Pico</h2>
                <p className="text-xs text-gray-400 mb-4">Quando seus visitantes estão online</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={horasPico} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="hora" tick={{ fontSize:9, fill:'#9ca3af' }} tickLine={false} axisLine={false}
                      interval={2} />
                    <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TTip moeda={false} />} />
                    <Bar dataKey="Visitas" fill={TIFFANY} radius={[4,4,0,0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 3 cols: Dispositivos, Funil, Cookies */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Dispositivos */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Monitor size={14} className="text-[#3cbfb3]" /> Dispositivos
                  </h3>
                  {(() => {
                    const devData = (dados?.dispositivoStats ?? []).map((d, i) => ({
                      name: d.dispositivo === 'mobile' ? 'Mobile' : d.dispositivo === 'tablet' ? 'Tablet' : 'Desktop',
                      value: d.count,
                      fill: CORES[i % CORES.length],
                    }))
                    const total = devData.reduce((s,d) => s + d.value, 0)
                    return devData.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4">Sem dados.</p>
                    ) : (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={120}>
                          <PieChart>
                            <Pie data={devData} cx="50%" cy="50%" innerRadius={32} outerRadius={52}
                              dataKey="value" paddingAngle={3}>
                              {devData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 flex-1">
                          {devData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                              <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                              <span className="text-xs font-black text-gray-900">
                                {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Funil */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-[#3cbfb3]" /> Funil de Conversão
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Visitantes', val: r?.totalVisitas ?? 0,          cor: TIFFANY   },
                      { label: 'Carrinhos',  val: r?.totalSessoesCarrinho ?? 0,  cor: '#8b5cf6' },
                      { label: 'Compras',    val: r?.compras ?? 0,               cor: '#16a34a' },
                    ].map(f => {
                      const base = r?.totalVisitas ?? 1
                      const pct = base > 0 ? Math.round((f.val / base) * 100) : 0
                      return (
                        <div key={f.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{f.label}</span>
                            <span className="font-bold text-gray-900">
                              {f.val.toLocaleString('pt-BR')} <span className="text-gray-400 font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: f.cor }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Cookies */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Cookie size={14} className="text-[#3cbfb3]" /> Cookies LGPD
                  </h3>
                  {(() => {
                    const ck = [
                      { name: 'Aceitaram', value: r?.aceitaram ?? 0,  fill: '#16a34a' },
                      { name: 'Recusaram', value: r?.recusaram ?? 0,  fill: '#f59e0b' },
                    ]
                    const total = ck.reduce((s, d) => s + d.value, 0)
                    return total === 0 ? (
                      <p className="text-xs text-gray-400 py-4">Sem dados.</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width="50%" height={120}>
                            <PieChart>
                              <Pie data={ck} cx="50%" cy="50%" innerRadius={32} outerRadius={52}
                                dataKey="value" paddingAngle={3}>
                                {ck.map((d, i) => <Cell key={i} fill={d.fill} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-2 flex-1">
                            {ck.map((d, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                                <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                                <span className="text-xs font-black text-gray-900">
                                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-50">
                          Taxa de aceite: <strong className="text-gray-800">{r?.taxaAceite ?? 0}%</strong>
                        </p>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Top produtos visualizados */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={14} className="text-[#3cbfb3]" /> Produtos Mais Visualizados
                </h3>
                {(!dados?.topProdutos?.length) ? (
                  <p className="text-xs text-gray-400 text-center py-8">Sem dados ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {dados.topProdutos.slice(0, 10).map((p, i) => {
                      const maxV = dados.topProdutos[0]?.views || 1
                      const pct = Math.round((p.views / maxV) * 100)
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                          <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{p.produto}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:TIFFANY }} />
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-gray-900 shrink-0">{p.views} views</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Carrinhos ────────────────────────────────────────────────── */}
          {tab === 'carrinho' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Carrinhos Abertos',     val: r?.totalSessoesCarrinho ?? 0,  cor: '#8b5cf6', icon: ShoppingCart, fmt: 'num' },
                  { label: 'Carrinhos Abandonados', val: r?.carrinhosAbandonados ?? 0,  cor: '#ef4444', icon: XCircle,      fmt: 'num' },
                  { label: 'Compras Realizadas',    val: r?.compras ?? 0,               cor: '#16a34a', icon: ShoppingBag,  fmt: 'num' },
                  { label: 'Valor Abandonado',      val: r?.valorAbandonado ?? 0,       cor: '#f59e0b', icon: DollarSign,   fmt: 'brl' },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: s.cor + '15' }}>
                        <Icon size={17} style={{ color: s.cor }} />
                      </div>
                      <p className="text-2xl font-extrabold text-gray-900">{fmtKpi(s.val, s.fmt)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  )
                })}
              </div>

              {/* Top itens de carrinho */}
              {(() => {
                const itemMap: Record<string, number> = {}
                dados?.itensCarrinho?.forEach(item => {
                  itemMap[item.produtoNome] = (itemMap[item.produtoNome] || 0) + item.quantidade
                })
                const topItems = Object.entries(itemMap)
                  .sort(([,a],[,b]) => b - a).slice(0, 10)
                  .map(([nome, qty]) => ({ nome, qty }))
                const maxQ = topItems[0]?.qty || 1
                return topItems.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-4">Itens Mais Adicionados ao Carrinho</h3>
                    <div className="space-y-2">
                      {topItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-5">{i+1}</span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-800 truncate mb-0.5">{item.nome}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width:`${(item.qty/maxQ)*100}%`, backgroundColor:'#8b5cf6' }} />
                            </div>
                          </div>
                          <span className="text-xs font-black text-gray-900 shrink-0">{item.qty}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Eventos de Carrinho ({dados?.itensCarrinho?.length ?? 0})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Produto','Variação','Qtd','Preço Unit.','Total','Status','Adicionado','Sessão'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dados?.itensCarrinho?.length ? dados.itensCarrinho.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-xs font-semibold text-gray-900 max-w-[180px] truncate">{item.produtoNome}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{item.variacao || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-900">{item.quantidade}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">R$ {item.preco.toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-900">R$ {item.valor.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.comprado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {item.comprado ? 'Comprado' : 'Abandonado'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(item.adicionadoEm).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-400">{item.sessionId}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                            Nenhum evento de carrinho registrado ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Visitantes ───────────────────────────────────────────────── */}
          {tab === 'visitantes' && (
            <div className="space-y-4">
            {/* Demográficos */}
            {dados?.demograficos && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Gênero */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={14} className="text-[#3cbfb3]" /> Gênero
                  </h3>
                  {dados.demograficos.generoPie.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4">Sem dados de gênero ainda.</p>
                  ) : (() => {
                    const GCORES = ['#3cbfb3','#f43f5e','#8b5cf6','#94a3b8']
                    const total = dados.demograficos!.generoPie.reduce((s,g) => s + g.count, 0)
                    return (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={120}>
                          <PieChart>
                            <Pie data={dados.demograficos!.generoPie} cx="50%" cy="50%"
                              innerRadius={30} outerRadius={50} dataKey="count" paddingAngle={3}>
                              {dados.demograficos!.generoPie.map((_, i) => <Cell key={i} fill={GCORES[i % GCORES.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 flex-1">
                          {dados.demograficos!.generoPie.map((g, i) => (
                            <div key={g.nome} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: GCORES[i % GCORES.length] }} />
                              <span className="text-xs text-gray-600 flex-1 capitalize">{g.nome}</span>
                              <span className="text-xs font-black text-gray-900">{total > 0 ? Math.round((g.count/total)*100) : 0}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Faixa etária */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4">Faixa Etária</h3>
                  {dados.demograficos.faixaEtaria.every(f => f.count === 0) ? (
                    <p className="text-xs text-gray-400 py-4">Sem dados de data de nascimento ainda.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={dados.demograficos.faixaEtaria} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="faixa" tick={{ fontSize:9, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize:9, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<TTip moeda={false} />} />
                        <Bar dataKey="count" name="Clientes" fill="#3cbfb3" radius={[4,4,0,0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Aniversariantes */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-1">🎂 Aniversariantes do Mês</h3>
                  <p className="text-[10px] text-gray-400 mb-3">{new Date().toLocaleDateString('pt-BR', { month:'long' })}</p>
                  {dados.demograficos.aniversariantesMes.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Nenhum este mês.</p>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {dados.demograficos.aniversariantesMes.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                          <span className="w-7 h-7 rounded-full bg-[#3cbfb3]/10 flex items-center justify-center text-[10px] font-black text-[#3cbfb3] shrink-0">
                            {a.dia}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{a.nome}</p>
                            <p className="text-[10px] text-gray-400 truncate">{a.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabela de visitantes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900">Visitantes ({dados?.clientes?.length ?? 0})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Sessão','Dispositivo','Visitas','Páginas','Carrinhos','Compras','Gasto Total','Última Visita'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dados?.clientes?.length ? dados.clientes.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">{c.sessionId}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 capitalize">{c.dispositivo}</td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-900">{c.totalVisitas}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.totalPaginas}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.carrinhosAbertos}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${c.comprasFeitas > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {c.comprasFeitas}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-900">
                          {c.totalGasto > 0 ? `R$ ${c.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(c.ultimaVisita).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                          Nenhum visitante registrado. Os dados aparecem após os primeiros acessos com cookies aceitos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}

          {/* ── Tab: Páginas & Buscas ─────────────────────────────────────────── */}
          {tab === 'eventos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top páginas com barras */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Eye size={14} className="text-[#3cbfb3]" /> Páginas Mais Acessadas
                  </h3>
                  {dados?.topPaginas?.length ? (
                    <div className="space-y-2">
                      {dados.topPaginas.map((p, i) => {
                        const maxV = dados.topPaginas[0]?.visitas || 1
                        const pct = Math.round((p.visitas / maxV) * 100)
                        return (
                          <div key={p.pagina} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600 truncate font-mono">{p.pagina || '/'}</p>
                              <div className="h-1.5 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:TIFFANY }} />
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-gray-900 shrink-0">{p.visitas}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : <p className="text-xs text-gray-400 text-center py-8">Sem dados ainda.</p>}
                </div>

                {/* Top buscas */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Search size={14} className="text-[#3cbfb3]" /> Termos Mais Buscados
                  </h3>
                  {dados?.topBuscas?.length ? (
                    <>
                      <div className="space-y-2 mb-4">
                        {dados.topBuscas.map((b, i) => {
                          const maxC = dados.topBuscas[0]?.count || 1
                          const pct = Math.round((b.count / maxC) * 100)
                          return (
                            <div key={b.termo} className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-gray-400 w-4">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 truncate">{b.termo}</p>
                                <div className="h-1.5 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:'#8b5cf6' }} />
                                </div>
                              </div>
                              <span className="text-xs font-extrabold text-gray-900 shrink-0">{b.count}</span>
                            </div>
                          )
                        })}
                      </div>
                      {/* Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                        {dados.topBuscas.map(b => (
                          <span key={b.termo}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                            {b.termo}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-xs text-gray-400 text-center py-8">Sem buscas registradas.</p>}
                </div>
              </div>

              {/* Produtos mais visualizados grid */}
              {dados?.topProdutos?.length ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={14} className="text-[#3cbfb3]" /> Produtos Mais Visualizados
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {dados.topProdutos.slice(0,10).map((p, i) => (
                      <div key={i}
                        className="bg-gray-50 rounded-xl p-3 hover:bg-[#3cbfb3]/5 hover:border-[#3cbfb3]/20 border border-transparent transition-colors">
                        <div className="text-xs font-bold text-gray-400 mb-1">#{i+1}</div>
                        <p className="text-xs font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">{p.produto}</p>
                        <p className="text-sm font-black" style={{ color: TIFFANY }}>{p.views} views</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
