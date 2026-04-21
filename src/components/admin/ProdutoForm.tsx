'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Upload,
  X,
  Loader2,
  Save,
  Trash2,
  ImageIcon,
  ChevronLeft,
  Plus,
  GripVertical,
} from 'lucide-react'

interface VariacaoInput {
  id?: string
  nome: string
  sku: string
  preco: string
  estoque: string
  ativo: boolean
}

interface ProdutoFormData {
  sku: string
  nome: string
  slug: string
  descricao: string
  categoria: string
  modelo: string
  preco: string
  precoPromocional: string
  estoque: string
  ativo: boolean
  videoUrl: string
}

export interface EspecificacaoRow { label: string; valor: string }
export interface FaqRow { pergunta: string; resposta: string }

interface ProdutoFormProps {
  initialData?: Partial<ProdutoFormData> & {
    imagens?: string[]
    videoUrl?: string
    temVariacoes?: boolean
    variacoes?: VariacaoInput[]
    especificacoes?: EspecificacaoRow[] | null
    faqs?: FaqRow[] | null
    imagensPorVariacao?: Record<string, string[]> | null
  }
  produtoId?: string
  mode: 'novo' | 'editar'
}

const CATEGORIAS = [
  { value: 'climatizadores', label: 'Climatizadores' },
  { value: 'aspiradores', label: 'Aspiradores' },
  { value: 'spinning', label: 'Spinning' },
]

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function novaVariacao(): VariacaoInput {
  return { nome: '', sku: '', preco: '', estoque: '0', ativo: true }
}

