'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Users, ShieldOff, ShieldCheck, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  email: string
  cpf: string | null
  telefone: string | null
  createdAt: string
  bloqueado: boolean
  motivoBloqueio: string | null
  cashbackSaldo: number
  totalGasto: number
  totalPedidos: number
  ultimaCompra: string | null
  _count: { pedidos: number }
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 })
  const [loading, setLoading]   = useState(true)
  const [busca, setBusca]       = useState('')
  const [status, setStatus]     = useState('')
  const [page, setPage]         = useState(1)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (busca)  params.set('busca', busca)
    if (status) params.set('status', status)
    const res  = await fetch(`/api/admin/clientes?${params}`)
    const data = await res.json()
    setClientes(data.clientes || [])
    setPagination(data.pagination)
    setLoading(false)
  }, [page, busca, status])

  useEffect(() => { load() }, [load])

  async function toggleBloqueio(c: Cliente) {
    setActionId(c.id)
    const motivo = c.bloqueado ? null : (prompt('Motivo do bloqueio:') ?? '')
    if (!c.bloqueado && !motivo) { setActionId(null); return }
    await fetch(`/api/admin/clientes/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloqueado: !c.bloqueado, motivoBloqueio: motivo }),
    })
    setActionId(null)
    load()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-[#3cbfb3]" /> Clientes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} clientes cadastrados</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 bg-white"
        >
          <option value="">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="bloqueado">Bloqueados</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#3cbfb3]" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhum cliente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Pedidos</th>
                  <th className="px-4 py-3">Total Gasto</th>
                  <th className="px-4 py-3">Cashback</th>
                  <th className="px-4 py-3">Última Compra</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${c.bloqueado ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{c.nome}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                      {c.cpf && <p className="text-xs text-gray-300">{c.cpf}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c._count.pedidos}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">R$ {fmt(c.totalGasto)}</td>
                    <td className="px-4 py-3">
                      <span className="text-[#3cbfb3] font-bold">R$ {fmt(c.cashbackSaldo)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(c.ultimaCompra)}</td>
                    <td className="px-4 py-3">
                      {c.bloqueado ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <ShieldOff size={10} /> Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <ShieldCheck size={10} /> Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/clientes/${c.id}`}
                          className="text-xs text-[#3cbfb3] hover:text-[#2a9d8f] font-semibold"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => toggleBloqueio(c)}
                          disabled={actionId === c.id}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                            c.bloqueado
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {actionId === c.id ? '...' : c.bloqueado ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Página {pagination.page} de {pagination.pages} — {pagination.total} clientes
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
