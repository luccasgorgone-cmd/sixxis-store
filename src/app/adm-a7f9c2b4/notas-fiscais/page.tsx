'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, RefreshCcw, Search, ExternalLink, AlertCircle, FileCheck, ShieldAlert,
} from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

// ─── Notas Fiscais — controle de tudo que foi emitido ───────────────────────
//
// Somente leitura. Os links de DANFE e XML apontam para o que a Focus hospeda
// (gravado no momento da emissão): abrir, nunca reprocessar. A emissão e a
// reemissão continuam sendo exclusivamente do detalhe do pedido.

interface Nota {
  pedidoId: string
  codigo: string
  cliente: { nome: string | null; documento: string | null }
  nfeNumero: number | null
  nfeSerie: number | null
  nfeStatus: string | null
  nfeAmbiente: string
  dataNotaFiscal: string | null
  dataPedido: string
  nfeChave: string | null
  nfeDanfeUrl: string | null
  nfeXmlUrl: string | null
  nfeMensagemErro: string | null
  valorTotal: number
}

interface Resposta {
  notas: Nota[]
  total: number
  stats: { autorizadas: number; comErro: number; producao: number }
}

const VAZIO: Resposta = { notas: [], total: 0, stats: { autorizadas: 0, comErro: 0, producao: 0 } }

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

const fmtData = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

