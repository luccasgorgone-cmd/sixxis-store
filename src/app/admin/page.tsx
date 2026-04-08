'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  DollarSign, ShoppingBag, TrendingUp, Package,
  Clock, Users, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Pencil,
} from 'lucide-react'

// Recharts precisa de ssr: false — importamos cada gráfico separadamente
const GraficoVendas = dynamic(
  () => import('@/components/admin/DashboardCharts').then((m) => m.GraficoVendas),
  { ssr: false, loading: () => <ChartSkeleton h={260} /> },
)
const GraficoTopProdutos = dynamic(
  () => import('@/components/admin/DashboardCharts').then((m) => m.GraficoTopProdutos),
  { ssr: false, loading: () => <ChartSkeleton h={200} /> },
)
const GraficoStatus = dynamic(
  () => import('@/components/admin/DashboardCharts').then((m) => m.GraficoStatus),
  { ssr: false, loading: () => <ChartSkeleton h={180} /> },
)

function ChartSkeleton({ h }: { h: number }) {
  return <div className="animate-pulse bg-gray-50 rounded-xl" style={{ height: h }} />
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashData {
  metrics: {
    receita: number; totalPedidos: number; ticketMedio: number
    produtosAtivos: number; pedidosPendentes: number; totalClientes: number
    prevReceita: number; prevTotalPedidos: number
  }
  vendasPorDia: { date: string; valor: number }[]
  topProdutos: { nome: string; sku: string | null; quantidade: number; receita: number }[]
  porEstado: { estado: string; pedidos: number; receita: number }[]
  porStatus: { status: string; count: number }[]
  pedidosRecentes: {
    id: string; status: string; total: number; formaPagamento: string
    createdAt: string; cliente: { nome: string }
  }[]
  estoqueCritico: { id: string; nome: string; sku: string | null; estoque: number; categoria: string }[]
}

// ─── Period helpers ───────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}
function monthStartStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const PERIODS = [
  { label: 'Hoje', from: () => todayStr(), to: () => todayStr() },
  { label: '7 dias', from: () => daysAgoStr(6), to: () => todayStr() },
  { label: '30 dias', from: () => daysAgoStr(29), to: () => todayStr() },
  { label: 'Mês atual', from: () => monthStartStr(), to: () => todayStr() },
  { label: 'Personalizado', from: () => '', to: () => '' },
]

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700',
  pago: 'bg-indigo-50 text-indigo-700',
  enviado: 'bg-purple-50 text-purple-700',
  entregue: 'bg-green-50 text-green-700',
  cancelado: 'bg-red-50 text-red-700',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Delta({ current, prev }: { current: number; prev: number }) {
  if (!prev) return null
  const p = ((current - prev) / prev) * 100
  const up = p >= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(p).toFixed(1)}% vs período anterior
    </span>
  )
}

