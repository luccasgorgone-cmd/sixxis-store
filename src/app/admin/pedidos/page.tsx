'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, Loader2, ShoppingCart } from 'lucide-react'

interface ItemPedido {
  id: string
  quantidade: number
  precoUnitario: number
  produto: { nome: string; imagens: string[] }
}

interface Pedido {
  id: string
  status: string
  total: number
  frete: number
  formaPagamento: string
  createdAt: string
  cliente: { nome: string; email: string }
  itens: ItemPedido[]
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
]

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700',
  pago: 'bg-blue-50 text-blue-700',
  enviado: 'bg-purple-50 text-purple-700',
  entregue: 'bg-green-50 text-green-700',
  cancelado: 'bg-red-50 text-red-700',
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), status })
    const res = await fetch(`/api/admin/pedidos?${params}`)
    const data = await res.json()
    setPedidos(data.pedidos ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, status])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  useEffect(() => {
    setPage(1)
  }, [status])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function formatCurrency(v: number) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} pedido{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] bg-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['', 'ID', 'Cliente', 'Data', 'Total', 'Status', 'Pagamento'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => {
                  const isOpen = expanded.has(p.id)
                  return (
                    <>
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => toggleExpand(p.id)}
                      >
                        <td className="px-5 py-4 w-8">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-gray-500">
                            #{p.id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{p.cliente.nome}</p>
                          <p className="text-xs text-gray-400">{p.cliente.email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(Number(p.total))}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold rounded-full px-2.5 py-1 capitalize ${
                              STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500 capitalize">
                            {p.formaPagamento}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr key={`${p.id}-expanded`} className="bg-gray-50 border-b border-gray-100">
                          <td colSpan={7} className="px-8 py-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Itens do pedido
                              </p>
                              <div className="space-y-2">
                                {p.itens.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {item.produto.nome}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        Qtd: {item.quantidade} &times; {formatCurrency(Number(item.precoUnitario))}
                                      </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {formatCurrency(item.quantidade * Number(item.precoUnitario))}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex justify-end gap-4 text-sm">
                                <span className="text-gray-500">
                                  Frete: {formatCurrency(Number(p.frete))}
                                </span>
                                <span className="font-bold text-gray-900">
                                  Total: {formatCurrency(Number(p.total))}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
