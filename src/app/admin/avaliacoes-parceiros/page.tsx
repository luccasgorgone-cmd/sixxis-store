'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Save, X } from 'lucide-react'

interface Avaliacao {
  id: string
  nomeCompleto: string
  empresa?: string
  cargo?: string
  cidade?: string
  nota: number
  titulo: string
  comentario: string
  avatarInicial?: string
  corAvatar: string
  aprovada: boolean
  destaque: boolean
  ordem: number
}

const CORES = ['#3cbfb3', '#0f2e2b', '#1a4f4a', '#8b5cf6', '#f59e0b', '#16a34a', '#2563eb', '#ef4444']

function Toggle({ value, onChange, color = '#3cbfb3' }: { value: boolean; onChange: () => void; color?: string }) {
  return (
    <button type="button" onClick={onChange}
      className="w-9 h-5 rounded-full relative transition-colors shrink-0"
      style={{ backgroundColor: value ? color : '#d1d5db' }}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-4' : 'left-0.5'}`} />
    </button>
  )
}

function FormAvaliacao({
  av,
  onSalvar,
  onCancelar,
}: {
  av?: Partial<Avaliacao>
  onSalvar: (d: Omit<Avaliacao, 'id'>) => void
  onCancelar: () => void
}) {
  const [form, setForm] = useState({
    nomeCompleto:  av?.nomeCompleto  ?? '',
    empresa:       av?.empresa       ?? '',
    cargo:         av?.cargo         ?? '',
    cidade:        av?.cidade        ?? '',
    nota:          av?.nota          ?? 5,
    titulo:        av?.titulo        ?? '',
    comentario:    av?.comentario    ?? '',
    avatarInicial: av?.avatarInicial ?? '',
    corAvatar:     av?.corAvatar     ?? '#3cbfb3',
    aprovada:      av?.aprovada      !== false,
    destaque:      av?.destaque      ?? false,
    ordem:         av?.ordem         ?? 0,
  })

  const f = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h3 className="text-sm font-extrabold text-gray-900">
        {av?.id ? 'Editar avaliação' : 'Nova avaliação de parceiro'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Nome Completo *</label>
          <input value={form.nomeCompleto} onChange={e => f('nomeCompleto', e.target.value)}
            className="w-full border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none transition" />
        </div>
        {([
          { k: 'empresa', l: 'Empresa' },
          { k: 'cargo',   l: 'Cargo' },
          { k: 'cidade',  l: 'Cidade / Estado' },
        ] as { k: keyof typeof form; l: string }[]).map(({ k, l }) => (
          <div key={k}>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{l}</label>
            <input value={form[k] as string} onChange={e => f(k, e.target.value)}
              className="w-full border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none transition" />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Título da Avaliação *</label>
          <input value={form.titulo} onChange={e => f('titulo', e.target.value)}
            className="w-full border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none transition" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Comentário *</label>
          <textarea value={form.comentario} onChange={e => f('comentario', e.target.value)}
            rows={4} className="w-full border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition" />
        </div>

        {/* Nota */}
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-2">Nota</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => f('nota', n)} className="p-0.5 transition">
                <Star size={20} className={n <= form.nota ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'} />
              </button>
            ))}
          </div>
        </div>

        {/* Cor avatar */}
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-2">Cor do Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {CORES.map(cor => (
              <button key={cor} type="button" onClick={() => f('corAvatar', cor)}
                className={`w-6 h-6 rounded-full transition-all ${form.corAvatar === cor ? 'ring-2 ring-offset-1 ring-gray-400 scale-125' : ''}`}
                style={{ backgroundColor: cor }} />
            ))}
          </div>
        </div>

        {/* Inicial + ordem */}
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Inicial do Avatar</label>
          <input value={form.avatarInicial} maxLength={1}
            onChange={e => f('avatarInicial', e.target.value.toUpperCase())}
            placeholder={form.nomeCompleto?.[0] || 'A'}
            className="w-16 border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none text-center font-extrabold uppercase" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Ordem</label>
          <input type="number" value={form.ordem}
            onChange={e => f('ordem', parseInt(e.target.value) || 0)}
            className="w-24 border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none" />
        </div>

        {/* Toggles */}
        <div className="sm:col-span-2 flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => f('aprovada', !form.aprovada)}>
            <Toggle value={form.aprovada} onChange={() => f('aprovada', !form.aprovada)} />
            <span className="text-xs font-semibold text-gray-700">Aprovada (visível no site)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => f('destaque', !form.destaque)}>
            <Toggle value={form.destaque} onChange={() => f('destaque', !form.destaque)} color="#f59e0b" />
            <span className="text-xs font-semibold text-gray-700">Em destaque</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => onSalvar(form as Omit<Avaliacao, 'id'>)}
          className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition">
          <Save size={14} /> Salvar
        </button>
        <button type="button" onClick={onCancelar}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  )
}

export default function AvaliacoesParceiroAdmin() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Avaliacao | null>(null)

  const carregar = async () => {
    try {
      const r = await fetch('/api/admin/avaliacoes-parceiros')
      const data = await r.json()
      setAvaliacoes(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const salvar = async (form: Omit<Avaliacao, 'id'>) => {
    if (editando) {
      await fetch(`/api/admin/avaliacoes-parceiros/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/admin/avaliacoes-parceiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setFormAberto(false)
    setEditando(null)
    carregar()
  }

  const toggleAprovada = async (av: Avaliacao) => {
    await fetch(`/api/admin/avaliacoes-parceiros/${av.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aprovada: !av.aprovada }),
    })
    carregar()
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta avaliação permanentemente?')) return
    await fetch(`/api/admin/avaliacoes-parceiros/${id}`, { method: 'DELETE' })
    carregar()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Avaliações de Parceiros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Depoimentos exibidos na página &quot;Seja um Parceiro&quot;
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setFormAberto(true) }}
          className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-md">
          <Plus size={15} /> Nova avaliação
        </button>
      </div>

      {/* Form */}
      {(formAberto || editando) && (
        <div className="mb-5">
          <FormAvaliacao
            av={editando ?? undefined}
            onSalvar={salvar}
            onCancelar={() => { setFormAberto(false); setEditando(null) }}
          />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : avaliacoes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm mb-3">Nenhuma avaliação de parceiro cadastrada.</p>
          <button onClick={() => setFormAberto(true)}
            className="text-[#3cbfb3] text-sm font-bold hover:underline">
            Criar a primeira avaliação
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {avaliacoes.map(av => (
            <div
              key={av.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 transition ${
                av.aprovada ? 'border-gray-100' : 'border-gray-100 opacity-55'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                style={{ backgroundColor: av.corAvatar }}>
                {av.avatarInicial || av.nomeCompleto?.[0] || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-extrabold text-gray-900">{av.nomeCompleto}</p>
                  {av.empresa && <span className="text-xs text-gray-400">· {av.empresa}</span>}
                  {av.destaque && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">DESTAQUE</span>
                  )}
                  {!av.aprovada && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">OCULTA</span>
                  )}
                  {av.cidade && (
                    <span className="text-[10px] text-[#3cbfb3] font-semibold">{av.cidade}</span>
                  )}
                </div>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={11}
                      className={i <= av.nota ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <p className="text-xs font-bold text-gray-700 truncate">&quot;{av.titulo}&quot;</p>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{av.comentario}</p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleAprovada(av)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                    av.aprovada
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={av.aprovada ? 'Ocultar' : 'Publicar'}>
                  {av.aprovada ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => { setEditando(av); setFormAberto(false) }}
                  className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition">
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => excluir(av.id)}
                  className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
