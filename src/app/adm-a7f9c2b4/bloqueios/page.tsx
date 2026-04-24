'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShieldOff, ShieldCheck, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface BloqueioFraude {
  id: string
  motivo: string
  criadoPor: string | null
  createdAt: string
  cliente: { id: string; nome: string; email: string }
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR')
}

export default function BloqueiosPage() {
  const [bloqueios, setBloqueios]   = useState<BloqueioFraude[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 })
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [actionId, setActionId]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/admin/bloqueios?page=${page}&limit=20`)
    const data = await res.json()
    setBloqueios(data.bloqueios || [])
    setPagination(data.pagination)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  async function desbloquear(clienteId: string, bloqueioId: string) {
    setActionId(bloqueioId)
    await fetch(`/api/admin/clientes/${clienteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloqueado: false, motivoBloqueio: null }),
    })
    setActionId(null)
    load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShieldOff size={24} className="text-red-500" /> Bloqueios & Fraudes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} registros de bloqueio</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-red-400" />
          </div>
        ) : bloqueios.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhum bloqueio registrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Registrado por</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {bloqueios.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{b.cliente.nome}</p>
                      <p className="text-xs text-gray-400">{b.cliente.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-lg">
                        <ShieldOff size={10} /> {b.motivo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.criadoPor || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(b.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => desbloquear(b.cliente.id, b.id)}
                        disabled={actionId === b.id}
                        className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        {actionId === b.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                        Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Página {pagination.page} de {pagination.pages}
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
