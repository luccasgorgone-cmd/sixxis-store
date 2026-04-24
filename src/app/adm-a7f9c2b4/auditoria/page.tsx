'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, Filter, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'

interface AuditLogRow {
  id: string
  actor: string
  action: string
  target: string | null
  metadata: unknown
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filtroAction, setFiltroAction] = useState('')
  const [filtroIp, setFiltroIp] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState<'1d' | '7d' | '30d' | 'all'>('7d')
  const [modal, setModal] = useState<AuditLogRow | null>(null)
  const limit = 50

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (filtroAction) params.set('action', filtroAction)
      if (filtroIp) params.set('ip', filtroIp)
      if (filtroPeriodo !== 'all') {
        const dias = filtroPeriodo === '1d' ? 1 : filtroPeriodo === '7d' ? 7 : 30
        params.set('desde', new Date(Date.now() - dias * 24 * 3600 * 1000).toISOString())
      }
      const res = await fetch(`/api/admin/auditoria?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setTotal(Number(data.total) || 0)
      if (Array.isArray(data.actions)) setActions(data.actions)
    } catch (err) {
      console.error('[auditoria] fetch falhou:', err)
      setLogs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, filtroAction, filtroIp, filtroPeriodo])

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => { if (alive) buscar() }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [buscar])

  useEffect(() => { setPage(1) }, [filtroAction, filtroIp, filtroPeriodo])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  function actionBadgeClass(action: string): string {
    if (action.endsWith('.create')) return 'bg-green-50 text-green-700 border-green-200'
    if (action.endsWith('.update')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (action.endsWith('.delete')) return 'bg-red-50 text-red-700 border-red-200'
    if (action === 'admin.login' || action === 'admin.password.change') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History size={22} className="text-[#3cbfb3]" /> Auditoria
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'Carregando...' : `${total} registro${total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filtroAction}
            onChange={(e) => setFiltroAction(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
          >
            <option value="">Todas as ações</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value as '1d' | '7d' | '30d' | 'all')}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
        >
          <option value="1d">Últimas 24h</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="all">Tudo</option>
        </select>

        <input
          type="text"
          value={filtroIp}
          onChange={(e) => setFiltroIp(e.target.value)}
          placeholder="Filtrar por IP..."
          className="flex-1 min-w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Data', 'Ação', 'Alvo', 'IP', 'User Agent', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold rounded-lg px-2 py-1 border ${actionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                      {log.target ? log.target.slice(0, 20) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                      {log.ip || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
                      {log.userAgent || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.metadata && (
                        <button
                          onClick={() => setModal(log)}
                          className="text-xs text-[#3cbfb3] hover:underline font-semibold"
                        >
                          Ver metadata
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages} · {total} registro{total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal metadata */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Metadata</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {modal.action} · {new Date(modal.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <pre className="bg-gray-50 rounded-xl p-4 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(modal.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
