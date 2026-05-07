'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Save, Loader2, ChevronUp, ChevronDown,
  Plus, Trash2, ImageIcon, Search, Check,
} from 'lucide-react'
import { PQ_SIXXIS_CARDS, PQ_SIXXIS_ICON_OPTIONS, PQ_SIXXIS_NUMS } from '@/lib/porque-sixxis-defaults'
import { getPqSixxisIcon } from '@/lib/porque-sixxis-icons'
import { DeprecatedBanner } from '@/components/admin/editor/DeprecatedBanner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Produto {
  id: string
  nome: string
  preco: number
  imagens: string[]
}

interface Destaque {
  id: string
  ordem: number
  produto: Produto
}

type Configs = Record<string, string>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({
  value, onChange, placeholder, type = 'text',
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]"
    />
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-bold text-[#0a0a0a] text-base mb-5 pb-3 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  )
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all ${
      type === 'success' ? 'bg-[#3cbfb3]' : 'bg-red-500'
    }`}>
      {message}
    </div>
  )
}

// ─── Seção: Ordem das Seções ─────────────────────────────────────────────────

const SECOES_LABELS: Record<string, string> = {
  banners:          '🖼️  Banners / Hero',
  stats:            '📊 Stats (Números)',
  categorias:       '📂 Categorias',
  'mais-vendidos':  '⭐ Mais Vendidos',
  'por-que-sixxis': '✅ Por que Sixxis?',
  'banners-duplos': '🗂️  Banners Duplos',
  newsletter:       '✉️  Newsletter',
  whatsapp:         '💬 Banner WhatsApp',
}

const DEFAULT_ORDER = ['banners', 'stats', 'categorias', 'mais-vendidos', 'por-que-sixxis', 'banners-duplos', 'newsletter', 'whatsapp']

function OrdemSecoes({
  value, onChange,
}: { value: string[]; onChange: (v: string[]) => void }) {
  function move(i: number, dir: -1 | 1) {
    const next = [...value]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {value.map((id, i) => (
        <div key={id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
          <span className="flex-1 text-sm font-medium text-gray-700">{SECOES_LABELS[id] ?? id}</span>
          <div className="flex gap-1">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === value.length - 1}
              className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange(DEFAULT_ORDER)}
        className="text-xs text-gray-400 hover:text-gray-600 transition mt-1"
      >
        Restaurar ordem padrão
      </button>
    </div>
  )
}

// ─── Seção: Mais Vendidos ─────────────────────────────────────────────────────

function MaisVendidosEditor() {
  const [destaques, setDestaques] = useState<Destaque[]>([])
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Produto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState<string | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/admin/destaques?secao=mais-vendidos')
      .then((r) => r.json())
      .then((d) => setDestaques(d.destaques ?? []))
  }, [])

  const buscarProdutos = useCallback((q: string) => {
    if (!q.trim()) { setResultados([]); return }
    setBuscando(true)
    fetch(`/api/admin/produtos?q=${encodeURIComponent(q)}&limit=6`)
      .then((r) => r.json())
      .then((d) => setResultados(d.produtos ?? []))
      .finally(() => setBuscando(false))
  }, [])

  function handleBuscaChange(v: string) {
    setBusca(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => buscarProdutos(v), 350)
  }

  async function adicionar(produto: Produto) {
    if (destaques.some((d) => d.produto.id === produto.id)) return
    setSalvando(produto.id)
    const res = await fetch('/api/admin/destaques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtoId: produto.id, secao: 'mais-vendidos', ordem: destaques.length }),
    })
    if (res.ok) {
      const { destaque } = await res.json()
      setDestaques((prev) => [...prev, { ...destaque, produto }])
      setBusca('')
      setResultados([])
    }
    setSalvando(null)
  }

  async function remover(id: string) {
    setSalvando(id)
    await fetch(`/api/admin/destaques?id=${id}`, { method: 'DELETE' })
    setDestaques((prev) => prev.filter((d) => d.id !== id))
    setSalvando(null)
  }

  const jaAdicionados = new Set(destaques.map((d) => d.produto.id))

  return (
    <div className="space-y-5">
      {/* Lista atual */}
      {destaques.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Produtos curados ({destaques.length})</p>
          {destaques.map((d) => (
            <div key={d.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              {d.produto.imagens?.[0] && (
                <Image
                  src={d.produto.imagens[0]}
                  alt={d.produto.nome}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover w-10 h-10"
                  unoptimized
                />
              )}
              <span className="flex-1 text-sm font-medium text-gray-800 truncate">{d.produto.nome}</span>
              <span className="text-xs text-gray-400">
                {Number(d.produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <button
                onClick={() => remover(d.id)}
                disabled={salvando === d.id}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
              >
                {salvando === d.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
          Nenhum produto curado ainda. Use a busca abaixo para adicionar.
        </p>
      )}

      {/* Busca */}
      <div className="relative">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={(e) => handleBuscaChange(e.target.value)}
            placeholder="Buscar produto por nome, SKU..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
          {buscando && <Loader2 size={14} className="text-gray-400 animate-spin" />}
        </div>

        {resultados.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => adicionar(p)}
                disabled={jaAdicionados.has(p.id) || salvando === p.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left disabled:opacity-50"
              >
                {p.imagens?.[0] && (
                  <Image src={p.imagens[0]} alt={p.nome} width={32} height={32} className="rounded-lg object-cover w-8 h-8" unoptimized />
                )}
                <span className="flex-1 text-sm text-gray-800 truncate">{p.nome}</span>
                {jaAdicionados.has(p.id)
                  ? <Check size={14} className="text-[#3cbfb3]" />
                  : <Plus size={14} className="text-gray-400" />
                }
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EditorHomePage() {
  const [configs, setConfigs] = useState<Configs>({})
  const [ordemSecoes, setOrdemSecoes] = useState<string[]>(DEFAULT_ORDER)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [contadorBanners, setContadorBanners] = useState(0)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function load() {
      const [cfgRes, bannerRes] = await Promise.all([
        fetch('/api/admin/configuracoes'),
        fetch('/api/admin/banners'),
      ])
      const cfgData = await cfgRes.json()
      const bannerData = await bannerRes.json()

      setConfigs(cfgData)
      setContadorBanners((bannerData.banners ?? []).filter((b: { ativo: boolean }) => b.ativo).length)

      if (cfgData.home_secoes_ordem) {
        try { setOrdemSecoes(JSON.parse(cfgData.home_secoes_ordem)) } catch { /* noop */ }
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(chave: string, valor: string) {
    setConfigs((prev) => ({ ...prev, [chave]: valor }))
  }

  async function save(keys: string[]) {
    setSaving(true)
    const entries = Object.fromEntries(keys.map((k) => [k, configs[k] ?? '']))
    await fetch('/api/admin/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: entries }),
    })
    setSaving(false)
    showToast('Salvo com sucesso!')
  }

  async function saveOrdem() {
    setSaving(true)
    await fetch('/api/admin/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: { home_secoes_ordem: JSON.stringify(ordemSecoes) } }),
    })
    setSaving(false)
    showToast('Ordem das seções salva!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#3cbfb3]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <DeprecatedBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0a0a]">Editor da Home</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure o conteúdo e a ordem das seções da página inicial.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="text-xs text-[#3cbfb3] hover:underline"
        >
          Ver home →
        </Link>
      </div>

      {/* ── 1. Banner / Hero ─────────────────────────────────────────────────── */}
      <Card title="1. Banner / Hero">
        <div className={`flex items-center gap-4 rounded-xl p-4 ${contadorBanners > 0 ? 'bg-[#e8f8f7]' : 'bg-amber-50 border border-amber-200'}`}>
          <ImageIcon size={20} className={`shrink-0 ${contadorBanners > 0 ? 'text-[#3cbfb3]' : 'text-amber-500'}`} />
          <div className="flex-1">
            {contadorBanners > 0 ? (
              <>
                <p className="text-sm font-semibold text-[#0a0a0a]">
                  {contadorBanners} banner{contadorBanners > 1 ? 'es ativos' : ' ativo'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gerencie imagens, ordem, títulos e links na página de banners.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-700">Nenhum banner ativo</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  A home exibe o hero estático (textos configuráveis em Configurações → Editor do Site).
                </p>
              </>
            )}
          </div>
          <Link
            href="/adm-a7f9c2b4/banners"
            className="shrink-0 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            {contadorBanners > 0 ? 'Gerenciar banners →' : 'Adicionar banners →'}
          </Link>
        </div>
      </Card>

      {/* ── 2. Mais Vendidos ─────────────────────────────────────────────────── */}
      <Card title="2. Mais Vendidos">
        <MaisVendidosEditor />
      </Card>

      {/* ── 3. Por que Sixxis? ───────────────────────────────────────────────── */}
      <Card title='3. Por que Sixxis?'>
        <div className="space-y-4">
          {PQ_SIXXIS_NUMS.map((n, idx) => {
            const def = PQ_SIXXIS_CARDS[idx]
            const iconKey  = `pq_sixxis_${n}_icone`
            const tituloKey = `pq_sixxis_${n}_titulo`
            const textoKey  = `pq_sixxis_${n}_texto`
            const iconValue = configs[iconKey] || def.icone
            const PreviewIcon = getPqSixxisIcon(iconValue)
            return (
              <div key={n} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Card {n}</p>
                  <div className="w-9 h-9 rounded-lg bg-[#1a4f4a] flex items-center justify-center">
                    <PreviewIcon size={18} className="text-[#3cbfb3]" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Título">
                    <Input
                      value={configs[tituloKey] ?? ''}
                      onChange={(v) => set(tituloKey, v)}
                      placeholder={def.titulo}
                    />
                  </Field>
                  <Field label="Texto">
                    <Input
                      value={configs[textoKey] ?? ''}
                      onChange={(v) => set(textoKey, v)}
                      placeholder={def.texto}
                    />
                  </Field>
                  <Field label="Ícone">
                    <select
                      value={iconValue}
                      onChange={(e) => set(iconKey, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                    >
                      {PQ_SIXXIS_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            )
          })}
          <button
            onClick={() => save(
              PQ_SIXXIS_NUMS.flatMap((n) => [
                `pq_sixxis_${n}_titulo`,
                `pq_sixxis_${n}_texto`,
                `pq_sixxis_${n}_icone`,
              ]),
            )}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar cards
          </button>
        </div>
      </Card>

      {/* ── 4. Newsletter ────────────────────────────────────────────────────── */}
      <Card title="4. Newsletter">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('newsletter_ativo', configs.newsletter_ativo === 'false' ? 'true' : 'false')}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                configs.newsletter_ativo !== 'false' ? 'bg-[#3cbfb3]' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                configs.newsletter_ativo !== 'false' ? 'left-6' : 'left-1'
              }`} />
            </button>
            <span className="text-sm font-medium text-gray-700">Exibir seção de newsletter</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Título">
              <Input value={configs.newsletter_titulo} onChange={(v) => set('newsletter_titulo', v)} />
            </Field>
            <Field label="Subtítulo">
              <Input value={configs.newsletter_subtitulo} onChange={(v) => set('newsletter_subtitulo', v)} />
            </Field>
          </div>
          <button
            onClick={() => save(['newsletter_ativo','newsletter_titulo','newsletter_subtitulo'])}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar newsletter
          </button>
        </div>
      </Card>

      {/* ── 5. Banner WhatsApp ───────────────────────────────────────────────── */}
      <Card title="5. Banner WhatsApp">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Título">
              <Input value={configs.whatsapp_banner_titulo} onChange={(v) => set('whatsapp_banner_titulo', v)} />
            </Field>
            <Field label="Subtítulo">
              <Input value={configs.whatsapp_banner_subtitulo} onChange={(v) => set('whatsapp_banner_subtitulo', v)} />
            </Field>
          </div>
          <button
            onClick={() => save(['whatsapp_banner_titulo','whatsapp_banner_subtitulo'])}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar banner
          </button>
        </div>
      </Card>

      {/* ── 6. Ordem das seções ──────────────────────────────────────────────── */}
      <Card title="6. Ordem das Seções">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Arraste para reordenar ou use os botões ▲▼. A home renderizará as seções nesta ordem.
          </p>
          <OrdemSecoes value={ordemSecoes} onChange={setOrdemSecoes} />
          <button
            onClick={saveOrdem}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar ordem
          </button>
        </div>
      </Card>
    </div>
  )
}