export default function ProdutoForm({ initialData, produtoId, mode }: ProdutoFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const [form, setForm] = useState<ProdutoFormData>({
    sku: initialData?.sku ?? '',
    nome: initialData?.nome ?? '',
    slug: initialData?.slug ?? '',
    descricao: initialData?.descricao ?? '',
    categoria: initialData?.categoria ?? 'climatizadores',
    modelo: initialData?.modelo ?? '',
    preco: initialData?.preco ?? '',
    precoPromocional: initialData?.precoPromocional ?? '',
    estoque: initialData?.estoque ?? '0',
    ativo: initialData?.ativo !== false,
    videoUrl: initialData?.videoUrl ?? '',
  })

  // Especificações e FAQs como JSON editável
  const [especificacoesJson, setEspecificacoesJson] = useState(
    initialData?.especificacoes ? JSON.stringify(initialData.especificacoes, null, 2) : ''
  )
  const [faqsJson, setFaqsJson] = useState(
    initialData?.faqs ? JSON.stringify(initialData.faqs, null, 2) : ''
  )

  const [temVariacoes, setTemVariacoes] = useState(initialData?.temVariacoes ?? false)
  const [variacoes, setVariacoes] = useState<VariacaoInput[]>(
    initialData?.variacoes ?? [],
  )

  const [imagens, setImagens] = useState<string[]>(initialData?.imagens ?? [])
  const [imagensDragOver, setImagensDragOver] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [deleting, setDeleting] = useState(false)

  // ── imagensPorVariacao (color tabs) ─────────────────────────────────────────
  const COR_NOMES = ['branco', 'preto', 'cinza', 'azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'laranja', 'roxo', 'marrom', 'prata', 'dourado', 'grafite', 'bege']
  const COR_HEX: Record<string, string> = {
    branco: '#f5f5f5', preto: '#1a1a1a', cinza: '#9ca3af', azul: '#2563eb',
    vermelho: '#dc2626', verde: '#16a34a', amarelo: '#facc15', rosa: '#ec4899',
    laranja: '#f97316', roxo: '#7c3aed', marrom: '#92400e', prata: '#cbd5e1',
    dourado: '#d97706', grafite: '#4b5563', bege: '#d6b896',
  }
  const variacoesCor = variacoes.filter(v =>
    COR_NOMES.some(c => v.nome.toLowerCase().includes(c))
  )
  const temVariacoesCor = temVariacoes && variacoesCor.length > 0

  const [imagensPorVariacao, setImagensPorVariacao] = useState<Record<string, string[]>>(
    () => {
      const raw = initialData?.imagensPorVariacao
      if (!raw || typeof raw !== 'object') return {}
      return raw as Record<string, string[]>
    }
  )
  const [abaFotoAtiva, setAbaFotoAtiva] = useState<string>(
    () => variacoesCor[0]?.nome ?? ''
  )
  const [uploadingCor, setUploadingCor] = useState(false)

  // Estoque calculado automaticamente quando temVariacoes
  const estoqueCalculado = variacoes.reduce((s, v) => s + Number(v.estoque || 0), 0)

  function handleNomeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nome = e.target.value
    setForm((f) => ({ ...f, nome, slug: slugify(nome) }))
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  // ─── Variações ───────────────────────────────────────────────────────────────

  function addVariacao() {
    setVariacoes((prev) => [...prev, novaVariacao()])
  }

  function removeVariacao(index: number) {
    setVariacoes((prev) => prev.filter((_, i) => i !== index))
  }

  function updateVariacao(index: number, field: keyof VariacaoInput, value: string | boolean) {
    setVariacoes((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    )
  }

  // ─── Imagens ─────────────────────────────────────────────────────────────────

  const uploadFiles = useCallback(async (files: FileList) => {
    setUploading(true)
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      setUploadProgress((p) => [...p, `Enviando ${file.name}...`])
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json()
        newUrls.push(url)
      }
      setUploadProgress((p) => p.filter((m) => m !== `Enviando ${file.name}...`))
    }

    setImagens((prev) => [...prev, ...newUrls])
    setUploading(false)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) uploadFiles(e.target.files)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
  }

  function removeImagem(url: string) {
    setImagens((prev) => prev.filter((u) => u !== url))
  }

  function moverImagemParaInicio(url: string) {
    setImagens(prev => [url, ...prev.filter(u => u !== url)])
  }

  function reordenarImagens(fromIndex: number, toIndex: number) {
    const novas = [...imagens]
    const [movida] = novas.splice(fromIndex, 1)
    novas.splice(toIndex, 0, movida)
    setImagens(novas)
  }

  // ─── Upload por cor ──────────────────────────────────────────────────────────

  async function uploadFilesCor(corNome: string, files: FileList) {
    setUploadingCor(true)
    const novasUrls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const { url } = await res.json()
          novasUrls.push(url)
        }
      } catch { /* ignore */ }
    }
    setImagensPorVariacao(prev => ({
      ...prev,
      [corNome]: [...(prev[corNome] ?? []), ...novasUrls],
    }))
    setUploadingCor(false)
  }

  function removerFotoCor(corNome: string, idx: number) {
    setImagensPorVariacao(prev => ({
      ...prev,
      [corNome]: (prev[corNome] ?? []).filter((_, i) => i !== idx),
    }))
  }

  function reordenarFotosCor(corNome: string, fromIdx: number, toIdx: number) {
    setImagensPorVariacao(prev => {
      const fotos = [...(prev[corNome] ?? [])]
      const [movida] = fotos.splice(fromIdx, 1)
      fotos.splice(toIdx, 0, movida)
      return { ...prev, [corNome]: fotos }
    })
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!form.nome || !form.slug || !form.categoria || !form.preco) {
      setErro('Preencha os campos obrigatórios: Nome, Slug, Categoria e Preço.')
      return
    }

    if (!temVariacoes && !form.sku) {
      setErro('Preencha o SKU (obrigatório quando não há variações).')
      return
    }

    if (temVariacoes && variacoes.length === 0) {
      setErro('Adicione pelo menos uma variação.')
      return
    }

    if (temVariacoes) {
      for (const v of variacoes) {
        if (!v.nome || !v.sku) {
          setErro('Todas as variações precisam de nome e SKU.')
          return
        }
      }
    }

    setSaving(true)

    let especificacoesParsed = null
    let faqsParsed = null
    try { if (especificacoesJson.trim()) especificacoesParsed = JSON.parse(especificacoesJson) } catch {}
    try { if (faqsJson.trim()) faqsParsed = JSON.parse(faqsJson) } catch {}

    const body = {
      ...form,
      sku: form.sku || null,
      preco: Number(form.preco),
      precoPromocional: form.precoPromocional ? Number(form.precoPromocional) : null,
      estoque: temVariacoes ? estoqueCalculado : Number(form.estoque),
      // When product has color variants, combine all per-color photos as the general imagens array
      imagens: temVariacoesCor
        ? Object.values(imagensPorVariacao).flat()
        : imagens,
      videoUrl: form.videoUrl,
      temVariacoes,
      variacoes: temVariacoes ? variacoes : [],
      especificacoes: especificacoesParsed,
      faqs: faqsParsed,
      imagensPorVariacao: temVariacoesCor ? imagensPorVariacao : null,
    }

    const url = mode === 'novo' ? '/api/admin/produtos' : `/api/admin/produtos/${produtoId}`
    const method = mode === 'novo' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)

    if (res.ok) {
      router.push('/admin/produtos')
      router.refresh()
    } else {
      const data = await res.json()
      setErro(data.error ?? 'Erro ao salvar produto.')
    }
  }

  async function handleDelete() {
    if (!produtoId) return
    if (!confirm('Deletar este produto permanentemente?')) return
    setDeleting(true)
    await fetch(`/api/admin/produtos/${produtoId}`, { method: 'DELETE' })
    router.push('/admin/produtos')
    router.refresh()
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'novo' ? 'Novo produto' : 'Editar produto'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === 'novo' ? 'Preencha os dados do produto' : 'Atualize os dados do produto'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'editar' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Deletar
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar produto
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Informações básicas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
              Informações básicas
            </h2>
            <div className="space-y-4">
              {!temVariacoes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    SKU <span className="text-red-500">*</span>
                    <span
                      title="O SKU é o código único do produto, usado para vincular ao ERP e abater estoque automaticamente."
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help"
                    >
                      ?
                    </span>
                  </label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="Ex: SX40-TREND-45L"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Código único — vincula ao ERP e controla estoque</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleNomeChange}
                  required
                  placeholder="Ex: Climatizador Sixxis Pro 2000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))
                  }
                  required
                  placeholder="climatizador-sixxis-pro-2000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                />
                <p className="text-xs text-gray-400 mt-1">URL: /produtos/{form.slug || '...'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descrição completa do produto..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] bg-white"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Modelo</label>
                  <input
                    name="modelo"
                    value={form.modelo}
                    onChange={handleChange}
                    placeholder="Ex: SX-2000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preço e Estoque */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
              Preço e Estoque
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {temVariacoes ? 'Preço base (referência)' : 'Preço (R$)'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="preco"
                  type="number"
                  value={form.preco}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                />
                {temVariacoes && (
                  <p className="text-xs text-gray-400 mt-1">Usado quando a variação não tem preço próprio</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Preço Promocional (R$)
                </label>
                <input
                  name="precoPromocional"
                  type="number"
                  value={form.precoPromocional}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Estoque</label>
                {temVariacoes ? (
                  <div className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-500 flex items-center">
                    {estoqueCalculado} <span className="ml-1 text-xs">(soma das variações)</span>
                  </div>
                ) : (
                  <input
                    name="estoque"
                    type="number"
                    value={form.estoque}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Variações */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Variações
              </h2>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-sm text-gray-500">
                  {temVariacoes ? 'Ativado' : 'Desativado'}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={temVariacoes}
                    onChange={(e) => {
                      setTemVariacoes(e.target.checked)
                      if (e.target.checked && variacoes.length === 0) {
                        setVariacoes([novaVariacao()])
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#3cbfb3] rounded-full transition" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-5" />
                </div>
              </label>
            </div>

            {!temVariacoes && (
              <p className="text-sm text-gray-400">
                Ative para cadastrar variações por voltagem, tamanho, cor, etc.
              </p>
            )}

            {temVariacoes && (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Ex: 110V, 220V, Bivolt — cada variação tem SKU e estoque independentes.
                </p>

                {/* Tabela de variações */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 pr-3">Nome</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 pr-3">SKU</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 pr-3">Preço (R$)</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 pr-3">Estoque</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 pr-3">Ativo</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {variacoes.map((v, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-3">
                            <input
                              value={v.nome}
                              onChange={(e) => updateVariacao(i, 'nome', e.target.value)}
                              placeholder="110V"
                              className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              value={v.sku}
                              onChange={(e) => updateVariacao(i, 'sku', e.target.value)}
                              placeholder="SX40-110V"
                              className="w-36 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              value={v.preco}
                              onChange={(e) => updateVariacao(i, 'preco', e.target.value)}
                              placeholder="Base"
                              min="0"
                              step="0.01"
                              className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              value={v.estoque}
                              onChange={(e) => updateVariacao(i, 'estoque', e.target.value)}
                              min="0"
                              className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              type="checkbox"
                              checked={v.ativo}
                              onChange={(e) => updateVariacao(i, 'ativo', e.target.checked)}
                              className="w-4 h-4 accent-[#3cbfb3]"
                            />
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => removeVariacao(i)}
                              className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition rounded-lg hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={addVariacao}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#3cbfb3] hover:text-[#2a9d8f] transition"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar variação
                </button>
              </div>
            )}
          </div>

          {/* Fotos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
              Fotos do produto
            </h2>

            {temVariacoesCor ? (
              /* ── ABAS POR COR ─────────────────────────────────────────────── */
              <div>
                <p className="text-xs text-gray-400 mb-4">
                  Este produto tem variações de cor. Faça upload das fotos separadas para cada cor — ao clicar na cor na loja, as fotos correspondentes são exibidas.
                </p>

                {/* Tabs */}
                <div className="flex gap-0 border-b border-gray-100 mb-4">
                  {variacoesCor.map(v => {
                    const corNome = COR_NOMES.find(c => v.nome.toLowerCase().includes(c))
                    const hex = corNome ? COR_HEX[corNome] : '#888'
                    const count = (imagensPorVariacao[v.nome] ?? []).length
                    return (
                      <button
                        key={v.id ?? v.nome}
                        type="button"
                        onClick={() => setAbaFotoAtiva(v.nome)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                          abaFotoAtiva === v.nome
                            ? 'border-[#3cbfb3] text-[#3cbfb3]'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        {v.nome}
                        <span className="text-[10px] text-gray-400">({count})</span>
                      </button>
                    )
                  })}
                </div>

                {/* Upload area + grid per active tab */}
                {variacoesCor.map(v => abaFotoAtiva === v.nome && (
                  <div key={v.id ?? v.nome}>
                    {/* Drop zone */}
                    <label className="block cursor-pointer mb-4">
                      <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                        uploadingCor ? 'border-[#3cbfb3] bg-[#3cbfb3]/5' : 'border-gray-200 hover:border-[#3cbfb3] hover:bg-gray-50'
                      }`}>
                        {uploadingCor ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-7 h-7 text-[#3cbfb3] animate-spin" />
                            <p className="text-sm text-gray-500">Enviando...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-7 h-7 text-gray-400" />
                            <p className="text-sm font-medium text-gray-700">
                              Fotos da cor <strong>{v.nome}</strong>
                            </p>
                            <p className="text-xs text-gray-400">JPG, PNG, WebP — múltiplos arquivos</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => { if (e.target.files?.length) uploadFilesCor(v.nome, e.target.files) }}
                      />
                    </label>

                    {/* Grid */}
                    {(imagensPorVariacao[v.nome] ?? []).length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {(imagensPorVariacao[v.nome] ?? []).map((url, idx) => (
                          <div
                            key={url + idx}
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setData('text/plain', String(idx))
                            }}
                            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                            onDrop={e => {
                              e.preventDefault()
                              const from = Number(e.dataTransfer.getData('text/plain'))
                              if (from !== idx) reordenarFotosCor(v.nome, from, idx)
                            }}
                            className="relative group cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border-2 aspect-square transition-all border-gray-200 hover:border-[#3cbfb3]/50"
                          >
                            <img
                              src={url}
                              alt={`${v.nome} ${idx + 1}`}
                              className="w-full h-full object-contain p-1.5 bg-gray-50 pointer-events-none"
                              draggable={false}
                            />
                            <div className="absolute top-1.5 left-1.5">
                              {idx === 0
                                ? <span className="bg-[#3cbfb3] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">CAPA</span>
                                : <span className="bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{idx + 1}</span>
                              }
                            </div>
                            <button
                              type="button"
                              onClick={() => removerFotoCor(v.nome, idx)}
                              className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-400">Nenhuma foto da cor <strong>{v.nome}</strong></p>
                        <p className="text-xs text-gray-300 mt-1">Use a área acima para fazer upload</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/>
                    </svg>
                    As fotos de cada cor aparecem quando o cliente seleciona aquela cor na loja. Salve o produto para aplicar.
                  </p>
                </div>
              </div>

            ) : (
              /* ── FOTOS GERAIS (sem variação de cor) ──────────────────────── */
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                    dragging
                      ? 'border-[#3cbfb3] bg-[#3cbfb3]/5'
                      : 'border-gray-200 hover:border-[#3cbfb3] hover:bg-gray-50'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#3cbfb3] animate-spin" />
                      <p className="text-sm text-gray-500">
                        {uploadProgress.join(', ') || 'Enviando...'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">
                        Arraste fotos aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-gray-400">JPG, PNG, WebP — múltiplos arquivos</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {imagens.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                      <GripVertical size={12} />
                      Arraste as fotos para reordenar. A primeira foto é a capa do produto.
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {imagens.map((url, index) => (
                        <div
                          key={url}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData('text/plain', String(index))
                          }}
                          onDragOver={e => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setImagensDragOver(index)
                          }}
                          onDragLeave={() => setImagensDragOver(null)}
                          onDrop={e => {
                            e.preventDefault()
                            const fromIndex = Number(e.dataTransfer.getData('text/plain'))
                            if (fromIndex !== index) reordenarImagens(fromIndex, index)
                            setImagensDragOver(null)
                          }}
                          onDragEnd={() => setImagensDragOver(null)}
                          className={`relative group cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border-2 transition-all duration-150 aspect-square ${
                            imagensDragOver === index
                              ? 'border-[#3cbfb3] scale-[1.03] shadow-lg'
                              : index === 0
                              ? 'border-[#3cbfb3] ring-2 ring-[#3cbfb3] ring-offset-1'
                              : 'border-gray-200 hover:border-[#3cbfb3]/50'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-contain p-1.5 bg-gray-50 pointer-events-none"
                            draggable={false}
                          />
                          <div className="absolute top-1.5 left-1.5">
                            {index === 0 ? (
                              <span className="bg-[#3cbfb3] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">CAPA</span>
                            ) : (
                              <span className="bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{index + 1}</span>
                            )}
                          </div>
                          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-black/50 rounded-md p-0.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                              </svg>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setImagens(imagens.filter((_, i) => i !== index))}
                            className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                            title="Remover foto"
                          >×</button>
                          {imagensDragOver === index && (
                            <div className="absolute inset-0 bg-[#3cbfb3]/20 flex items-center justify-center rounded-xl">
                              <div className="bg-[#3cbfb3] text-white text-xs font-bold px-3 py-1 rounded-full shadow">Soltar aqui</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/>
                        </svg>
                        A foto na posição 1 é a capa (aparece primeiro na loja). Arraste para reorganizar e salve o produto.
                      </p>
                    </div>
                  </div>
                )}

                {imagens.length === 0 && !uploading && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <ImageIcon className="w-4 h-4" />
                    Nenhuma foto adicionada
                  </div>
                )}
              </>
            )}
          </div>

          {/* Vídeo do produto */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
              Vídeo do Produto
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL do Vídeo</label>
              <input
                name="videoUrl"
                type="text"
                value={form.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=... ou link direto MP4"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Cole URL do YouTube, Vimeo ou MP4 direto. Aparece como último item na galeria do produto.
              </p>
            </div>
            {form.videoUrl && (
              <div className="mt-4 bg-gray-50 rounded-xl overflow-hidden h-44 flex items-center justify-center border border-gray-100">
                {form.videoUrl.includes('youtube') || form.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={form.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full"
                    allow="accelerometer; autoplay"
                    allowFullScreen
                    title="Preview do vídeo"
                  />
                ) : (
                  <video src={form.videoUrl} controls className="w-full h-full object-contain" />
                )}
              </div>
            )}
          </div>

          {/* Especificações */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider">
              Especificações Técnicas
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Formato JSON: <code className="bg-gray-100 px-1 rounded">{`[{"label":"Potência","valor":"180W"},...]`}</code>
            </p>
            <textarea
              value={especificacoesJson}
              onChange={e => setEspecificacoesJson(e.target.value)}
              rows={8}
              placeholder={'[\n  {"label": "Modelo", "valor": "SX040"},\n  {"label": "Potência", "valor": "180 W"}\n]'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] resize-none"
            />
          </div>

          {/* Perguntas Frequentes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wider">
              Perguntas Frequentes (FAQ)
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Formato JSON: <code className="bg-gray-100 px-1 rounded">{`[{"pergunta":"...","resposta":"..."},...]`}</code>
            </p>
            <textarea
              value={faqsJson}
              onChange={e => setFaqsJson(e.target.value)}
              rows={8}
              placeholder={'[\n  {\n    "pergunta": "Qual a voltagem?",\n    "resposta": "Bivolt 110V/220V."\n  }\n]'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] resize-none"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
              Publicação
            </h2>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">Produto ativo</p>
                <p className="text-xs text-gray-400 mt-0.5">Visível na loja</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#3cbfb3] rounded-full transition" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Resumo
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Fotos</dt>
                <dd className="font-medium text-gray-700">{imagens.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Categoria</dt>
                <dd className="font-medium text-gray-700 capitalize">{form.categoria}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Estoque</dt>
                <dd className="font-medium text-gray-700">
                  {temVariacoes ? estoqueCalculado : form.estoque || 0}
                </dd>
              </div>
              {temVariacoes && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Variações</dt>
                  <dd className="font-medium text-gray-700">{variacoes.length}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className={`font-semibold ${form.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                  {form.ativo ? 'Ativo' : 'Inativo'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </form>
  )
}
