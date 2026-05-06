'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Loader2, Eye, EyeOff, ChevronUp, ChevronDown, Pencil } from 'lucide-react'
import { Toast } from '@/components/admin/Toast'
import { BannerForm, type Banner } from './BannerForm'

type EditingState = { kind: 'new' } | { kind: 'edit'; id: string } | null

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editing, setEditing] = useState<EditingState>(null)

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

  function toggleNew() {
    setEditing((e) => (e?.kind === 'new' ? null : { kind: 'new' }))
  }

  function startEdit(id: string) {
    setEditing({ kind: 'edit', id })
  }

  function closeForm() {
    setEditing(null)
  }

  function onSaved() {
    setEditing(null)
    fetchBanners()
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
            onClick={toggleNew}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
          >
            <Plus className="w-4 h-4" /> Novo Banner
          </button>
        </div>

        {/* Form de novo banner */}
        {editing?.kind === 'new' && (
          <BannerForm
            ordem={banners.length}
            onSaved={onSaved}
            onCancel={closeForm}
            onError={(m) => showToast(m, 'error')}
            onSuccess={(m) => showToast(m, 'success')}
          />
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
            {banners.map((b, idx) => {
              const isEditingThis = editing?.kind === 'edit' && editing.id === b.id
              return (
                <div key={b.id}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
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
                      <p className="text-xs text-gray-400 mt-1">
                        {b.tempoCads}s
                        {b.imagemTablet && <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-300">• tablet</span>}
                        {b.imagemMobile && <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-300">• mobile</span>}
                      </p>
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
                        onClick={() => (isEditingThis ? closeForm() : startEdit(b.id))}
                        title={isEditingThis ? 'Fechar edição' : 'Editar banner'}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                          isEditingThis
                            ? 'bg-[#3cbfb3]/10 text-[#3cbfb3]'
                            : 'text-gray-300 hover:text-[#3cbfb3] hover:bg-[#3cbfb3]/10'
                        }`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletar(b.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditingThis && (
                    <div className="mt-3">
                      <BannerForm
                        banner={b}
                        onSaved={onSaved}
                        onCancel={closeForm}
                        onError={(m) => showToast(m, 'error')}
                        onSuccess={(m) => showToast(m, 'success')}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
