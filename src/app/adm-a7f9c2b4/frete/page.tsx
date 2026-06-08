'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Truck, Loader2, Save, Copy, Check, AlertTriangle, Ban, HandCoins, ChevronDown,
} from 'lucide-react'
import { Toast } from '@/components/admin/Toast'
import { UFS, UF_NOMES, REGIOES, type UF } from '@/lib/ufs'

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface ProdutoResumo {
  id: string
  nome: string
  sku: string | null
  ativo: boolean
  configurados: number
  bloqueiam: number
  totalUfs: number
}

interface RegraEdit {
  precoNormal: string
  prazoNormalMin: string
  prazoNormalMax: string
  precoExpresso: string
  prazoExpressoMin: string
  prazoExpressoMax: string
  aCombinar: boolean
  bloqueado: boolean
}

interface RegraApi {
  uf: string
  precoNormal: string | number | null
  prazoNormalMin: number | null
  prazoNormalMax: number | null
  precoExpresso: string | number | null
  prazoExpressoMin: number | null
  prazoExpressoMax: number | null
  aCombinar: boolean
  bloqueado: boolean
}

const VAZIA: RegraEdit = {
  precoNormal: '', prazoNormalMin: '', prazoNormalMax: '',
  precoExpresso: '', prazoExpressoMin: '', prazoExpressoMax: '',
  aCombinar: false, bloqueado: false,
}

function regrasVazias(): Record<string, RegraEdit> {
  return Object.fromEntries(UFS.map((uf) => [uf, { ...VAZIA }]))
}

function temConteudo(r: RegraEdit): boolean {
  return (
    r.bloqueado || r.aCombinar ||
    r.precoNormal !== '' || r.prazoNormalMin !== '' || r.prazoNormalMax !== '' ||
    r.precoExpresso !== '' || r.prazoExpressoMin !== '' || r.prazoExpressoMax !== ''
  )
}

function str(v: string | number | null): string {
  return v === null || v === undefined ? '' : String(v)
}

// ─── Inputs reutilizáveis ─────────────────────────────────────────────────────

function NumInput({
  value, onChange, placeholder, step,
}: { value: string; onChange: (v: string) => void; placeholder: string; step: string }) {
  return (
    <input
      type="number"
      min="0"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#3cbfb3] text-center"
    />
  )
}

function CamposRegra({
  r, onChange, compact,
}: { r: RegraEdit; onChange: (patch: Partial<RegraEdit>) => void; compact?: boolean }) {
  const disabled = r.bloqueado || r.aCombinar
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Normal: preço + prazo em faixa (min a max dias úteis) */}
      <div className="flex items-center gap-1.5">
        <NumInput value={r.precoNormal}    onChange={(v) => onChange({ precoNormal: v })}    placeholder={compact ? 'R$ normal' : 'preço'} step="0.01" />
        <NumInput value={r.prazoNormalMin} onChange={(v) => onChange({ prazoNormalMin: v })} placeholder="min"                            step="1" />
        <span className="text-xs text-gray-400 shrink-0">a</span>
        <NumInput value={r.prazoNormalMax} onChange={(v) => onChange({ prazoNormalMax: v })} placeholder="max"                            step="1" />
      </div>
      {/* Expresso: preço + prazo em faixa (min a max dias úteis) */}
      <div className="flex items-center gap-1.5">
        <NumInput value={r.precoExpresso}    onChange={(v) => onChange({ precoExpresso: v })}    placeholder={compact ? 'R$ expr.' : 'preço'} step="0.01" />
        <NumInput value={r.prazoExpressoMin} onChange={(v) => onChange({ prazoExpressoMin: v })} placeholder="min"                           step="1" />
        <span className="text-xs text-gray-400 shrink-0">a</span>
        <NumInput value={r.prazoExpressoMax} onChange={(v) => onChange({ prazoExpressoMax: v })} placeholder="max"                           step="1" />
      </div>
    </div>
  )
}

