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
}

interface ProdutoFormProps {
  initialData?: Partial<ProdutoFormData> & {
    imagens?: string[]
    temVariacoes?: boolean
    variacoes?: VariacaoInput[]
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
  })

  const [temVariacoes, setTemVariacoes] = useState(initialData?.temVariacoes ?? false)
  const [variacoes, setVariacoes] = useState<VariacaoInput[]>(
    initialData?.variacoes ?? [],
  )

  const [imagens, setImagens] = useState<string[]>(initialData?.imagens ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [deleting, setDeleting] = useState(false)

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

    const body = {
      ...form,
      sku: form.sku || null,
      preco: Number(form.preco),
      precoPromocional: form.precoPromocional ? Number(form.precoPromocional) : null,
      estoque: temVariacoes ? estoqueCalculado : Number(form.estoque),
      imagens,
      temVariacoes,
      variacoes: temVariacoes ? variacoes : [],
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
                  onChange={handleChange}
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

            {/* Drop zone */}
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

            {/* Preview grid */}
            {imagens.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {imagens.map((url, i) => (
                  <div key={url} className="relative group aspect-square">
                    <Image
                      src={url}
                      alt={`Foto ${i + 1}`}
                      fill
                      className="object-cover rounded-xl"
                    />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-[#3cbfb3] text-white text-[10px] font-bold rounded-md px-1.5 py-0.5">
                        CAPA
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImagem(url)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagens.length === 0 && !uploading && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <ImageIcon className="w-4 h-4" />
                Nenhuma foto adicionada
              </div>
            )}
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
