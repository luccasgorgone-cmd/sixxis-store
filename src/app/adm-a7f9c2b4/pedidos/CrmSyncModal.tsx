'use client'

// ─── Modal "Enviar dados ao CRM" — 3 passos: buscar -> prévia -> resultado ────
//
// O vínculo é SEMPRE manual: o dono escolhe o contato, mesmo com um só
// candidato. Nada é criado no CRM a partir daqui — "nenhum contato" é desfecho
// NORMAL (cliente comprou direto pelo site), apresentado sem cara de erro.
//
// Todas as chamadas vão para as rotas admin (sessão de admin); a chave interna
// nunca aparece aqui. Falha de comunicação fica contida no modal.

import { useCallback, useEffect, useState } from 'react'
import { X, Loader2, Search, UserCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

interface Candidato {
  leadId: string
  nome: string | null
  telefone: string | null
  cidadeUf: string | null
  temNegocioAberto: boolean
  ultimaInteracaoEm: string | null
}
interface CampoPrevia {
  chave: string
  rotulo: string
  valorCrm: string | null
  valorLoja: string | null
  classificacao: 'preencher' | 'conflito' | 'igual'
}
interface ResultadoAplicar {
  aplicados: string[]
  pulados: { chave: string; motivo: string }[]
  crmSincronizadoEm?: string
  crmLeadId?: string
}

type Passo = 'buscar' | 'previa' | 'resultado'

function fmtData(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return Number.isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function CrmSyncModal({
  pedidoId,
  codigo,
  onClose,
  onSincronizado,
}: {
  pedidoId: string
  codigo: string
  onClose: () => void
  onSincronizado: (crmSincronizadoEm: string, crmLeadId: string) => void
}) {
  const base = `${ADMIN_BASE}/pedidos/${pedidoId}/crm`

  const [passo, setPasso] = useState<Passo>('buscar')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Passo 1 — busca
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [buscou, setBuscou] = useState(false)
  const [leadSel, setLeadSel] = useState<string | null>(null)
  const [telBusca, setTelBusca] = useState('')
  const [cpfBusca, setCpfBusca] = useState('')
  const [nomeBusca, setNomeBusca] = useState('')

  // Passo 2 — prévia
  const [campos, setCampos] = useState<CampoPrevia[]>([])
  const [marcados, setMarcados] = useState<Set<string>>(new Set())

  // Passo 3 — resultado
  const [resultado, setResultado] = useState<ResultadoAplicar | null>(null)

  const buscar = useCallback(async (manual?: { telefone?: string; cpf?: string; nome?: string }) => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`${base}/buscar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(manual ?? {}),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Falha ao buscar no CRM')
      setCandidatos(Array.isArray(d.candidatos) ? d.candidatos : [])
      setLeadSel(null)
      setBuscou(true)
    } catch (e) {
      setErro((e as Error).message || 'Erro ao buscar no CRM')
    }
    setLoading(false)
  }, [base])

  // Busca automática ao abrir (com os dados do cadastro).
  useEffect(() => { buscar() }, [buscar])

  function buscarManual() {
    const manual: { telefone?: string; cpf?: string; nome?: string } = {}
    if (telBusca.trim()) manual.telefone = telBusca.trim()
    if (cpfBusca.trim()) manual.cpf = cpfBusca.trim()
    if (nomeBusca.trim()) manual.nome = nomeBusca.trim()
    buscar(Object.keys(manual).length > 0 ? manual : undefined)
  }

  async function verPrevia() {
    if (!leadSel) return
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`${base}/previa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadId: leadSel }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Falha ao gerar a prévia')
      const lista: CampoPrevia[] = Array.isArray(d.campos) ? d.campos : []
      setCampos(lista)
      // "preencher" (vazio no CRM) já vem marcado; "conflito" desmarcado.
      setMarcados(new Set(lista.filter(c => c.classificacao === 'preencher').map(c => c.chave)))
      setPasso('previa')
    } catch (e) {
      setErro((e as Error).message || 'Erro ao gerar a prévia')
    }
    setLoading(false)
  }

  function toggle(chave: string) {
    setMarcados(prev => {
      const next = new Set(prev)
      if (next.has(chave)) next.delete(chave)
      else next.add(chave)
      return next
    })
  }

  async function aplicar() {
    if (marcados.size === 0) return
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`${base}/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadId: leadSel, campos: [...marcados] }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Falha ao aplicar no CRM')
      setResultado(d as ResultadoAplicar)
      setPasso('resultado')
      if (d.crmSincronizadoEm && d.crmLeadId) onSincronizado(d.crmSincronizadoEm, d.crmLeadId)
    } catch (e) {
      setErro((e as Error).message || 'Erro ao aplicar no CRM')
    }
    setLoading(false)
  }

  const acionaveis = campos.filter(c => c.classificacao !== 'igual')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0f2e2b] shrink-0">
          <div className="flex items-center gap-2 text-white">
            <UserCheck className="w-4 h-4 text-[#3cbfb3]" />
            <div>
              <p className="text-sm font-bold leading-tight">Enviar dados ao CRM</p>
              <p className="text-[11px] text-[#9fd8d1] leading-tight">
                Pedido {codigo} ·{' '}
                {passo === 'buscar' ? 'Selecionar contato' : passo === 'previa' ? 'Conferir e aplicar' : 'Resultado'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {/* Erro de comunicação — com "Tentar de novo" no passo de busca */}
          {erro && (
            <div className="mb-4 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{erro}</p>
                {passo === 'buscar' && (
                  <button onClick={() => buscar()} className="mt-1 inline-flex items-center gap-1 font-semibold text-red-700 hover:underline">
                    <RefreshCw className="w-3 h-3" /> Tentar de novo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Passo 1: BUSCAR ─────────────────────────────────────────────── */}
          {passo === 'buscar' && (
            <div className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Buscando no CRM…
                </div>
              )}

              {!loading && buscou && candidatos.length === 0 && !erro && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                  Nenhum contato no CRM para este cliente — provavelmente comprou direto pelo site.
                  Nada a sincronizar.
                </div>
              )}

              {!loading && candidatos.length > 0 && (
                <div className="space-y-2">
                  {candidatos.map(c => {
                    const sel = leadSel === c.leadId
                    return (
                      <button
                        key={c.leadId}
                        type="button"
                        onClick={() => setLeadSel(c.leadId)}
                        className={`w-full text-left rounded-xl border p-3 transition ${
                          sel ? 'border-[#3cbfb3] bg-[#3cbfb3]/5 ring-1 ring-[#3cbfb3]' : 'border-gray-200 bg-white hover:border-[#3cbfb3]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-gray-800">{c.nome || 'Sem nome'}</span>
                          {c.temNegocioAberto && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              atendimento aberto
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 flex flex-wrap gap-x-3">
                          {c.telefone && <span>{c.telefone}</span>}
                          {c.cidadeUf && <span>{c.cidadeUf}</span>}
                          <span>última interação: {fmtData(c.ultimaInteracaoEm)}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Busca manual */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Buscar manualmente</p>
                <div className="grid grid-cols-3 gap-2">
                  <input value={telBusca} onChange={e => setTelBusca(e.target.value)} placeholder="Telefone"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
                  <input value={cpfBusca} onChange={e => setCpfBusca(e.target.value)} placeholder="CPF/CNPJ"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
                  <input value={nomeBusca} onChange={e => setNomeBusca(e.target.value)} placeholder="Nome"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
                </div>
                <button onClick={buscarManual} disabled={loading}
                  className="mt-2 inline-flex items-center gap-1.5 border border-[#3cbfb3] text-[#2a9d8f] hover:bg-[#3cbfb3]/10 disabled:opacity-50 font-semibold rounded-lg px-3 py-1.5 text-xs transition">
                  <Search className="w-3.5 h-3.5" /> Buscar
                </button>
              </div>
            </div>
          )}

          {/* ── Passo 2: PRÉVIA ─────────────────────────────────────────────── */}
          {passo === 'previa' && (
            <div className="space-y-3">
              {acionaveis.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                  Nada a atualizar — os dados da Loja já batem com o CRM.
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold w-8"></th>
                        <th className="px-2 py-2 text-left font-semibold">Campo</th>
                        <th className="px-2 py-2 text-left font-semibold">No CRM</th>
                        <th className="px-2 py-2 text-left font-semibold">Na Loja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acionaveis.map(c => {
                        const conflito = c.classificacao === 'conflito'
                        return (
                          <tr key={c.chave} className={`border-t border-gray-100 ${conflito ? 'bg-amber-50' : ''}`}>
                            <td className="px-2 py-2 align-top">
                              <input type="checkbox" checked={marcados.has(c.chave)} onChange={() => toggle(c.chave)}
                                className="w-4 h-4 rounded border-gray-300 accent-[#3cbfb3]" />
                            </td>
                            <td className="px-2 py-2 align-top">
                              <span className="font-semibold text-gray-700">{c.rotulo}</span>
                              {conflito && (
                                <p className="text-[10px] text-amber-700 mt-0.5">vai substituir o que está no CRM</p>
                              )}
                            </td>
                            <td className="px-2 py-2 align-top text-gray-500">{c.valorCrm || '—'}</td>
                            <td className="px-2 py-2 align-top text-gray-800">{c.valorLoja || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Passo 3: RESULTADO ──────────────────────────────────────────── */}
          {passo === 'resultado' && resultado && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Sincronização concluída
              </div>
              {resultado.aplicados.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Aplicados</p>
                  <ul className="text-xs text-gray-700 list-disc pl-5 space-y-0.5">
                    {resultado.aplicados.map(a => <li key={a}>{a}</li>)}
                  </ul>
                </div>
              )}
              {resultado.pulados.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Pulados</p>
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {resultado.pulados.map(p => <li key={p.chave}>{p.chave} — {p.motivo}</li>)}
                  </ul>
                </div>
              )}
              {resultado.aplicados.length === 0 && resultado.pulados.length === 0 && (
                <p className="text-xs text-gray-500">Nada foi alterado.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer / ações por passo */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">
            {passo === 'resultado' ? 'Fechar' : 'Cancelar'}
          </button>
          {passo === 'buscar' && (
            <button onClick={verPrevia} disabled={!leadSel || loading}
              className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-40 text-white font-semibold rounded-xl px-4 py-2 text-sm transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Ver prévia
            </button>
          )}
          {passo === 'previa' && (
            <button onClick={aplicar} disabled={marcados.size === 0 || loading}
              className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-40 text-white font-semibold rounded-xl px-4 py-2 text-sm transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aplicar selecionados
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
