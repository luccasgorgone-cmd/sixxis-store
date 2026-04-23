'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ProductImage from '@/components/ui/ProductImage'
import {
  Plus, Search, Pencil, Trash2, Loader2,
  ChevronLeft, ChevronRight, Package,
  CheckCircle, AlertTriangle,
} from 'lucide-react'
import { getCategoriaBadge } from '@/lib/admin-tokens'

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

interface Stats { total: number; ativos: number; criticos: number }

const CATEGORIAS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'climatizadores', label: 'Climatizadores' },
  { value: 'aspiradores', label: 'Aspiradores' },
  { value: 'spinning', label: 'Spinning' },
]

function StockBar({ estoque }: { estoque: number }) {
  const pct = Math.min((estoque / 50) * 100, 100)
  const color = estoque === 0 ? '#ef4444' : estoque < 5 ? '#f59e0b' : '#3cbfb3'
  return (
    <div className="w-20">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-sm font-bold ${
            estoque === 0 ? 'text-red-500' : estoque < 5 ? 'text-amber-500' : 'text-gray-700'
          }`}
        >
          {estoque}
        </span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [stats, _setStats] = useState<Stats>({ total: 0, ativos: 0, criticos: 0 })
  // Wrapper diagnóstico — loga TODA chamada a setStats com stack trace.
  const setStats = (v: Stats | ((prev: Stats) => Stats)) => {
    const resolved = typeof v === 'function' ? (v as (p: Stats) => Stats)(stats) : v
    const trace = new Error().stack?.split('\n').slice(1, 5).join('\n') ?? '(sem stack)'
    console.log('[admin/produtos] setStats CALLED', JSON.stringify(resolved), '\n' + trace)
    _setStats(resolved)
  }
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState('')
  const [ativo, setAtivo] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), q, categoria, ativo })
      const res = await fetch(`/api/admin/produtos?${params}`, { credentials: 'include', cache: 'no-store' })
      console.log('[admin/produtos] response:', { ok: res.ok, status: res.status })
      if (!res.ok) throw new Error('Erro ' + res.status)
      const data = await res.json()
      console.log('[admin/produtos] data:', { produtos: data.produtos?.length, total: data.total, stats: data.stats })
      const novoStats = {
        total:    Number(data.stats?.total)    || 0,
        ativos:   Number(data.stats?.ativos)   || 0,
        criticos: Number(data.stats?.criticos) || 0,
      }
      console.log('[admin/produtos] applying stats:', novoStats)
      setProdutos(Array.isArray(data.produtos) ? data.produtos : [])
      setTotal(Number(data.total) || 0)
      setStats(novoStats)
    } catch (err) {
      console.error('[admin/produtos] fetch failed:', err)
      setProdutos([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, q, categoria, ativo])

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => { if (alive) fetchProdutos() }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [fetchProdutos])

  useEffect(() => { setPage(1) }, [q, categoria, ativo])

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
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {stats.total} produto{stats.total !== 1 ? 's' : ''} encontrado{stats.total !== 1 ? 's' : ''}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total de produtos',
            value: stats.total,
            icon: Package,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
          },
          {
            label: 'Ativos',
            value: stats.ativos,
            icon: CheckCircle,
            iconBg: 'bg-[#3cbfb3]/10',
            iconColor: 'text-[#3cbfb3]',
          },
          {
            label: 'Estoque crítico',
            value: stats.criticos,
            icon: AlertTriangle,
            iconBg: stats.criticos > 0 ? 'bg-amber-50' : 'bg-gray-50',
            iconColor: stats.criticos > 0 ? 'text-amber-500' : 'text-gray-300',
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
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
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={ativo}
          onChange={(e) => setAtivo(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] bg-white"
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Nenhum produto encontrado</p>
            <Link href="/admin/produtos/novo"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#3cbfb3] font-medium hover:underline">
              <Plus className="w-3.5 h-3.5" /> Cadastrar produto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Produto', 'Categoria', 'Preço', 'Estoque', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {produtos.map((p) => {
                  const thumb = (p.imagens as string[])?.[0]
                  const catBadge = getCategoriaBadge(p.categoria)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={thumb}
                            alt={p.nome}
                            w={48}
                            h={48}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1" title={p.nome}>{p.nome}</p>
                            {p.modelo && <p className="text-xs text-gray-400 mt-0.5">{p.modelo}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold rounded-lg px-2.5 py-1 capitalize ${catBadge.bg} ${catBadge.text}`}>
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
                        <StockBar estoque={p.estoque} />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                            p.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/admin/produtos/${p.id}`}
                            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-[#3cbfb3]/10 hover:text-[#3cbfb3] text-gray-400 flex items-center justify-center transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.nome)}
                            disabled={deletingId === p.id}
                            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition disabled:opacity-50"
                          >
                            {deletingId === p.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
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