function MetricCard({
  label, value, icon: Icon, iconBg, iconColor, delta,
}: {
  label: string; value: string; icon: React.ElementType
  iconBg: string; iconColor: string; delta?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-500 text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {delta}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [periodIdx, setPeriodIdx] = useState(2)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const p = PERIODS[periodIdx]
    const from = periodIdx === 4 ? customFrom : p.from()
    const to = periodIdx === 4 ? customTo : p.to()
    if (periodIdx === 4 && (!from || !to)) { setLoading(false); return }
    const res = await fetch(`/api/admin/dashboard?from=${from}&to=${to}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [periodIdx, customFrom, customTo])

  useEffect(() => { fetchData() }, [fetchData])

  const m = data?.metrics

  const cards = m ? [
    {
      label: 'Receita Total', value: fmt(m.receita), icon: DollarSign,
      iconBg: 'bg-[#3cbfb3]/10', iconColor: 'text-[#3cbfb3]',
      delta: <Delta current={m.receita} prev={m.prevReceita} />,
    },
    {
      label: 'Total de Pedidos', value: m.totalPedidos.toString(), icon: ShoppingBag,
      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500',
      delta: <Delta current={m.totalPedidos} prev={m.prevTotalPedidos} />,
    },
    {
      label: 'Ticket Médio', value: fmt(m.ticketMedio), icon: TrendingUp,
      iconBg: 'bg-purple-50', iconColor: 'text-purple-500',
    },
    {
      label: 'Produtos Ativos', value: m.produtosAtivos.toString(), icon: Package,
      iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
    },
    {
      label: 'Pedidos Pendentes', value: m.pedidosPendentes.toString(), icon: Clock,
      iconBg: 'bg-amber-50', iconColor: 'text-amber-500',
    },
    {
      label: 'Clientes', value: m.totalClientes.toString(), icon: Users,
      iconBg: 'bg-green-50', iconColor: 'text-green-500',
    },
  ] : []

  const maxEstadoReceita = data?.porEstado[0]?.receita ?? 1

  return (
    <div className="space-y-6 pb-6">
      {/* Header + filtro */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão geral da Sixxis Store</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriodIdx(i)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                periodIdx === i
                  ? 'bg-[#3cbfb3] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          {periodIdx === 4 && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
              <span className="text-gray-400 text-sm">até</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))
          : cards.map((c) => <MetricCard key={c.label} {...c} />)}
      </div>

      {/* Gráfico vendas + donut status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Vendas por período</h2>
          <GraficoVendas data={data?.vendasPorDia ?? []} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Status dos pedidos</h2>
          <GraficoStatus data={data?.porStatus ?? []} />
        </div>
      </div>

      {/* Top produtos + Por estado */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Produtos mais vendidos</h2>
          <GraficoTopProdutos data={data?.topProdutos ?? []} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Vendas por estado</h2>
          {!data?.porEstado.length ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sem dados no período</div>
          ) : (
            <div className="overflow-auto max-h-72">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Estado', 'Pedidos', 'Receita', '%'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 pb-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.porEstado.map((e) => {
                    const pctVal = ((e.receita / (m?.receita || 1)) * 100).toFixed(1)
                    return (
                      <tr key={e.estado}>
                        <td className="py-2.5 pr-3 font-semibold text-gray-800">{e.estado}</td>
                        <td className="py-2.5 pr-3 text-gray-500">{e.pedidos}</td>
                        <td className="py-2.5 pr-3 font-medium text-gray-900">{fmt(e.receita)}</td>
                        <td className="py-2.5 w-28">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-[#3cbfb3] h-1.5 rounded-full" style={{ width: `${(e.receita / maxEstadoReceita) * 100}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{pctVal}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Atividade recente + Estoque crítico */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Atividade recente</h2>
            <Link href="/admin/pedidos" className="text-xs text-[#3cbfb3] font-medium hover:underline">Ver todos →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-gray-50 rounded-xl" />)}</div>
          ) : !data?.pedidosRecentes.length ? (
            <p className="text-center text-gray-300 text-sm py-10">Sem pedidos</p>
          ) : (
            <div className="space-y-1">
              {data.pedidosRecentes.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.cliente.nome}</p>
                    <p className="text-xs font-mono text-gray-400">#{p.id.slice(-8).toUpperCase()} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 capitalize shrink-0 ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                  <span className="text-sm font-bold text-gray-900 shrink-0">{fmt(Number(p.total))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Estoque crítico
              {!!data?.estoqueCritico.length && (
                <span className="bg-red-100 text-red-600 text-xs font-bold rounded-full px-2 py-0.5">{data.estoqueCritico.length}</span>
              )}
            </h2>
            <Link href="/admin/produtos" className="text-xs text-[#3cbfb3] font-medium hover:underline">Gerenciar →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-gray-50 rounded-xl" />)}</div>
          ) : !data?.estoqueCritico.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-200">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm text-gray-300">Estoque saudável</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.estoqueCritico.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${p.estoque === 0 ? 'text-red-500' : 'text-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.nome}</p>
                    {p.sku && <p className="text-xs font-mono text-gray-400">{p.sku}</p>}
                  </div>
                  <span className={`text-xs font-bold rounded-lg px-2.5 py-1 shrink-0 ${p.estoque === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{p.estoque} un</span>
                  <Link href={`/admin/produtos/${p.id}`} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#3cbfb3] hover:bg-[#3cbfb3]/10 transition shrink-0">
                    <Pencil className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
