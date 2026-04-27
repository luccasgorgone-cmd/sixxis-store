'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Search, CreditCard, CheckCircle2, XCircle, TrendingUp,
  Loader2, ExternalLink, RefreshCw,
} from 'lucide-react'

interface Pagamento {
  id: string
  mpPaymentId: string | null
  mpStatus: string
  mpStatusDetail: string | null
  metodo: string
  valor: number
  parcelas: number | null
  bandeira: string | null
  ultimosDigitos: string | null
  payerEmail: string | null
  payerNome: string | null
  createdAt: string
  aprovadoEm: string | null
  rejeitadoEm: string | null
  pedido: {
    id: string
    status: string
    cliente: { nome: string; email: string }
  }
}

interface Stats {
  totalAprovado: number
  totalRejeitado: number
  taxaAprovacao: number
  qtdAprovado: number
  qtdRejeitado: number
}

const STATUS_OPTS = [
  { v: '',          label: 'Todos os status' },
  { v: 'approved',  label: 'Aprovado' },
  { v: 'pending',   label: 'Pendente' },
  { v: 'in_process', label: 'Em análise' },
  { v: 'rejected',  label: 'Rejeitado' },
  { v: 'cancelled', label: 'Cancelado' },
  { v: 'refunded',  label: 'Reembolsado' },
]

const METODO_OPTS = [
  { v: '',            label: 'Todos os métodos' },
  { v: 'pix',         label: 'PIX' },
  { v: 'credit_card', label: 'Cartão de crédito' },
  { v: 'debit_card',  label: 'Cartão de débito' },
]

const STATUS_BADGE: Record<string, string> = {
  approved:   'bg-green-50 text-green-700 border-green-200',
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  in_process: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected:   'bg-red-50 text-red-700 border-red-200',
  cancelled:  'bg-gray-50 text-gray-600 border-gray-200',
  refunded:   'bg-purple-50 text-purple-700 border-purple-200',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function metodoLabel(m: string) {
  if (m === 'pix') return 'PIX'
  if (m === 'credit_card') return 'Cartão'
  if (m === 'debit_card') return 'Débito'
  return m
}

export default function AdminPagamentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [stats, setStats] = useState<Stats>({
    totalAprovado: 0, totalRejeitado: 0, taxaAprovacao: 0,
    qtdAprovado: 0, qtdRejeitado: 0,
  })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [metodo, setMetodo] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')

  const limit = 25
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(q && { q }),
        ...(status && { status }),
        ...(metodo && { metodo }),
        ...(from && { from }),
        ...(to && { to }),
        ...(min && { min }),
        ...(max && { max }),
      })
      const r = await fetch(`/api/admin/pagamentos?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!r.ok) throw new Error('Erro ' + r.status)
      const d = await r.json()
      setPagamentos(Array.isArray(d.pagamentos) ? d.pagamentos : [])
      setTotal(Number(d.total) || 0)
      setStats(d.stats ?? stats)
    } catch (e) {
      console.error('[admin/pagamentos]', e)
      setPagamentos([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, status, metodo, from, to, min, max])

  useEffect(() => {
    let alive = true
    carregar()
    const safety = setTimeout(() => { if (alive) setLoading(false) }, 5000)
    return () => { alive = false; clearTimeout(safety) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const primeiro = useRef(true)
  useEffect(() => {
    if (primeiro.current) { primeiro.current = false; return }
    const t = setTimeout(carregar, 400)
    return () => clearTimeout(t)
  }, [carregar])

  useEffect(() => setPage(1), [q, status, metodo, from, to, min, max])

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} pagamento{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={carregar}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Aprovado',    value: fmt(stats.totalAprovado),       extra: `${stats.qtdAprovado} pgto`,  icon: CheckCircle2, bg: 'bg-green-50',   color: 'text-green-600' },
          { label: 'Rejeitado',   value: fmt(stats.totalRejeitado),      extra: `${stats.qtdRejeitado} pgto`, icon: XCircle,      bg: 'bg-red-50',     color: 'text-red-600' },
          { label: 'Taxa aprovação', value: `${stats.taxaAprovacao.toFixed(1)}%`, extra: '',          icon: TrendingUp,   bg: 'bg-[#3cbfb3]/10', color: 'text-[#3cbfb3]' },
          { label: 'Total',       value: String(total),                  extra: 'no período',                 icon: CreditCard,   bg: 'bg-indigo-50',  color: 'text-indigo-600' },
        ].map(({ label, value, extra, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
              {extra && <p className="text-[10px] text-gray-400">{extra}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por MP ID, e-mail, nome ou pedido..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/40 focus:border-[#3cbfb3]"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
          {STATUS_OPTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
        <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
          {METODO_OPTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" />
        <input type="number" placeholder="Valor mín. (R$)" value={min} onChange={(e) => setMin(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" />
        <input type="number" placeholder="Valor máx. (R$)" value={max} onChange={(e) => setMax(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 flex items-center justify-center text-sm text-gray-500 gap-2">
            <Loader2 size={14} className="animate-spin text-[#3cbfb3]" /> Carregando pagamentos...
          </div>
        ) : pagamentos.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">Nenhum pagamento encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Pedido</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">Método</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">MP</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/adm-a7f9c2b4/pedidos`} className="text-[#3cbfb3] hover:underline font-mono text-xs">
                        #{p.pedido.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate max-w-[180px]">{p.pedido.cliente.nome}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{p.pedido.cliente.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {metodoLabel(p.metodo)}
                      {p.parcelas && p.parcelas > 1 ? ` ${p.parcelas}x` : ''}
                      {p.ultimosDigitos ? <span className="text-gray-400 ml-1">••{p.ultimosDigitos}</span> : null}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{fmt(p.valor / 100)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[p.mpStatus] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {p.mpStatus}
                      </span>
                      {p.mpStatusDetail && <p className="text-[10px] text-gray-400 mt-0.5">{p.mpStatusDetail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {p.mpPaymentId ? (
                        <a
                          href={`https://www.mercadopago.com.br/activities/detail/${p.mpPaymentId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#3cbfb3] hover:underline font-mono text-[11px]"
                        >
                          {p.mpPaymentId}
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
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
