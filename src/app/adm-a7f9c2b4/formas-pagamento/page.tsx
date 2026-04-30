'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Loader2, Upload, Save, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { Toast } from '@/components/admin/Toast'

interface FormaPagamento {
  id:        string
  nome:      string
  iconeUrl:  string
  ordem:     number
  ativo:     boolean
}

interface Editavel extends FormaPagamento {
  isNew?:    boolean
  uploading?: boolean
}

export default function FormasPagamentoAdmin() {
  const [formas, setFormas]     = useState<Editavel[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    try {
      const res = await fetch('/api/admin/formas-pagamento', { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      setFormas(data.formas ?? [])
    } catch {
      setToast({ msg: 'Erro ao carregar formas de pagamento', tipo: 'error' })
    }
    setCarregando(false)
  }

  function adicionar() {
    const novaOrdem = formas.length > 0 ? Math.max(...formas.map(f => f.ordem)) + 1 : 0
    setFormas(prev => [
      ...prev,
      {
        id:        `new-${Date.now()}`,
        nome:      '',
        iconeUrl:  '',
        ordem:     novaOrdem,
        ativo:     true,
        isNew:     true,
      },
    ])
  }

  function atualizar(id: string, patch: Partial<FormaPagamento>) {
    setFormas(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  async function uploadIcone(id: string, file: File) {
    atualizar(id, {})
    setFormas(prev => prev.map(f => f.id === id ? { ...f, uploading: true } : f))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'pagamentos')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) throw new Error('falha upload')
      const { url } = await res.json()
      setFormas(prev => prev.map(f => f.id === id ? { ...f, iconeUrl: url, uploading: false } : f))
    } catch {
      setFormas(prev => prev.map(f => f.id === id ? { ...f, uploading: false } : f))
      setToast({ msg: 'Erro ao enviar ícone', tipo: 'error' })
    }
  }

  async function salvar(forma: Editavel) {
    if (!forma.nome.trim() || !forma.iconeUrl.trim()) {
      setToast({ msg: 'Preencha nome e ícone', tipo: 'error' })
      return
    }
    setSalvando(forma.id)
    try {
      const url = forma.isNew
        ? '/api/admin/formas-pagamento'
        : `/api/admin/formas-pagamento/${forma.id}`
      const method = forma.isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome:     forma.nome,
          iconeUrl: forma.iconeUrl,
          ordem:    forma.ordem,
          ativo:    forma.ativo,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'falha')
      }
      setToast({ msg: forma.isNew ? 'Forma criada' : 'Forma salva', tipo: 'success' })
      await carregar()
    } catch (err) {
      setToast({ msg: (err as Error).message || 'Erro ao salvar', tipo: 'error' })
    }
    setSalvando(null)
  }

  async function deletar(id: string) {
    if (id.startsWith('new-')) {
      setFormas(prev => prev.filter(f => f.id !== id))
      return
    }
    if (!confirm('Deletar essa forma de pagamento?')) return
    try {
      const res = await fetch(`/api/admin/formas-pagamento/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('falha')
      setToast({ msg: 'Deletada', tipo: 'success' })
      setFormas(prev => prev.filter(f => f.id !== id))
    } catch {
      setToast({ msg: 'Erro ao deletar', tipo: 'error' })
    }
  }

  function moverOrdem(id: string, dir: -1 | 1) {
    setFormas(prev => {
      const sorted = [...prev].sort((a, b) => a.ordem - b.ordem)
      const idx = sorted.findIndex(f => f.id === id)
      const target = idx + dir
      if (target < 0 || target >= sorted.length) return prev
      const a = sorted[idx]
      const b = sorted[target]
      return prev.map(f => {
        if (f.id === a.id) return { ...f, ordem: b.ordem }
        if (f.id === b.id) return { ...f, ordem: a.ordem }
        return f
      })
    })
  }

  const sorted = [...formas].sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formas de Pagamento</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os ícones que aparecem no rodapé da loja.
          </p>
        </div>
        <button
          onClick={adicionar}
          className="inline-flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-500">Nenhuma forma de pagamento cadastrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((forma, idx) => (
            <div key={forma.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              {/* Ícone */}
              <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {forma.uploading ? (
                  <Loader2 size={20} className="text-gray-400 animate-spin" />
                ) : forma.iconeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={forma.iconeUrl} alt={forma.nome} className="w-full h-full object-contain p-1" />
                ) : (
                  <Upload size={20} className="text-gray-300" />
                )}
              </div>

              {/* Inputs */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                <input
                  type="text"
                  value={forma.nome}
                  onChange={e => atualizar(forma.id, { nome: e.target.value })}
                  placeholder="Nome (ex: Visa, PIX, Mastercard)"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3cbfb3]"
                />
                <button
                  onClick={() => fileInputRefs.current[forma.id]?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#3cbfb3] border border-[#3cbfb3]/30 rounded-lg hover:bg-[#3cbfb3]/5 transition"
                >
                  <Upload size={13} /> Ícone
                </button>
                <input
                  ref={el => { fileInputRefs.current[forma.id] = el }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) uploadIcone(forma.id, file)
                  }}
                />
                <input
                  type="number"
                  value={forma.ordem}
                  onChange={e => atualizar(forma.id, { ordem: Number(e.target.value) || 0 })}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-[#3cbfb3]"
                  title="Ordem"
                />
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moverOrdem(forma.id, -1)}
                  disabled={idx === 0}
                  className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition"
                  title="Subir"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moverOrdem(forma.id, 1)}
                  disabled={idx === sorted.length - 1}
                  className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition"
                  title="Descer"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={() => atualizar(forma.id, { ativo: !forma.ativo })}
                  className={`p-2 transition ${forma.ativo ? 'text-emerald-500 hover:text-emerald-700' : 'text-gray-300 hover:text-gray-500'}`}
                  title={forma.ativo ? 'Ativo' : 'Inativo'}
                >
                  {forma.ativo ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => salvar(forma)}
                  disabled={salvando === forma.id}
                  className="inline-flex items-center gap-1.5 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                  title="Salvar"
                >
                  {salvando === forma.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                </button>
                <button
                  onClick={() => deletar(forma.id)}
                  className="p-2 text-red-400 hover:text-red-600 transition"
                  title="Deletar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
