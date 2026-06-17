'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Handshake, Search, RefreshCcw, Mail, Phone, MapPin,
  ChevronLeft, ChevronRight, Eye, Building2,
} from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

const STATUS_META: Record<string, { label: string; cor: string }> = {
  novo:       { label: 'Novo',        cor: '#3b82f6' },
  em_analise: { label: 'Em análise',  cor: '#f59e0b' },
  aprovado:   { label: 'Aprovado',    cor: '#10b981' },
  recusado:   { label: 'Recusado',    cor: '#ef4444' },
}

interface Solicitacao {
  id: string
  nome: string
  email: string
  telefone: string
  razaoSocial: string | null
  nomeFantasia: string | null
  cnpj: string | null
  cidade: string | null
  estado: string | null
  segmento: string | null
  status: string
  createdAt: string
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, cor: '#94a3b8' }
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: `${m.cor}18`, color: m.cor }}
    >
      {m.label}
    </span>
  )
}

function fmtData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminParceirosPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [total, setTotal]   = useState(0)
  const [novos, setNovos]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca]   = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca)  params.set('busca', busca)
      if (status) params.set('status', status)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/parceiros?${params}`, { cache: 'no-store', credentials: 'include' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setSolicitacoes(Array.isArray(data.solicitacoes) ? data.solicitacoes : [])
      setTotal(Number(data.total) || 0)
      setNovos(Number(data.novos) || 0)
      setPages(Number(data.pagination?.pages) || 1)
    } catch (err) {
      console.error('[admin/parceiros] fetch falhou:', err)
      setSolicitacoes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [busca, status, page])

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => { if (alive) buscar() }, 300)
    return () => { alive = false; clearTimeout(t) }
  }, [buscar])

  // Reset para a página 1 quando filtros mudam.
  useEffect(() => { setPage(1) }, [busca, status])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Handshake size={22} className="text-[#3cbfb3]" /> Parceiros
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Solicitações do formulário &ldquo;Seja um Parceiro&rdquo; — {total} no total
            {novos > 0 && <span className="text-[#3b82f6] font-semibold"> · {novos} novo{novos > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button
          onClick={buscar}
          className="shrink-0 flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors"
        >
          <RefreshCcw size={15} /> <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* CONTROLES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, empresa, cidade..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white"
          >
            <option value="">Todos</option>
            <option value="novo">Novo</option>
            <option value="em_analise">Em análise</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
          </select>
        </div>
      </div>

      {/* LISTA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.8fr_1.6fr_1.2fr_1fr_0.9fr_0.9fr_auto] gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100">
          {['Nome', 'Empresa', 'Contato', 'Cidade', 'Status', 'Data', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
          ))}
        </div>

        {loading && (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1.8fr_1.6fr_1.2fr_1fr_0.9fr_0.9fr_auto] gap-4 px-5 py-4 items-center">
                {[...Array(7)].map((_, j) => <div key={j} className="h-4 bg-gray-100 animate-pulse rounded-lg" />)}
              </div>
            ))}
          </div>
        )}

        {!loading && solicitacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Handshake size={48} className="text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-400">Nenhuma solicitação</p>
            <p className="text-sm text-gray-300 mt-1">As solicitações de parceria aparecem aqui.</p>
          </div>
        )}

        {!loading && solicitacoes.length > 0 && (
          <div className="divide-y divide-gray-50">
            {solicitacoes.map(s => {
              const empresa = s.nomeFantasia || s.razaoSocial
              return (
                <Link
                  key={s.id}
                  href={`${ADMIN_BASE}/parceiros/${s.id}`}
                  className="grid grid-cols-1 md:grid-cols-[1.8fr_1.6fr_1.2fr_1fr_0.9fr_0.9fr_auto] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors"
                >
                  {/* Nome */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-[#0f2e2b]">
                      {s.nome?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.nome}</p>
                      <p className="text-xs text-gray-400 truncate md:hidden">{s.email}</p>
                    </div>
                  </div>

                  {/* Empresa */}
                  <div className="min-w-0 hidden md:block">
                    <p className="text-xs text-gray-700 truncate flex items-center gap-1">
                      <Building2 size={11} className="text-gray-300 shrink-0" /> {empresa || '—'}
                    </p>
                    {s.cnpj && <p className="text-[11px] text-gray-400 truncate mt-0.5">{s.cnpj}</p>}
                  </div>

                  {/* Contato */}
                  <div className="min-w-0 hidden md:block">
                    <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                      <Mail size={11} className="text-gray-300 shrink-0" /> {s.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-gray-300 shrink-0" /> {s.telefone}
                    </p>
                  </div>

                  {/* Cidade */}
                  <span className="text-xs text-gray-600 truncate hidden md:flex items-center gap-1">
                    <MapPin size={11} className="text-gray-300 shrink-0" />
                    {s.cidade ? `${s.cidade}${s.estado ? '/' + s.estado : ''}` : '—'}
                  </span>

                  {/* Status */}
                  <div><StatusBadge status={s.status} /></div>

                  {/* Data */}
                  <span className="text-xs text-gray-500">{fmtData(s.createdAt)}</span>

                  {/* Ver */}
                  <span className="hidden md:flex items-center justify-end text-gray-300">
                    <Eye size={16} />
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* PAGINAÇÃO */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={15} /> Anterior
          </button>
          <span className="text-sm text-gray-500 px-2">Página {page} de {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="flex items-center gap-1 border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Próxima <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