/** CPF (11) e CNPJ (14) mascarados; qualquer outro tamanho sai como veio. */
function fmtDoc(doc: string | null): string {
  if (!doc) return '—'
  const d = doc.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

// Ambiente: produção em verde, homologação em âmbar. A nota anterior ao campo
// nfeAmbiente aparece como "(legado)" — era teste, mas o banco não registrou.
const AMBIENTE_BADGE: Record<string, { label: string; cls: string }> = {
  producao:            { label: 'PRODUÇÃO',              cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  homologacao:         { label: 'HOMOLOGAÇÃO',           cls: 'bg-amber-50 text-amber-800 border-amber-300' },
  'homologacao-legado':{ label: 'HOMOLOGAÇÃO (LEGADO)',  cls: 'bg-amber-50/70 text-amber-700 border-amber-200' },
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  autorizado:  { label: 'Autorizado',  cls: 'bg-emerald-100 text-emerald-700' },
  erro:        { label: 'Erro',        cls: 'bg-red-100 text-red-700' },
  processando: { label: 'Processando', cls: 'bg-gray-100 text-gray-600' },
  cancelado:   { label: 'Cancelado',   cls: 'bg-gray-100 text-gray-500 line-through' },
}

export default function AdminNotasFiscaisPage() {
  const router = useRouter()
  const [data, setData] = useState<Resposta>(VAZIO)
  const [loading, setLoading] = useState(true)
  const [ambiente, setAmbiente] = useState('')
  const [status, setStatus] = useState('')
  const [busca, setBusca] = useState('')

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ambiente) params.set('ambiente', ambiente)
      if (status) params.set('status', status)
      const r = await fetch(`/api/admin/notas-fiscais?${params}`, { cache: 'no-store', credentials: 'include' })
      setData(r.ok ? await r.json() : VAZIO)
    } catch (e) {
      console.error('[admin/notas-fiscais]', e)
      setData(VAZIO)
    } finally {
      setLoading(false)
    }
  }, [ambiente, status])

  useEffect(() => {
    let alive = true
    buscar()
    const safety = setTimeout(() => { if (alive) setLoading(false) }, 8000)
    return () => { alive = false; clearTimeout(safety) }
  }, [buscar])

  const filtradas = data.notas.filter((n) => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      n.codigo.toLowerCase().includes(q) ||
      (n.cliente.nome ?? '').toLowerCase().includes(q) ||
      (n.cliente.documento ?? '').includes(q.replace(/\D/g, '')) ||
      (n.nfeChave ?? '').includes(q) ||
      String(n.nfeNumero ?? '').includes(q)
    )
  })

  function abrirPedido(codigo: string) {
    router.push(`${ADMIN_BASE}/pedidos?q=${encodeURIComponent(codigo)}`)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileText size={22} className="text-[#3cbfb3]" /> Notas Fiscais
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Todas as NF-e emitidas pela Focus, com o ambiente de cada uma. A emissão continua no pedido.
          </p>
        </div>
        <button
          onClick={buscar}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition"
        >
          <RefreshCcw size={14} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Autorizadas" valor={data.stats.autorizadas} icone={<FileCheck size={18} className="text-emerald-500" />} />
        <StatCard label="Com erro" valor={data.stats.comErro} icone={<AlertCircle size={18} className="text-red-500" />} />
        <StatCard label="Em produção" valor={data.stats.producao} icone={<ShieldAlert size={18} className="text-[#3cbfb3]" />} />
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por pedido, cliente, documento, nº ou chave"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/40 focus:border-[#3cbfb3] transition"
          />
        </div>
        <select
          value={ambiente}
          onChange={(e) => setAmbiente(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/40"
        >
          <option value="">Todos os ambientes</option>
          <option value="homologacao">Homologação</option>
          <option value="producao">Produção</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/40"
        >
          <option value="">Todos os status</option>
          <option value="autorizado">Autorizado</option>
          <option value="processando">Processando</option>
          <option value="erro">Erro</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <Th>Número / Série</Th>
                <Th>Cliente</Th>
                <Th>Documento</Th>
                <Th>Data</Th>
                <Th>Ambiente</Th>
                <Th>Status</Th>
                <Th className="text-right">Valor</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">Carregando…</td></tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhuma NF-e encontrada com estes filtros.
                  </td>
                </tr>
              ) : (
                filtradas.map((n) => {
                  const amb = AMBIENTE_BADGE[n.nfeAmbiente] ?? AMBIENTE_BADGE['homologacao-legado']
                  const st = STATUS_BADGE[n.nfeStatus ?? ''] ?? { label: n.nfeStatus ?? '—', cls: 'bg-gray-100 text-gray-500' }
                  return (
                    <tr
                      key={n.pedidoId}
                      onClick={() => abrirPedido(n.codigo)}
                      className="border-b border-gray-100 last:border-0 hover:bg-[#f0fffe] cursor-pointer transition"
                      title="Abrir o pedido de origem"
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">
                          {n.nfeNumero != null ? `nº ${n.nfeNumero}` : '—'}
                          {n.nfeSerie != null && <span className="font-normal text-gray-500"> · série {n.nfeSerie}</span>}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">Pedido {n.codigo}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">{n.cliente.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{fmtDoc(n.cliente.documento)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtData(n.dataNotaFiscal)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${amb.cls}`}>
                          {amb.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap ${st.cls}`}>
                          {st.label}
                        </span>
                        {n.nfeStatus === 'erro' && n.nfeMensagemErro && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-[240px] line-clamp-2">{n.nfeMensagemErro}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{fmtBRL(n.valorTotal)}</td>
                      <td className="px-4 py-3">
                        {/* stopPropagation: o clique na linha abre o pedido; aqui abre o arquivo. */}
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {n.nfeDanfeUrl ? (
                            <a
                              href={n.nfeDanfeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#3cbfb3] hover:bg-[#2a9d8f] rounded-lg px-2.5 py-1.5 transition whitespace-nowrap"
                            >
                              DANFE <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-300 px-2">DANFE</span>
                          )}
                          {n.nfeXmlUrl ? (
                            <a
                              href={n.nfeXmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f2e2b] bg-white border border-gray-200 hover:border-[#3cbfb3]/50 rounded-lg px-2.5 py-1.5 transition whitespace-nowrap"
                            >
                              XML <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-300 px-2">XML</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtradas.length > 0 && (
        <p className="text-xs text-gray-400">
          {filtradas.length} {filtradas.length === 1 ? 'nota' : 'notas'} · clique numa linha para abrir o pedido de origem.
        </p>
      )}
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500 ${className}`}>
      {children}
    </th>
  )
}

function StatCard({ label, valor, icone }: { label: string; valor: number | string; icone: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">{icone}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-black text-gray-900 leading-tight">{valor}</p>
      </div>
    </div>
  )
}
