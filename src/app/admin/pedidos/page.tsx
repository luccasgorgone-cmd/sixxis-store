'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import React from 'react'
import {
  ChevronDown, ChevronRight, Loader2, ShoppingCart,
  Search, Package, MapPin, CreditCard, Truck, CheckCircle,
  Clock, AlertCircle, Save, DollarSign,
} from 'lucide-react'
import { Toast } from '@/components/admin/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Endereco {
  logradouro: string; numero: string; complemento?: string | null
  bairro: string; cidade: string; estado: string; cep: string
}

interface Produto { nome: string; sku: string | null; imagens: string[] }

interface ItemPedido {
  id: string; quantidade: number; precoUnitario: number
  variacaoId: string | null; variacaoNome: string | null
  produto: Produto
}

interface Cliente { nome: string; email: string; telefone?: string | null }

interface Pedido {
  id: string; status: string; total: number; frete: number
  formaPagamento: string; mpPaymentId: string | null
  codigoRastreio: string | null; createdAt: string
  cliente: Cliente; endereco: Endereco; itens: ItemPedido[]
}

interface Stats { total: number; pendentes: number; enviados: number; receita: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado']

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  pago: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  enviado: 'bg-purple-50 text-purple-700 border-purple-200',
  entregue: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente', pago: 'Pago', enviado: 'Enviado',
  entregue: 'Entregue', cancelado: 'Cancelado',
}

const TIMELINE_STEPS = ['pendente', 'pago', 'enviado', 'entregue']