function Toggles({
  r, onChange,
}: { r: RegraEdit; onChange: (patch: Partial<RegraEdit>) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange({ aCombinar: !r.aCombinar, bloqueado: false })}
        title="A combinar (vira orçamento)"
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
          r.aCombinar ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white text-gray-400 border-gray-200 hover:border-amber-300'
        }`}
      >
        <HandCoins size={12} /> Combinar
      </button>
      <button
        type="button"
        onClick={() => onChange({ bloqueado: !r.bloqueado, aCombinar: false })}
        title="Bloquear venda neste estado"
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
          r.bloqueado ? 'bg-red-50 text-red-700 border-red-300' : 'bg-white text-gray-400 border-gray-200 hover:border-red-300'
        }`}
      >
        <Ban size={12} /> Bloquear
      </button>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function FreteAdminPage() {
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [produtoSel, setProdutoSel] = useState<string>('')
  const [regras, setRegras] = useState<Record<string, RegraEdit>>(regrasVazias)
  const [carregandoRegras, setCarregandoRegras] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null)
  const [copiarDe, setCopiarDe] = useState('')
  // Rascunho de preenchimento por região (1 por região).
  const [regiaoDraft, setRegiaoDraft] = useState<Record<string, RegraEdit>>(
    Object.fromEntries(REGIOES.map((reg) => [reg.nome, { ...VAZIA }])),
  )

  const carregarLista = useCallback(async () => {
    setCarregandoLista(true)
    try {
      const res = await fetch('/api/admin/frete', { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      const lista: ProdutoResumo[] = data.produtos ?? []
      setProdutos(lista)
      setProdutoSel((prev) => prev || lista[0]?.id || '')
    } catch {
      setToast({ msg: 'Erro ao carregar produtos', tipo: 'error' })
    }
    setCarregandoLista(false)
  }, [])

  useEffect(() => { carregarLista() }, [carregarLista])

  const carregarRegras = useCallback(async (produtoId: string) => {
    if (!produtoId) return
    setCarregandoRegras(true)
    try {
      const res = await fetch(`/api/admin/frete/${produtoId}`, { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      const base = regrasVazias()
      for (const r of (data.regras ?? []) as RegraApi[]) {
        if (!(r.uf in base)) continue
        base[r.uf] = {
          precoNormal: str(r.precoNormal),
          prazoNormalMin: str(r.prazoNormalMin),
          prazoNormalMax: str(r.prazoNormalMax),
          precoExpresso: str(r.precoExpresso),
          prazoExpressoMin: str(r.prazoExpressoMin),
          prazoExpressoMax: str(r.prazoExpressoMax),
          aCombinar: !!r.aCombinar,
          bloqueado: !!r.bloqueado,
        }
      }
      setRegras(base)
    } catch {
      setToast({ msg: 'Erro ao carregar regras de frete', tipo: 'error' })
    }
    setCarregandoRegras(false)
  }, [])

  useEffect(() => { if (produtoSel) carregarRegras(produtoSel) }, [produtoSel, carregarRegras])

  function atualizarUF(uf: string, patch: Partial<RegraEdit>) {
    setRegras((prev) => ({ ...prev, [uf]: { ...prev[uf], ...patch } }))
  }

  function aplicarRegiao(regiao: { nome: string; ufs: UF[] }) {
    const draft = regiaoDraft[regiao.nome]
    setRegras((prev) => {
      const next = { ...prev }
      for (const uf of regiao.ufs) next[uf] = { ...draft }
      return next
    })
    setToast({ msg: `Aplicado a ${regiao.ufs.length} estados de ${regiao.nome}`, tipo: 'success' })
  }

  async function copiarDeProduto(origemId: string) {
    if (!origemId || origemId === produtoSel) return
    setCarregandoRegras(true)
    try {
      const res = await fetch(`/api/admin/frete/${origemId}`, { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      const base = regrasVazias()
      for (const r of (data.regras ?? []) as RegraApi[]) {
        if (!(r.uf in base)) continue
        base[r.uf] = {
          precoNormal: str(r.precoNormal),
          prazoNormalMin: str(r.prazoNormalMin),
          prazoNormalMax: str(r.prazoNormalMax),
          precoExpresso: str(r.precoExpresso),
          prazoExpressoMin: str(r.prazoExpressoMin),
          prazoExpressoMax: str(r.prazoExpressoMax),
          aCombinar: !!r.aCombinar,
          bloqueado: !!r.bloqueado,
        }
      }
      setRegras(base)
      const origem = produtos.find((p) => p.id === origemId)
      setToast({ msg: `Tabela copiada de "${origem?.nome ?? 'produto'}". Revise e salve.`, tipo: 'success' })
    } catch {
      setToast({ msg: 'Erro ao copiar tabela', tipo: 'error' })
    }
    setCopiarDe('')
    setCarregandoRegras(false)
  }

  async function salvar() {
    if (!produtoSel) return
    setSalvando(true)
    try {
      const payload = UFS.filter((uf) => temConteudo(regras[uf])).map((uf) => ({
        uf,
        precoNormal: regras[uf].precoNormal,
        prazoNormalMin: regras[uf].prazoNormalMin,
        prazoNormalMax: regras[uf].prazoNormalMax,
        precoExpresso: regras[uf].precoExpresso,
        prazoExpressoMin: regras[uf].prazoExpressoMin,
        prazoExpressoMax: regras[uf].prazoExpressoMax,
        aCombinar: regras[uf].aCombinar,
        bloqueado: regras[uf].bloqueado,
      }))
      const res = await fetch(`/api/admin/frete/${produtoSel}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ regras: payload }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'falha ao salvar')
      }
      setToast({ msg: 'Tabela de frete salva!', tipo: 'success' })
      await carregarLista()
    } catch (err) {
      setToast({ msg: (err as Error).message || 'Erro ao salvar', tipo: 'error' })
    }
    setSalvando(false)
  }

  // Indicador de cobertura calculado do estado atual (ao vivo).
  const cobertura = useMemo(() => {
    let configurados = 0
    let vende = 0
    for (const uf of UFS) {
      const r = regras[uf]
      if (temConteudo(r)) configurados++
      if (temConteudo(r) && !r.bloqueado) vende++
    }
    return { configurados, bloqueiam: UFS.length - vende }
  }, [regras])

  const produtoAtual = produtos.find((p) => p.id === produtoSel)

  return (
    <div className="space-y-5 pb-24 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#e8f8f7]">
              <Truck size={20} className="text-[#3cbfb3]" />
            </div>
            Frete por Estado
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tabela de frete por produto × UF. Estado sem valor ou bloqueado não vende; “a combinar” vira orçamento.
          </p>
        </div>
        <button
          onClick={salvar}
          disabled={salvando || !produtoSel}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:shadow-md disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {salvando ? 'Salvando...' : 'Salvar tabela'}
        </button>
      </div>

      {/* Seletor de produto + copiar + indicador */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {carregandoLista ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Carregando produtos…
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Produto</label>
                <div className="relative">
                  <select
                    value={produtoSel}
                    onChange={(e) => setProdutoSel(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm focus:outline-none focus:border-[#3cbfb3] bg-white"
                  >
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}{p.sku ? ` (${p.sku})` : ''}{p.ativo ? '' : ' — inativo'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="min-w-[220px]">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Copiar tabela de</label>
                <div className="relative">
                  <select
                    value={copiarDe}
                    onChange={(e) => { setCopiarDe(e.target.value); copiarDeProduto(e.target.value) }}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm focus:outline-none focus:border-[#3cbfb3] bg-white"
                  >
                    <option value="">Selecionar produto…</option>
                    {produtos.filter((p) => p.id !== produtoSel).map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <Copy size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Indicador de cobertura */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8f8f7] text-[#0f2e2b] font-bold">
                <Check size={13} /> {cobertura.configurados}/{UFS.length} configurados
              </span>
              {cobertura.bloqueiam > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-bold">
                  <AlertTriangle size={13} /> {cobertura.bloqueiam} estados bloqueiam venda
                </span>
              )}
              {produtoAtual && !produtoAtual.ativo && (
                <span className="text-xs text-gray-400">(produto inativo)</span>
              )}
            </div>

            {/* Legenda das colunas */}
            <p className="text-[11px] text-gray-400">
              Colunas por estado: <strong>Normal</strong> (preço, prazo em dias) · <strong>Expresso</strong> (preço, prazo em dias).
              Deixe em branco para não oferecer aquela modalidade. Sem nenhum valor = estado bloqueia a venda.
            </p>
          </>
        )}
      </div>

      {carregandoRegras ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="text-[#3cbfb3] animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {REGIOES.map((regiao) => {
            const draft = regiaoDraft[regiao.nome]
            return (
              <section key={regiao.nome} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Cabeçalho da região + preenchimento em massa */}
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <h2 className="font-bold text-[#0f2e2b]">{regiao.nome} <span className="text-xs font-normal text-gray-400">({regiao.ufs.length} estados)</span></h2>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Preencher região:</span>
                    <div className="flex-1 min-w-[260px]">
                      <CamposRegra r={draft} compact onChange={(patch) =>
                        setRegiaoDraft((prev) => ({ ...prev, [regiao.nome]: { ...prev[regiao.nome], ...patch } }))
                      } />
                    </div>
                    <Toggles r={draft} onChange={(patch) =>
                      setRegiaoDraft((prev) => ({ ...prev, [regiao.nome]: { ...prev[regiao.nome], ...patch } }))
                    } />
                    <button
                      type="button"
                      onClick={() => aplicarRegiao(regiao)}
                      className="px-3 py-1.5 rounded-lg bg-[#0f2e2b] hover:bg-[#1a4f4a] text-white text-xs font-bold transition shrink-0"
                    >
                      Aplicar a {regiao.ufs.length} estados
                    </button>
                  </div>
                </div>

                {/* Linhas por estado */}
                <div className="divide-y divide-gray-50">
                  {regiao.ufs.map((uf) => {
                    const r = regras[uf]
                    return (
                      <div key={uf} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-2">
                        <div className="w-full lg:w-44 shrink-0">
                          <span className="text-sm font-bold text-gray-800">{uf}</span>
                          <span className="text-xs text-gray-400 ml-2">{UF_NOMES[uf]}</span>
                        </div>
                        <div className="flex-1 min-w-[260px]">
                          <CamposRegra r={r} onChange={(patch) => atualizarUF(uf, patch)} />
                        </div>
                        <Toggles r={r} onChange={(patch) => atualizarUF(uf, patch)} />
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
