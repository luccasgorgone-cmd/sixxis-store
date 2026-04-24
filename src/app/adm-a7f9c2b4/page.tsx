'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Users, Clock,
  Truck, CheckCircle, AlertTriangle, ArrowUpRight, Minus, BarChart3,
  Zap, RefreshCcw, ChevronRight, Trophy, Medal, Award,
} from 'lucide-react'
import Link from 'next/link'

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIFFANY = '#3cbfb3'
const DARK    = '#0f2e2b'
const CORES   = ['#3cbfb3', '#0f2e2b', '#2563eb', '#7c3aed', '#f59e0b', '#ef4444', '#16a34a']

function fmtValor(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
function fmtData(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function varClass(v?: number) {
  if (v === undefined) return 'text-gray-400'
  return v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-500' : 'text-gray-400'
}
function VarIcon({ v }: { v?: number }) {
  if (v === undefined || v === 0) return <Minus size={11} className="text-gray-400" />
  return v > 0
    ? <TrendingUp size={11} className="text-emerald-500" />
    : <TrendingDown size={11} className="text-red-500" />
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TTip({ active, payload, label, moeda = true }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-3">
      <p className="text-[10px] text-gray-400 mb-1.5 font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-xs text-gray-500">{p.name}:</span>
          <span className="text-xs font-black text-gray-900">
            {moeda ? fmtValor(p.value) : p.value?.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({ label, valor, moeda, variacao, Icon, bg, fg, href, sub }: {
  label: string; valor: number; moeda?: boolean; variacao?: number
  Icon: React.ElementType; bg: string; fg: string; href?: string; sub?: string
}) {
  const card = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                    hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={20} style={{ color: fg }} />
        </div>
        {href && <ArrowUpRight size={13} className="text-gray-200 group-hover:text-[#3cbfb3] transition-colors" />}
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-black text-gray-900 leading-none">
        {moeda ? fmtValor(valor) : valor.toLocaleString('pt-BR')}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      {variacao !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${varClass(variacao)}`}>
          <VarIcon v={variacao} />
          {Math.abs(variacao).toFixed(1)}% vs período anterior
        </div>
      )}
    </div>
  )
  return href ? <Link href={href} className="block">{card}</Link> : card
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [periodo, setPeriodo] = useState<'hoje' | '7d' | '30d' | 'mes' | 'personalizado'>('30d')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim,    setDataFim]    = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dados,      setDados]      = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [abaGraf,    setAbaGraf]    = useState<'receita' | 'pedidos'>('receita')
  const [atualizando, setAtualizando] = useState(false)

  async function carregar() {
    setAtualizando(true)
    const p = new URLSearchParams({ periodo })
    if (periodo === 'personalizado' && dataInicio && dataFim) {
      p.set('dataInicio', dataInicio); p.set('dataFim', dataFim)
    }
    try {
      const r = await fetch(`/api/admin/dashboard?${p}`)
      setDados(await r.json())
    } catch { /* silent */ }
    finally { setLoading(false); setAtualizando(false) }
  }

  useEffect(() => { carregar() }, [periodo, dataInicio, dataFim]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
        ))}
      </div>
    </div>
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m    = dados?.metrics || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const var_ = dados?.variacao || {}

  const CARDS = [
    { label:'Receita Total',      valor:m.receita||0,          moeda:true,  variacao:var_.receita,    Icon:TrendingUp,  bg:'#dcfce7', fg:'#16a34a', href:'/adm-a7f9c2b4/pedidos', sub:`${m.totalPedidos||0} pedidos` },
    { label:'Ticket Médio',       valor:m.ticketMedio||0,      moeda:true,  variacao:var_.ticketMedio,Icon:BarChart3,   bg:'#fef9c3', fg:'#ca8a04' },
    { label:'Total de Pedidos',   valor:m.totalPedidos||0,     moeda:false, variacao:var_.pedidos,    Icon:ShoppingBag, bg:'#dbeafe', fg:'#2563eb', href:'/adm-a7f9c2b4/pedidos' },
    { label:'Clientes',           valor:m.totalClientes||0,    moeda:false, variacao:var_.clientes,   Icon:Users,       bg:'#e8f8f7', fg:DARK, href:'/adm-a7f9c2b4/clientes', sub:`${dados?.clientesPerfil?.novos||0} novos` },
    { label:'Produtos Ativos',    valor:m.produtosAtivos||0,   moeda:false, Icon:Package,  bg:'#e0e7ff', fg:'#4f46e5', href:'/adm-a7f9c2b4/produtos' },
    { label:'Pedidos Pendentes',  valor:m.pedidosPendentes||0, moeda:false, Icon:Clock,    bg:'#fef3c7', fg:'#d97706', href:'/adm-a7f9c2b4/pedidos?status=PENDENTE' },
    { label:'Pedidos Entregues',  valor:m.pedidosEntregues||0, moeda:false, Icon:CheckCircle, bg:'#d1fae5', fg:'#059669' },
    { label:'Pedidos Enviados',   valor:m.pedidosEnviados||0,  moeda:false, Icon:Truck,    bg:'#ede9fe', fg:'#7c3aed' },
  ] as const

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grafData = (dados?.vendasPorDia||[]).map((d: any) => ({
    data: fmtData(d.date), Receita: d.valor||0, Pedidos: d.pedidos||0,
  }))

  const semana = dados?.vendasPorDiaSemana || [
    {dia:'Dom',valor:0},{dia:'Seg',valor:0},{dia:'Ter',valor:0},{dia:'Qua',valor:0},
    {dia:'Qui',valor:0},{dia:'Sex',valor:0},{dia:'Sáb',valor:0},
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pgto: any[] = dados?.formaPagamento || []
  const horas = Array.from({length:24}, (_,i) => ({
    hora: `${String(i).padStart(2,'0')}h`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pedidos: dados?.vendasPorHora?.find((h: any) => h.hora === i)?.pedidos || 0,
  }))
  const maxHoraPedidos = Math.max(...horas.map(h => h.pedidos), 1)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Zap size={22} className="text-[#3cbfb3]" /> Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            {(['hoje','7d','30d','mes','personalizado'] as const).map((p) => {
              const LABELS: Record<string,string> = {hoje:'Hoje','7d':'7 dias','30d':'30 dias',mes:'Mês',personalizado:'Personalizado'}
              return (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    periodo === p ? 'bg-[#3cbfb3] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {LABELS[p]}
                </button>
              )
            })}
          </div>
          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2">
              <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
              <span className="text-gray-400 text-sm">até</span>
              <input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
            </div>
          )}
          <button onClick={carregar}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#3cbfb3] hover:border-[#3cbfb3]/40 transition-all">
            <RefreshCcw size={15} className={atualizando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alerta estoque crítico */}
      {(dados?.estoqueCritico?.length||0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">
              {dados.estoqueCritico.length} produto{dados.estoqueCritico.length > 1 ? 's' : ''} com estoque crítico
            </p>
            <Link href="/adm-a7f9c2b4/produtos" className="ml-auto text-xs text-amber-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {dados.estoqueCritico.map((p: any) => (
              <Link key={p.id} href={`/adm-a7f9c2b4/produtos/${p.id}`}
                className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100 hover:border-amber-300 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {(p.imagens as string[])?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(p.imagens as string[])[0]} alt="" className="w-full h-full object-contain" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-700">{p.nome?.substring(0,20)}</span>
                <span className="text-xs font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  {p.estoque} un.
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c, i) => <MetricCard key={i} {...c} />)}
      </div>

      {/* Gráfico principal */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-black text-gray-900">Evolução no Período</h2>
            <p className="text-xs text-gray-400 mt-0.5">Receita e pedidos dia a dia</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(['receita','pedidos'] as const).map(aba => (
              <button key={aba} onClick={() => setAbaGraf(aba)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  abaGraf === aba ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {aba === 'receita' ? 'Receita' : 'Pedidos'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={grafData} margin={{ top:5, right:10, left:0, bottom:5 }}>
            <defs>
              <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TIFFANY} stopOpacity={0.25} />
                <stop offset="100%" stopColor={TIFFANY} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="data" tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false}
              interval={grafData.length > 15 ? Math.floor(grafData.length / 8) : 0} />
            <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false}
              tickFormatter={(v: number) => abaGraf==='receita' ? fmtValor(v).replace('R$ ','') : String(v)} />
            <Tooltip content={<TTip moeda={abaGraf==='receita'} />} />
            {abaGraf === 'receita'
              ? <Area type="monotone" dataKey="Receita" stroke={TIFFANY} strokeWidth={2.5}
                  fill="url(#gR)" dot={false} activeDot={{ r:4, fill:TIFFANY }} />
              : <Area type="monotone" dataKey="Pedidos" stroke="#2563eb" strokeWidth={2.5}
                  fill="url(#gP)" dot={false} activeDot={{ r:4, fill:'#2563eb' }} />
            }
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Dia da Semana + Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 mb-1">Vendas por Dia da Semana</h2>
          <p className="text-xs text-gray-400 mb-5">Qual dia tem mais movimento</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={semana} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => fmtValor(v).replace('R$ ','')} />
              <Tooltip content={<TTip moeda />} />
              <Bar dataKey="valor" radius={[6,6,0,0]} name="Receita" maxBarSize={40}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {semana.map((d: any, i: number) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const maxVal = Math.max(...semana.map((s: any) => s.valor||0), 1)
                  return <Cell key={i} fill={d.valor === maxVal && d.valor > 0 ? DARK : TIFFANY} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 mb-1">Formas de Pagamento</h2>
          <p className="text-xs text-gray-400 mb-5">Preferência dos clientes</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {pgto.every((p: any) => !p.count) ? (
            <div className="flex items-center justify-center h-40 text-gray-300">
              <div className="text-center">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sem dados de pagamento</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pgto} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="count" nameKey="forma" paddingAngle={3}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {pgto.map((_: any, i: number) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pgto.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CORES[i%CORES.length] }} />
                    <span className="text-sm text-gray-600 flex-1">{p.forma}</span>
                    <span className="text-sm font-black">{p.percentual||0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Top Produtos + Heatmap por Hora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-black text-gray-900">Produtos mais vendidos</h2>
              <p className="text-xs text-gray-400">No período selecionado</p>
            </div>
            <Link href="/adm-a7f9c2b4/produtos" className="text-xs text-[#3cbfb3] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={11} />
            </Link>
          </div>
          {(!dados?.topProdutos?.length) ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3 italic">Sem vendas no período. Catálogo:</p>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(dados?.catalogo||[]).slice(0,5).map((p: any, i: number) => (
                <Link key={p.id} href={`/adm-a7f9c2b4/produtos/${p.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg text-xs font-black text-gray-400 flex items-center justify-center">{i+1}</div>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                    {(p.imagens as string[])?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(p.imagens as string[])[0]} alt="" className="w-full h-full object-contain p-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.nome}</p>
                    <p className="text-[10px] text-gray-400">{fmtValor(p.preco)}</p>
                  </div>
                  <p className="text-xs font-black text-gray-500">Est: {p.estoque}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {dados.topProdutos.slice(0,6).map((p: any, i: number) => {
                const maxV = dados.topProdutos[0]?.totalVendido||1
                const pct = Math.round((p.totalVendido/maxV)*100)
                return (
                  <div key={p.id||i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                    <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                      i===0?'bg-amber-100 text-amber-700':i===1?'bg-gray-100 text-gray-600':i===2?'bg-orange-100 text-orange-700':'bg-gray-50 text-gray-400'
                    }`}>
                      {i===0 ? <Trophy size={14} />
                        : i===1 ? <Medal size={14} />
                        : i===2 ? <Award size={14} />
                        : <span>{i+1}</span>}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border overflow-hidden shrink-0">
                      {(p.imagens as string[])?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(p.imagens as string[])[0]} alt="" className="w-full h-full object-contain p-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:TIFFANY }} />
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{p.totalVendido} vendas</span>
                      </div>
                    </div>
                    <p className="text-xs font-black text-gray-900 shrink-0">{fmtValor(p.receita)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 mb-1">Pico de Pedidos por Hora</h2>
          <p className="text-xs text-gray-400 mb-5">Quando seus clientes mais compram</p>
          <div className="grid grid-cols-12 gap-1">
            {horas.map((h, i) => {
              const intensidade = h.pedidos / maxHoraPedidos
              return (
                <div key={i} title={`${h.hora}: ${h.pedidos} pedidos`} className="group relative">
                  <div
                    className="w-full aspect-square rounded-md transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: h.pedidos > 0 ? `rgba(60,191,179,${Math.max(0.12, intensidade)})` : '#f3f4f6' }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white
                                  text-[9px] rounded px-1.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100
                                  transition-opacity pointer-events-none z-10">
                    {h.hora} · {h.pedidos}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[9px] text-gray-400">
            {['00h','06h','12h','18h','23h'].map(l => <span key={l}>{l}</span>)}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-3 h-3 rounded-sm bg-gray-100" />
            <span className="text-[9px] text-gray-400 mr-2">Sem pedidos</span>
            {[0.2,0.4,0.6,0.8,1.0].map(o => (
              <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor:`rgba(60,191,179,${o})` }} />
            ))}
            <span className="text-[9px] text-gray-400">Alto volume</span>
          </div>
        </div>
      </div>

      {/* Row 4: Funil + Novos vs Recorrentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 mb-1">Funil de Conversão</h2>
          <p className="text-xs text-gray-400 mb-5">Do visitante à compra</p>
          {(() => {
            const visitantes = m.totalClientes||4
            const carrinhos  = m.totalSessoesCarrinho||0
            const pedidosN   = m.totalPedidos||0
            const etapas = [
              { label:'Visitantes',           valor:visitantes, cor:TIFFANY,   w:100 },
              { label:'Adicionaram Carrinho', valor:carrinhos,  cor:'#2563eb', w:visitantes>0?Math.max(4,(carrinhos/visitantes)*100):0 },
              { label:'Finalizaram Compra',   valor:pedidosN,   cor:'#16a34a', w:visitantes>0?Math.max(2,(pedidosN/visitantes)*100):0 },
            ]
            return (
              <div className="space-y-4">
                {etapas.map((e,i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600">{e.label}</span>
                      <span className="font-black text-gray-900">
                        {e.valor} ({visitantes>0?Math.round((e.valor/visitantes)*100):0}%)
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${e.w}%`, backgroundColor:e.cor }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 mb-1">Perfil de Clientes</h2>
          <p className="text-xs text-gray-400 mb-5">Novos vs recorrentes</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="45%" height={160}>
              <PieChart>
                <Pie
                  data={[
                    { name:'Novos',       value: dados?.clientesPerfil?.novos||0 },
                    { name:'Recorrentes', value: dados?.clientesPerfil?.recorrentes||0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                  dataKey="value" paddingAngle={3}>
                  <Cell fill={TIFFANY} />
                  <Cell fill={DARK} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4 flex-1">
              {[
                { label:'Novos clientes', valor:dados?.clientesPerfil?.novos||0,       cor:TIFFANY },
                { label:'Recorrentes',    valor:dados?.clientesPerfil?.recorrentes||0,  cor:DARK    },
              ].map((item,i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor:item.cor }} />
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-black text-gray-900">{item.valor}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">Taxa de retenção</p>
                <p className="text-lg font-black" style={{ color:TIFFANY }}>
                  {dados?.clientesPerfil?.taxaRetencao||0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Por Estado + Pedidos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 mb-1">Vendas por Estado</h2>
          <p className="text-xs text-gray-400 mb-4">Distribuição geográfica</p>
          {(!dados?.porEstado?.length) ? (
            <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Sem dados geográficos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(dados.porEstado||[]).slice(0,8)} layout="vertical"
                margin={{ top:0, right:40, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:10, fill:'#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => fmtValor(v).replace('R$ ','')} />
                <YAxis type="category" dataKey="estado" tick={{ fontSize:11, fill:'#6b7280' }}
                  width={30} tickLine={false} axisLine={false} />
                <Tooltip content={<TTip moeda />} />
                <Bar dataKey="valor" fill={TIFFANY} radius={[0,6,6,0]} name="Receita" maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900">Pedidos Recentes</h2>
              <p className="text-xs text-gray-400">Últimas transações</p>
            </div>
            <Link href="/adm-a7f9c2b4/pedidos" className="text-xs text-[#3cbfb3] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={11} />
            </Link>
          </div>
          {(!dados?.pedidosRecentes?.length) ? (
            <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Nenhum pedido ainda</div>
          ) : (
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {dados.pedidosRecentes.slice(0,6).map((p: any) => {
                const SC: Record<string,{label:string;cor:string;bg:string}> = {
                  PENDENTE:    {label:'Pendente',   cor:'#d97706',bg:'#fef3c7'},
                  pendente:    {label:'Pendente',   cor:'#d97706',bg:'#fef3c7'},
                  PROCESSANDO: {label:'Processando',cor:'#2563eb',bg:'#dbeafe'},
                  processando: {label:'Processando',cor:'#2563eb',bg:'#dbeafe'},
                  ENVIADO:     {label:'Enviado',    cor:'#7c3aed',bg:'#ede9fe'},
                  enviado:     {label:'Enviado',    cor:'#7c3aed',bg:'#ede9fe'},
                  ENTREGUE:    {label:'Entregue',   cor:'#059669',bg:'#d1fae5'},
                  entregue:    {label:'Entregue',   cor:'#059669',bg:'#d1fae5'},
                  CANCELADO:   {label:'Cancelado',  cor:'#dc2626',bg:'#fee2e2'},
                  cancelado:   {label:'Cancelado',  cor:'#dc2626',bg:'#fee2e2'},
                }
                const st = SC[p.status]||SC.pendente
                return (
                  <Link key={p.id} href={`/adm-a7f9c2b4/pedidos/${p.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                      style={{ backgroundColor:st.bg, color:st.cor }}>
                      {p.cliente?.name?.[0]?.toUpperCase()||'?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.cliente?.name||'Cliente'}</p>
                      <p className="text-[10px] text-gray-400">
                        #{p.id?.slice(-6).toUpperCase()} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-gray-900">{fmtValor(p.total)}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor:st.bg, color:st.cor }}>{st.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ações Rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href:'/adm-a7f9c2b4/produtos/novo', label:'Novo Produto',   cor:TIFFANY    },
            { href:'/adm-a7f9c2b4/pedidos',       label:'Ver Pedidos',    cor:'#2563eb'  },
            { href:'/adm-a7f9c2b4/cupons',        label:'Criar Cupom',    cor:'#7c3aed'  },
            { href:'/adm-a7f9c2b4/configuracoes', label:'Configurações',  cor:DARK       },
          ].map((a,i) => (
            <Link key={i} href={a.href}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4
                         shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor:`${a.cor}20` }}>
                <ChevronRight size={16} style={{ color:a.cor }} />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 flex-1">{a.label}</span>
              <ArrowUpRight size={13} className="text-gray-200 group-hover:text-[#3cbfb3] transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
