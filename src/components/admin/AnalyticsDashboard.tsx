'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Users, Eye, ShoppingCart, TrendingUp, Monitor, Smartphone,
  Tablet, Cookie, Search, RefreshCw, AlertCircle, Package,
  ShoppingBag, XCircle, DollarSign,
} from 'lucide-react'

// ── Mini bar chart (no external deps) ─────────────────────────────────────────
function MiniBarChart({ data, cor = '#3cbfb3', height = 56 }: {
  data: { label: string; val: number }[]
  cor?: string
  height?: number
}) {
  if (!data?.length) return <p className="text-xs text-gray-400 py-3">Sem dados ainda.</p>
  const max = Math.max(...data.map(d => d.val), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-0.5 group relative">
          <div
            className="w-full rounded-t-sm transition-all duration-300"
            style={{ height: `${Math.max(3, (d.val / max) * (height - 18))}px`, backgroundColor: cor }}
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
              {d.label}: {d.val}
            </div>
          </div>
          <span className="text-[8px] text-gray-400 truncate w-full text-center leading-none">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart SVG ────────────────────────────────────────────────────────────
function DonutChart({ data, size = 80 }: {
  data: { label: string; val: number; cor: string }[]
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.val, 0)
  if (!total) return <p className="text-xs text-gray-400 py-3">Sem dados.</p>
  const r = size / 2 - 8
  const cx = size / 2, cy = size / 2
  let angle = -90
  const arcs = data.map(d => {
    const pct = d.val / total
    const sa = angle
    angle += pct * 360
    return { ...d, pct, sa, ea: angle }
  })
  const arc = (sa: number, ea: number) => {
    const rad = (a: number) => (a * Math.PI) / 180
    const x1 = cx + r * Math.cos(rad(sa)), y1 = cy + r * Math.sin(rad(sa))
    const x2 = cx + r * Math.cos(rad(ea)), y2 = cy + r * Math.sin(rad(ea))
    return `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${ea - sa > 180 ? 1 : 0} 1 ${x2} ${y2}Z`
  }
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path key={i} d={arc(a.sa, a.ea)} fill={a.cor} opacity={0.9}>
            <title>{a.label}: {a.val} ({Math.round(a.pct * 100)}%)</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
      </svg>
      <div className="space-y-1.5">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.cor }} />
            <span className="text-[10px] text-gray-600 font-medium">{d.label}</span>
            <span className="text-[10px] font-extrabold text-gray-900 ml-auto pl-2">
              {Math.round((d.val / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────
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
}

type TabId = 'visao-geral' | 'carrinho' | 'visitantes' | 'eventos'

// ── Main component ─────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [dados, setDados]         = useState<DadosAnalytics | null>(null)
  const [periodo, setPeriodo]     = useState('7')
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState('')
  const [tab, setTab]             = useState<TabId>('visao-geral')
  const [ultimaAtt, setUltimaAtt] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const buscar = useCallback(async (p: string) => {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch(`/api/admin/analytics?periodo=${p}`, { cache: 'no-store' })
      const data: DadosAnalytics = await res.json()
      if (!res.ok || !data.ok) throw new Error((data as { detalhes?: string; erro?: string }).detalhes || (data as { detalhes?: string; erro?: string }).erro || `HTTP ${res.status}`)
      setDados(data)
      setUltimaAtt(new Date())
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscar(periodo) }, [periodo, buscar])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => buscar(periodo), 30000)
    return () => clearInterval(id)
  }, [autoRefresh, periodo, buscar])

  if (erro) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
      <p className="text-red-800 font-bold text-base mb-2">Erro ao carregar analytics</p>
      <p className="text-red-600 text-sm font-mono bg-red-100 rounded-xl px-4 py-2 mb-5 max-w-lg mx-auto break-all">{erro}</p>
      <button onClick={() => buscar(periodo)}
        className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition">
        Tentar novamente
      </button>
    </div>
  )

  const r = dados?.resumo

  const KPIS = [
    { icon: Users,        label: 'Visitantes Únicos',      val: r?.totalVisitas ?? 0,          cor: '#3cbfb3', fmt: 'num' },
    { icon: Eye,          label: 'Total de Eventos',        val: r?.totalEventos ?? 0,          cor: '#0f2e2b', fmt: 'num' },
    { icon: ShoppingCart, label: 'Carrinhos Abertos',       val: r?.totalSessoesCarrinho ?? 0,  cor: '#8b5cf6', fmt: 'num' },
    { icon: XCircle,      label: 'Carrinhos Abandonados',   val: r?.carrinhosAbandonados ?? 0,  cor: '#ef4444', fmt: 'num' },
    { icon: ShoppingBag,  label: 'Compras Realizadas',      val: r?.compras ?? 0,               cor: '#16a34a', fmt: 'num' },
    { icon: DollarSign,   label: 'Receita Rastreada',       val: r?.receita ?? 0,               cor: '#f59e0b', fmt: 'brl' },
    { icon: TrendingUp,   label: 'Taxa de Conversão',       val: r?.taxaConversao ?? 0,         cor: '#2563eb', fmt: 'pct' },
    { icon: Cookie,       label: 'Taxa Aceite Cookies',     val: r?.taxaAceite ?? 0,            cor: '#6366f1', fmt: 'pct' },
  ] as const

  const fmt = (val: number, type: string) => {
    if (type === 'brl') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    if (type === 'pct') return `${val}%`
    return val.toLocaleString('pt-BR')
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'carrinho',    label: 'Carrinhos' },
    { id: 'visitantes',  label: 'Visitantes' },
    { id: 'eventos',     label: 'Páginas & Buscas' },
  ]

  return (
    <div className="space-y-5">

      {/* ── Controles ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Período:</span>
          {[{ v:'1',l:'Hoje' },{ v:'7',l:'7 dias' },{ v:'30',l:'30 dias' },{ v:'90',l:'90 dias' }].map(p => (
            <button key={p.v} onClick={() => setPeriodo(p.v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                periodo === p.v
                  ? 'bg-[#0f2e2b] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#3cbfb3]'
              }`}>
              {p.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={`w-8 h-4 rounded-full relative transition-colors ${autoRefresh ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${autoRefresh ? 'left-4' : 'left-0.5'}`} />
            </button>
            <span className="text-xs text-gray-500 font-medium">Tempo real (30s)</span>
          </label>
          {ultimaAtt && (
            <span className="text-[10px] text-gray-400">
              {ultimaAtt.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button onClick={() => buscar(periodo)} disabled={loading}
            className="flex items-center gap-1 text-xs font-bold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-[#3cbfb3] hover:text-[#3cbfb3] disabled:opacity-50 transition">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {loading && !dados ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── KPIs ────────────────────────────────────────────────────────── */}
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
                  <p className="text-xl font-extrabold text-gray-900 leading-none">{fmt(kpi.val, kpi.fmt)}</p>
                  <p className="text-[10px] text-gray-500 mt-1 leading-tight">{kpi.label}</p>
                </div>
              )
            })}
          </div>

          {/* ── Carrinho abandonado destaque ──────────────────────────────── */}
          {(r?.valorAbandonado ?? 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-red-800">Valor em Carrinhos Abandonados</p>
                  <p className="text-xs text-red-600">
                    {r?.carrinhosAbandonados || 0} carrinho(s) com produtos não finalizados
                  </p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-red-700 shrink-0">
                R$ {(r?.valorAbandonado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* ── Tabs ────────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  tab === t.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Visão Geral ─────────────────────────────────────────────── */}
          {tab === 'visao-geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Consentimentos */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Cookie size={14} className="text-[#3cbfb3]" /> Cookies LGPD
                </h3>
                <DonutChart data={[
                  { label: 'Aceitaram', val: r?.aceitaram ?? 0,  cor: '#16a34a' },
                  { label: 'Recusaram', val: r?.recusaram ?? 0,  cor: '#f59e0b' },
                ]} size={90} />
                <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-50">
                  Taxa de aceite: <strong className="text-gray-800">{r?.taxaAceite ?? 0}%</strong>
                </p>
              </div>

              {/* Dispositivos */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Monitor size={14} className="text-[#3cbfb3]" /> Dispositivos
                </h3>
                <DonutChart
                  data={(dados?.dispositivoStats ?? []).map(d => ({
                    label: d.dispositivo === 'mobile' ? 'Mobile'
                         : d.dispositivo === 'tablet' ? 'Tablet' : 'Desktop',
                    val: d.count,
                    cor: d.dispositivo === 'mobile' ? '#8b5cf6'
                       : d.dispositivo === 'tablet' ? '#f59e0b' : '#3cbfb3',
                  }))}
                  size={90}
                />
              </div>

              {/* Funil */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#3cbfb3]" /> Funil de Conversão
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Visitantes', val: r?.totalVisitas ?? 0, cor: '#3cbfb3' },
                    { label: 'Carrinhos',  val: r?.totalSessoesCarrinho ?? 0, cor: '#8b5cf6' },
                    { label: 'Compras',    val: r?.compras ?? 0, cor: '#16a34a' },
                  ].map(f => {
                    const base = r?.totalVisitas ?? 1
                    const pct = base > 0 ? Math.round((f.val / base) * 100) : 0
                    return (
                      <div key={f.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{f.label}</span>
                          <span className="font-bold text-gray-900">{f.val.toLocaleString('pt-BR')} <span className="text-gray-400 font-normal">({pct}%)</span></span>
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

              {/* Top produtos visualizados */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={14} className="text-[#3cbfb3]" /> Produtos Mais Visualizados
                </h3>
                <MiniBarChart
                  data={(dados?.topProdutos ?? []).map(p => ({ label: p.produto, val: p.views }))}
                  cor="#3cbfb3" height={72}
                />
              </div>
            </div>
          )}

          {/* ── Tab: Carrinhos ───────────────────────────────────────────────── */}
          {tab === 'carrinho' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Carrinhos Abertos',     val: r?.totalSessoesCarrinho ?? 0,    cor: '#8b5cf6', icon: ShoppingCart, fmt: 'num' },
                  { label: 'Carrinhos Abandonados', val: r?.carrinhosAbandonados ?? 0,    cor: '#ef4444', icon: XCircle,      fmt: 'num' },
                  { label: 'Valor Abandonado',      val: r?.valorAbandonado ?? 0,         cor: '#f59e0b', icon: DollarSign,   fmt: 'brl' },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: s.cor + '15' }}>
                        <Icon size={17} style={{ color: s.cor }} />
                      </div>
                      <p className="text-2xl font-extrabold text-gray-900">{fmt(s.val, s.fmt)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  )
                })}
              </div>

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

          {/* ── Tab: Visitantes ──────────────────────────────────────────────── */}
          {tab === 'visitantes' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Visitantes ({dados?.clientes?.length ?? 0})
                </h3>
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
          )}

          {/* ── Tab: Páginas & Buscas ────────────────────────────────────────── */}
          {tab === 'eventos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye size={14} className="text-[#3cbfb3]" /> Páginas Mais Acessadas
                </h3>
                {dados?.topPaginas?.length ? (
                  <>
                    <MiniBarChart
                      data={dados.topPaginas.slice(0, 8).map(p => ({
                        label: (p.pagina || '/').replace('/produtos?categoria=', '').replace('/produtos/', ''),
                        val: p.visitas,
                      }))}
                      cor="#3cbfb3" height={72}
                    />
                    <div className="mt-4 space-y-1.5">
                      {dados.topPaginas.map((p, i) => (
                        <div key={p.pagina} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 w-4">{i + 1}</span>
                          <span className="text-xs text-gray-600 truncate flex-1 font-mono">{p.pagina || '/'}</span>
                          <span className="text-xs font-extrabold text-gray-900 shrink-0">{p.visitas}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-xs text-gray-400 text-center py-8">Sem dados ainda.</p>}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Search size={14} className="text-[#3cbfb3]" /> Termos Mais Buscados
                </h3>
                {dados?.topBuscas?.length ? (
                  <>
                    <MiniBarChart
                      data={dados.topBuscas.slice(0, 8).map(b => ({ label: b.termo, val: b.count }))}
                      cor="#8b5cf6" height={72}
                    />
                    <div className="mt-4 space-y-1.5">
                      {dados.topBuscas.map((b, i) => (
                        <div key={b.termo} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 w-4">{i + 1}</span>
                          <span className="text-xs text-gray-700 truncate flex-1">{b.termo}</span>
                          <span className="text-xs font-extrabold text-gray-900 shrink-0">{b.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-xs text-gray-400 text-center py-8">Sem buscas registradas.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
