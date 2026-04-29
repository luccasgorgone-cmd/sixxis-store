'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Loader2, Upload, Save, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { Toast } from '@/components/admin/Toast'

interface Banner {
  id:           string
  imagem:       string
  imagemMobile: string | null
  titulo:       string | null
  subtitulo:    string | null
  link:         string | null
  ordem:        number
  ativo:        boolean
  tempoCads:    number
}

const EMPTY: Omit<Banner, 'id' | 'ordem'> = {
  imagem: '', imagemMobile: '', titulo: '', subtitulo: '', link: '', ativo: true, tempoCads: 5,
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileRefMobile = useRef<HTMLInputElement>(null)
  const [uploadingMobile, setUploadingMobile] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ message, type })

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/banners')
    const d = await r.json()
    setBanners(d.banners ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  async function uploadImagem(file: File): Promise<string | null> {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (!r.ok) return null
    const { url } = await r.json()
    return url
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImagem(file)
    if (url) setForm((f) => ({ ...f, imagem: url }))
    else showToast('Erro no upload', 'error')
    e.target.value = ''
  }

  async function handleFileChangeMobile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMobile(true)
    const url = await uploadImagem(file)
    setUploadingMobile(false)
    if (url) setForm((f) => ({ ...f, imagemMobile: url }))
    else showToast('Erro no upload mobile', 'error')
    e.target.value = ''
  }

  async function handleSalvar() {
    if (!form.imagem) { showToast('Adicione uma imagem', 'error'); return }
    if (!form.titulo?.trim()) { showToast('Adicione um título descritivo', 'error'); return }
    setSaving(true)
    const r = await fetch('/api/admin/banners', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, ordem: banners.length }),
    })
    setSaving(false)
    if (r.ok) {
      showToast('Banner criado!')
      setForm({ ...EMPTY })
      setShowForm(false)
      fetchBanners()
    } else {
      showToast('Erro ao salvar', 'error')
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await fetch(`/api/admin/banners/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ativo: !ativo }),
    })
    fetchBanners()
  }

  async function deletar(id: string) {
    if (!confirm('Deletar este banner?')) return
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    showToast('Banner deletado')
    fetchBanners()
  }

  async function reordenar(id: string, dir: 'up' | 'down') {
    const idx = banners.findIndex((b) => b.id === id)
    const newBanners = [...banners]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= newBanners.length) return
    ;[newBanners[idx], newBanners[swap]] = [newBanners[swap], newBanners[idx]]

    setBanners(newBanners)

    await Promise.all(newBanners.map((b, i) =>
      fetch(`/api/admin/banners/${b.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ordem: i }),
      }),
    ))
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
            <p className="text-sm text-gray-500 mt-0.5">Carrossel da página inicial</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
          >
            <Plus className="w-4 h-4" /> Novo Banner
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Novo Banner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Upload — desktop (1920×640, ratio 3:1) */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Imagem desktop (1920×640)</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl h-44 cursor-pointer flex items-center justify-center overflow-hidden relative transition ${
                    form.imagem ? '' : 'border-gray-200 hover:border-[#3cbfb3]'
                  }`}
                >
                  {form.imagem ? (
                    <Image src={form.imagem} alt="preview desktop" fill className="object-cover" unoptimized />
                  ) : uploading ? (
                    <Loader2 className="w-8 h-8 text-[#3cbfb3] animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Clique para enviar imagem desktop</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* Upload mobile (opcional) */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-3">Imagem mobile (1:1 ou 4:3) — opcional</p>
                <div
                  onClick={() => fileRefMobile.current?.click()}
                  className={`border-2 border-dashed rounded-xl h-32 cursor-pointer flex items-center justify-center overflow-hidden relative transition ${
                    form.imagemMobile ? '' : 'border-gray-200 hover:border-[#3cbfb3]'
                  }`}
                >
                  {form.imagemMobile ? (
                    <Image src={form.imagemMobile} alt="preview mobile" fill className="object-cover" unoptimized />
                  ) : uploadingMobile ? (
                    <Loader2 className="w-7 h-7 text-[#3cbfb3] animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Substitui no mobile (≤ 767px)</p>
                    </div>
                  )}
                  <input ref={fileRefMobile} type="file" accept="image/*" className="hidden" onChange={handleFileChangeMobile} />
                </div>
              </div>

              <div className="space-y-3">
                {([
                  { key: 'titulo', label: 'Título', placeholder: 'Título do banner', required: true },
                  { key: 'subtitulo', label: 'Subtítulo', placeholder: 'Subtítulo opcional', required: false },
                  { key: 'link', label: 'Link', placeholder: '/produtos?categoria=climatizadores', required: false },
                ] as const).map(({ key, label, placeholder, required }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-600">
                      {label}
                      {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      value={form[key as 'titulo' | 'subtitulo' | 'link'] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      required={required}
                      aria-required={required}
                      className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-gray-600">Tempo de exibição (s)</label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={form.tempoCads}
                    onChange={(e) => setForm((f) => ({ ...f, tempoCads: Number(e.target.value) }))}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={saving || uploading}
                className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400">Nenhum banner cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((b, idx) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {/* Reordenar */}
                <div className="flex flex-col gap-1">
                  <button onClick={() => reordenar(b.id, 'up')} disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 disabled:opacity-30 transition">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => reordenar(b.id, 'down')} disabled={idx === banners.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 disabled:opacity-30 transition">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview */}
                <div className="w-28 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  <Image src={b.imagem} alt={b.titulo ?? ''} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{b.titulo || '(sem título)'}</p>
                  {b.subtitulo && <p className="text-xs text-gray-400 truncate">{b.subtitulo}</p>}
                  {b.link && <p className="text-xs text-[#3cbfb3] truncate">{b.link}</p>}
                  <p className="text-xs text-gray-400 mt-1">{b.tempoCads}s</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAtivo(b.id, b.ativo)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                      b.ativo
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    {b.ativo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {b.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => deletar(b.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
