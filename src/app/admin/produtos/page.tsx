'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react'

interface Produto {
  id: string
  nome: string
  categoria: string
  preco: number
  precoPromocional: number | null
  estoque: number
  ativo: boolean
  imagens: string[]
  modelo: string | null
}

const CATEGORIAS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'climatizadores', label: 'Climatizadores' },
  { value: 'aspiradores', label: 'Aspiradores' },
  { value: 'spinning', label: 'Spinning' },
]

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), q, categoria })
    const res = await fetch(`/api/admin/produtos?${params}`)
    const data = await res.json()
    setProdutos(data.produtos ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, q, categoria])

  useEffect(() => {
    const t = setTimeout(fetchProdutos, 300)
    return () => clearTimeout(t)
  }, [fetchProdutos])

  useEffect(() => {
    setPage(1)
  }, [q, categoria])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Deletar "${nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(id)
    await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchProdutos()
  }

  function formatCurrency(v: number) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou modelo..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
          />
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] bg-white"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
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
        ) : produtos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Produto', 'Categoria', 'Preço', 'Estoque', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {produtos.map((p) => {
                  const thumb = (p.imagens as string[])?.[0]
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={p.nome}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {p.nome}
                            </p>
                            {p.modelo && (
                              <p className="text-xs text-gray-400 mt-0.5">{p.modelo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1 capitalize">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(p.preco))}
                        </p>
                        {p.precoPromocional && (
                          <p className="text-xs text-[#3cbfb3] font-medium">
                            {formatCurrency(Number(p.precoPromocional))}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-sm font-semibold ${
                            p.estoque === 0
                              ? 'text-red-500'
                              : p.estoque < 5
                                ? 'text-amber-500'
                                : 'text-gray-700'
                          }`}
                        >
                          {p.estoque}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                            p.ativo
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/admin/produtos/${p.id}`}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-[#3cbfb3]/10 hover:text-[#3cbfb3] text-gray-500 flex items-center justify-center transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.nome)}
                            disabled={deletingId === p.id}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 flex items-center justify-center transition disabled:opacity-50"
                          >
                            {deletingId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
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
    </div>
  )
}
