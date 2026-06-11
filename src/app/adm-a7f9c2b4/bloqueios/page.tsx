'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ShieldOff, ShieldCheck, Loader2, RefreshCw, ShieldAlert,
  Eye, Mail, CalendarClock, UserCog, History, Radar, ChevronRight,
} from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

// ─── Types ──────────────────────────────────────────────────────────────────
interface ClienteBloqueado {
  id: string
  nome: string | null
  email: string
  cpf: string | null
  avatar: string | null
  avatarGradiente: string | null
  motivoBloqueio: string | null
  bloqueadoEm: string | null
  createdAt: string
  bloqueadoPor: string | null
}
interface HistoricoItem {
  id: string
  acao: string
  motivo: string
  criadoPor: string | null
  createdAt: string
  cliente: { id: string; nome: string | null; email: string } | null
}
interface Kpis { totalBloqueados: number; bloqueados30d: number; totalHistorico: number }

// ─── Helpers ────────────────────────────────────────────────────────────────
function maskCpf(cpf: string | null): string | null {
  if (!cpf) return null
  const d = cpf.replace(/\D/g, '')
  if (d.length < 11) return '***.***.***-**'
  return `***.***.${d.slice(-5, -2)}-${d.slice(-2)}`
}
function fmtData(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function haQuanto(d: string | null): string {
  if (!d) return ''
  const dias = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  if (dias < 365) return `há ${Math.floor(dias / 30)} meses`
  return `há ${Math.floor(dias / 365)} anos`
}

export default function BloqueiosPage() {
  const [bloqueados, setBloqueados] = useState<ClienteBloqueado[]>([])
  const [historico, setHistorico]   = useState<HistoricoItem[]>([])
  const [kpis, setKpis]             = useState<Kpis>({ totalBloqueados: 0, bloqueados30d: 0, totalHistorico: 0 })
  const [loading, setLoading]       = useState(true)
  const [actionId, setActionId]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/bloqueios', { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      setBloqueados(Array.isArray(data.bloqueados) ? data.bloqueados : [])
      setHistorico(Array.isArray(data.historico) ? data.historico : [])
      setKpis(data.kpis ?? { totalBloqueados: 0, bloqueados30d: 0, totalHistorico: 0 })
    } catch (e) {
      console.error('[admin/bloqueios] fetch falhou:', e)
      setBloqueados([]); setHistorico([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function desbloquear(clienteId: string) {
    setActionId(clienteId)
    try {
      await fetch(`/api/admin/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bloqueado: false, motivoBloqueio: null }),
      })
      await load()
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldOff size={22} className="text-red-500" /> Bloqueios &amp; Fraudes
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Clientes bloqueados, histórico de ações e sinais de fraude.
          </p>
        </div>
        <button
          onClick={load}
          className="shrink-0 flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Clientes bloqueados',        valor: kpis.totalBloqueados, icone: ShieldOff,  cor: '#ef4444' },
          { label: 'Bloqueados (últimos 30 dias)', valor: kpis.bloqueados30d,  icone: CalendarClock, cor: '#f59e0b' },
          { label: 'Registros no histórico',     valor: kpis.totalHistorico,  icone: History,    cor: '#6366f1' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.cor}15` }}>
              <s.icone size={18} style={{ color: s.cor }} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none">{loading ? '—' : s.valor}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── CLIENTES BLOQUEADOS (principal) ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ShieldOff size={15} className="text-red-500" />
          <h2 className="text-sm font-black text-gray-900">Clientes bloqueados</h2>
          {!loading && <span className="text-xs text-gray-400">({bloqueados.length})</span>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-red-300" />
          </div>
        ) : bloqueados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <ShieldCheck size={26} className="text-emerald-500" />
            </div>
            <p className="text-base font-bold text-gray-700">Nenhum cliente bloqueado no momento</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              Bloqueios e sinais de fraude aparecem aqui. Você pode bloquear um cliente pela ficha em Clientes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bloqueados.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-red-50/20 transition-colors">
                {/* Cliente */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-red-500">
                    {(c.nome || c.email)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.nome || 'Sem nome'}</p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <Mail size={10} className="text-gray-300" /> {c.email}
                    </p>
                    {c.cpf && <p className="text-[11px] text-gray-300 font-mono">{maskCpf(c.cpf)}</p>}
                  </div>
                </div>

                {/* Motivo + meta */}
                <div className="min-w-0 sm:w-[38%]">
                  <span className="inline-flex items-start gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-lg max-w-full">
                    <ShieldOff size={11} className="shrink-0 mt-0.5" />
                    <span className="break-words">{c.motivoBloqueio || 'Sem motivo registrado'}</span>
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex flex-wrap items-center gap-x-2">
                    <span className="flex items-center gap-1"><CalendarClock size={10} /> {fmtData(c.bloqueadoEm)} {c.bloqueadoEm && `· ${haQuanto(c.bloqueadoEm)}`}</span>
                    <span className="flex items-center gap-1"><UserCog size={10} /> {c.bloqueadoPor || 'admin'}</span>
                  </p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`${ADMIN_BASE}/clientes/${c.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                  >
                    <Eye size={13} /> Ficha
                  </a>
                  <button
                    onClick={() => desbloquear(c.id)}
                    disabled={actionId === c.id}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-60"
                  >
                    {actionId === c.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                    Desbloquear
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── HISTÓRICO / AUDITORIA ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <History size={15} className="text-indigo-500" />
          <h2 className="text-sm font-black text-gray-900">Histórico de bloqueios</h2>
          <span className="text-[11px] text-gray-400">— log de quem, quando e por quê</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : historico.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            Nenhuma ação de bloqueio registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-[10px] text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Por</th>
                  <th className="px-4 py-3">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historico.map((h) => {
                  const desbloqueio = h.acao === 'desbloqueio'
                  return (
                    <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        {h.cliente ? (
                          <>
                            <p className="font-semibold text-gray-900 text-xs truncate max-w-[180px]">{h.cliente.nome || 'Sem nome'}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{h.cliente.email}</p>
                          </>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${
                          desbloqueio ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {desbloqueio ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                          {desbloqueio ? 'Desbloqueio' : 'Bloqueio'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[260px] truncate">{h.motivo}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{h.criadoPor || 'admin'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtData(h.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── SINAIS DE FRAUDE (fase futura) ─── */}
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Radar size={18} className="text-amber-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              Sinais de fraude
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">em breve</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Esta seção vai destacar comportamentos suspeitos — múltiplas tentativas de pagamento recusadas,
              vários cadastros do mesmo dispositivo/IP, CPFs/cartões reutilizados e picos anômalos de pedidos —
              para acelerar a triagem de bloqueio. Ainda sem lógica ativa.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {['Pagamentos recusados', 'Multi-conta por IP', 'CPF/cartão reutilizado', 'Pico de pedidos'].map((t) => (
                <div key={t} className="flex items-center justify-between gap-1 border border-gray-100 rounded-xl px-3 py-2.5 bg-gray-50/60">
                  <span className="text-[11px] font-medium text-gray-400 truncate">{t}</span>
                  <ChevronRight size={13} className="text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>
          <ShieldAlert size={18} className="text-gray-200 shrink-0 hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