const PAGAMENTOS = ['', 'pix', 'cartao', 'boleto']

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Timeline({ status }: { status: string }) {
  if (status === 'cancelado') {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        Pedido cancelado
      </div>
    )
  }
  const cur = TIMELINE_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= cur
        const last = i === TIMELINE_STEPS.length - 1
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? 'bg-[#3cbfb3] border-[#3cbfb3]' : 'bg-white border-gray-200'
              }`}>
                {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Clock className="w-3 h-3 text-gray-300" />}
              </div>
              <span className={`text-[10px] mt-1 capitalize whitespace-nowrap ${done ? 'text-[#3cbfb3] font-semibold' : 'text-gray-300'}`}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {!last && (
              <div className={`w-16 h-0.5 mb-4 mx-1 ${i < cur ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PedidoDetalhe({
  pedido,
  onUpdate,
  showToast,
}: {
  pedido: Pedido
  onUpdate: (id: string, updates: Partial<Pedido>) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [status, setStatus] = useState(pedido.status)
  const [rastreio, setRastreio] = useState(pedido.codigoRastreio ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/pedidos/${pedido.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, codigoRastreio: rastreio }),
    })
    setSaving(false)
    if (res.ok) {
      onUpdate(pedido.id, { status, codigoRastreio: rastreio })
      showToast('Pedido atualizado!')
    } else {
      showToast('Erro ao atualizar pedido.', 'error')
    }
  }

  const end = pedido.endereco

  return (
    <tr>
      <td colSpan={10} className="bg-gray-50 border-b border-gray-100">
        <div className="px-6 py-5 space-y-6">
          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Progresso</p>
            <Timeline status={status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Itens */}
            <div className="md:col-span-2 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Itens do pedido
              </p>
              {pedido.itens.map((item) => {
                const thumb = (item.produto.imagens as string[])?.[0]
                return (
                  <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {thumb ? (
                        <Image src={thumb} alt={item.produto.nome} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.produto.nome}
                        {item.variacaoNome && (
                          <span className="ml-1.5 text-xs font-semibold text-[#3cbfb3] bg-[#e8f8f7] px-1.5 py-0.5 rounded-md">
                            {item.variacaoNome}
                          </span>
                        )}
                      </p>
                      {item.produto.sku && <p className="text-xs font-mono text-gray-400">{item.produto.sku}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">{item.quantidade}x {fmt(Number(item.precoUnitario))}</p>
                      <p className="text-sm font-semibold text-gray-900">{fmt(item.quantidade * Number(item.precoUnitario))}</p>
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-end gap-6 text-sm pt-1 pr-1">
                <span className="text-gray-500">Frete: <span className="font-medium">{fmt(Number(pedido.frete))}</span></span>
                <span className="font-bold text-gray-900">Total: {fmt(Number(pedido.total))}</span>
              </div>
            </div>

            {/* Info lateral */}
            <div className="space-y-4">
              {/* Endereço */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5" /> Endereço de entrega
                </p>
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-900">{pedido.cliente.nome}</p>
                  <p>{end.logradouro}, {end.numero}{end.complemento ? `, ${end.complemento}` : ''}</p>
                  <p>{end.bairro} — {end.cidade}/{end.estado}</p>
                  <p>CEP {end.cep}</p>
                  {pedido.cliente.telefone && <p className="text-gray-400">{pedido.cliente.telefone}</p>}
                </div>
              </div>

              {/* Pagamento */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5" /> Pagamento
                </p>
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm space-y-1">
                  <p className="capitalize font-medium text-gray-700">{pedido.formaPagamento}</p>
                  {pedido.mpPaymentId && (
                    <p className="text-xs font-mono text-gray-400">MP: {pedido.mpPaymentId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Truck className="w-3.5 h-3.5" /> Atualizar pedido
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 mb-1">Código de rastreio</label>
                <input
                  value={rastreio}
                  onChange={(e) => setRastreio(e.target.value)}
                  placeholder="BR000000000BR"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats>({ total: 0, pendentes: 0, enviados: 0, receita: 0 })
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), q, status, pagamento, from, to })
      const res = await fetch(`/api/admin/pedidos?${params}`, { credentials: 'include', cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ' + res.status)
      const data = await res.json()
      setPedidos(Array.isArray(data.pedidos) ? data.pedidos : [])
      setTotal(Number(data.total) || 0)
      setStats({
        total:     Number(data.stats?.total)     || 0,
        pendentes: Number(data.stats?.pendentes) || 0,
        enviados:  Number(data.stats?.enviados)  || 0,
        receita:   Number(data.stats?.receita)   || 0,
      })
    } catch (err) {
      console.error('[pedidos] fetch falhou:', err)
      setPedidos([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, q, status, pagamento, from, to])

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => { if (alive) fetch_() }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [fetch_])
  useEffect(() => setPage(1), [q, status, pagamento, from, to])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleUpdate(id: string, updates: Partial<Pedido>) {
    setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p))
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-gray-500 text-sm mt-0.5">{stats.total} pedido{stats.total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total no período', value: stats.total,     icon: ShoppingCart, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
            { label: 'Pendentes',        value: stats.pendentes, icon: Clock,    iconBg: 'bg-amber-50',  iconColor: 'text-amber-500' },
            { label: 'Enviados',         value: stats.enviados,  icon: Truck,    iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
            {
              label: 'Receita',
              value: stats.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              icon: DollarSign, iconBg: 'bg-[#3cbfb3]/10', iconColor: 'text-[#3cbfb3]',
            },
          ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por ID ou nome do cliente..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white">
              <option value="">Todos os status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white">
              <option value="">Todos os pagamentos</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
              <option value="boleto">Boleto</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Período:</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
            <span className="text-gray-400 text-sm">até</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
            {(from || to) && (
              <button onClick={() => { setFrom(''); setTo('') }}
                className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar</button>
            )}
          </div>
        </div>

        {/* Tabela */}
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
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 w-8"></th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">#ID</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">Cliente</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 whitespace-nowrap">Data</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden xl:table-cell">Itens</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden 2xl:table-cell">Frete</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">Total</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden xl:table-cell">Pagamento</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden 2xl:table-cell">Rastreio</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => {
                    const isOpen = expanded.has(p.id)
                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          className={`border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${isOpen ? 'bg-gray-50' : ''}`}
                          onClick={() => toggleExpand(p.id)}
                        >
                          <td className="px-3 py-4 w-8">
                            {isOpen
                              ? <ChevronDown className="w-4 h-4 text-[#3cbfb3]" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />
                            }
                          </td>
                          <td className="px-3 py-4">
                            <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 rounded-lg px-2 py-1">
                              #{p.id.slice(-8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-4 max-w-[180px]">
                            <p className="text-sm font-medium text-gray-900 truncate" title={p.cliente.nome}>{p.cliente.nome}</p>
                            <p className="text-xs text-gray-400 truncate" title={p.cliente.email}>{p.cliente.email}</p>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">{p.itens.length} item{p.itens.length !== 1 ? 's' : ''}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden 2xl:table-cell">{fmt(Number(p.frete))}</td>
                          <td className="px-3 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{fmt(Number(p.total))}</td>
                          <td className="px-3 py-4 hidden xl:table-cell">
                            <span className="text-xs capitalize text-gray-500">{p.formaPagamento}</span>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`text-xs font-semibold rounded-full px-2.5 py-1 border capitalize whitespace-nowrap ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {STATUS_LABELS[p.status] ?? p.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 hidden 2xl:table-cell">
                            {p.codigoRastreio && (
                              <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                {p.codigoRastreio}
                              </span>
                            )}
                          </td>
                        </tr>
                        {isOpen && (
                          <PedidoDetalhe pedido={p} onUpdate={handleUpdate} showToast={showToast} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">Anterior</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">Próxima</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
