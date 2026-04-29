'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ShieldCheck, Search, RefreshCcw, AlertTriangle, Package, ChevronRight,
} from 'lucide-react'

interface Garantia {
  id: string
  produtoId: string
  pedidoId: string
  mesesAdicionais: number
  valorPago: string | number
  inicioVigencia: string
  fimVigencia: string
  status: string
  createdAt: string
  produto: { id: string; nome: string; slug: string } | null
  pedido: {
    id: string
    clienteId: string
    cliente: { nome: string; email: string } | null
  } | null
}

interface Resposta {
  garantias: Garantia[]
  total: number
  stats: {
    totalAtivas: number
    totalFaturado: number
    aVencer30Dias: number
  }
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

const fmtData = (s: string) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const STATUS_CORES: Record<string, string> = {
  ativa: 'bg-emerald-100 text-emerald-700',
  acionada: 'bg-amber-100 text-amber-800',
  expirada: 'bg-gray-100 text-gray-500',
  cancelada: 'bg-red-100 text-red-700',
}

export default function AdminGarantiasPage() {
  const [data, setData] = useState<Resposta | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus) params.set('status', filtroStatus)
      const r = await fetch(`/api/admin/garantias?${params}`, { cache: 'no-store' })
      if (r.ok) setData(await r.json())
      else setData({ garantias: [], total: 0, stats: { totalAtivas: 0, totalFaturado: 0, aVencer30Dias: 0 } })
    } catch (e) {
      console.error('[admin/garantias]', e)
      setData({ garantias: [], total: 0, stats: { totalAtivas: 0, totalFaturado: 0, aVencer30Dias: 0 } })
    } finally { setLoading(false) }
  }, [filtroStatus])

  useEffect(() => {
    let alive = true
    buscar()
    const safety = setTimeout(() => { if (alive) setLoading(false) }, 8000)
    return () => { alive = false; clearTimeout(safety) }
  }, [buscar])

  const filtradas = (data?.garantias ?? []).filter((g) => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      g.produto?.nome.toLowerCase().includes(q) ||
      g.pedido?.cliente?.nome.toLowerCase().includes(q) ||
      g.pedido?.cliente?.email.toLowerCase().includes(q) ||
      g.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-[#3cbfb3]" /> Garantias estendidas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Listagem e gestão de garantias adicionais vendidas no checkout.
          </p>
        </div>
        <button
          onClick={buscar}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50"
        >
          <RefreshCcw size={14} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Garantias ativas"
          valor={data?.stats.totalAtivas ?? 0}
          icone={<ShieldCheck size={18} className="text-emerald-500" />}
        />
        <StatCard
          label="Faturado em garantias"
          valor={fmtBRL(Number(data?.stats.totalFaturado ?? 0))}
          icone={<Package size={18} className="text-[#3cbfb3]" />}
        />
        <StatCard
          label="Vencem em 30 dias"
          valor={data?.stats.aVencer30Dias ?? 0}
          icone={<AlertTriangle size={18} className="text-amber-500" />}
          alerta={(data?.stats.aVencer30Dias ?? 0) > 0}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por produto, cliente, pedido…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
        >
          <option value="">Todos os status</option>
          <option value="ativa">Ativa</option>
          <option value="acionada">Acionada</option>
          <option value="expirada">Expirada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Carregando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Nenhuma garantia encontrada{filtroStatus ? ` com status "${filtroStatus}"` : ''}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtradas.map((g) => (
              <Link
                key={g.id}
                href={`/adm-a7f9c2b4/garantias/${g.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50/60 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {g.produto?.nome ?? '—'}
                    </p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${STATUS_CORES[g.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {g.status}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      +{g.mesesAdicionais}m
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {g.pedido?.cliente?.nome ?? '—'} • {g.pedido?.cliente?.email ?? ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vigência {fmtData(g.inicioVigencia)} → {fmtData(g.fimVigencia)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{fmtBRL(Number(g.valorPago))}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pedido #{g.pedidoId.slice(-8).toUpperCase()}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, valor, icone, alerta,
}: { label: string; valor: number | string; icone: React.ReactNode; alerta?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border ${alerta ? 'border-amber-200' : 'border-gray-100'} shadow-sm p-5`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{valor}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
          {icone}
        </div>
      </div>
    </div>
  )
}
