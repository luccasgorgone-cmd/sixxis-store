'use client'

import { useEffect, useState } from 'react'
import LayoutConta from '@/components/conta/LayoutConta'
import { MapPin, Plus, Trash2, Star, Loader2 } from 'lucide-react'

interface Endereco {
  id: string; cep: string; logradouro: string; numero: string
  complemento: string | null; bairro: string; cidade: string; estado: string; principal: boolean
}

const BLANK = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', principal: false }

export default function EnderecosPage() {
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [loading, setLoading]     = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  const [form, setForm]           = useState(BLANK)
  const [saving, setSaving]       = useState(false)
  const [actionId, setActionId]   = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/enderecos'); const d = await res.json()
    setEnderecos(d.enderecos || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/enderecos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, cep: form.cep.replace(/\D/g, '') }) })
    setSaving(false); setAdicionando(false); setForm(BLANK); load()
  }

  async function remover(id: string) {
    setActionId(id)
    await fetch(`/api/enderecos/${id}`, { method: 'DELETE' })
    setActionId(null); load()
  }

  return (
    <LayoutConta>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-extrabold text-gray-900 flex items-center gap-2 text-lg"><MapPin size={18} className="text-[#3cbfb3]" /> Meus Endereços</h1>
          <button onClick={() => setAdicionando(a => !a)} className="flex items-center gap-1.5 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-bold px-4 py-2 rounded-xl transition">
            <Plus size={14} /> Novo
          </button>
        </div>

        {adicionando && (
          <form onSubmit={salvar} className="bg-white rounded-2xl border border-[#3cbfb3]/30 shadow-sm px-5 py-5 space-y-3">
            <h2 className="font-bold text-gray-900 text-sm">Novo endereço</h2>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'CEP', key: 'cep', col: 1 }, { label: 'Logradouro', key: 'logradouro', col: 2 }, { label: 'Número', key: 'numero', col: 1 }, { label: 'Complemento', key: 'complemento', col: 1 }, { label: 'Bairro', key: 'bairro', col: 1 }, { label: 'Cidade', key: 'cidade', col: 1 }].map(({ label, key, col }) => (
                <div key={key} className={col === 2 ? 'col-span-2' : ''}>
                  <label className="text-xs font-semibold text-gray-500">{label}</label>
                  <input type="text" value={form[key as keyof typeof form] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500">Estado</label>
                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30">
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.principal} onChange={e => setForm(f => ({ ...f, principal: e.target.checked }))} className="rounded" /> Endereço principal
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
                {saving && <Loader2 size={13} className="animate-spin" />} Salvar
              </button>
              <button type="button" onClick={() => setAdicionando(false)} className="text-sm text-gray-500 hover:text-gray-800 transition">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#3cbfb3]" /></div>
        ) : enderecos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">Nenhum endereço cadastrado.</div>
        ) : (
          <div className="space-y-3">
            {enderecos.map(e => (
              <div key={e.id} className={`bg-white rounded-2xl border shadow-sm px-5 py-4 flex items-start justify-between ${e.principal ? 'border-[#3cbfb3]/40' : 'border-gray-100'}`}>
                <div>
                  {e.principal && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3cbfb3] bg-[#f0fffe] px-2 py-0.5 rounded-full mb-2"><Star size={9} /> Principal</span>}
                  <p className="text-sm font-semibold text-gray-900">{e.logradouro}, {e.numero}{e.complemento ? `, ${e.complemento}` : ''}</p>
                  <p className="text-xs text-gray-500">{e.bairro}, {e.cidade} — {e.estado} · CEP {e.cep}</p>
                </div>
                <button onClick={() => remover(e.id)} disabled={actionId === e.id} className="p-2 text-gray-300 hover:text-red-400 transition">
                  {actionId === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutConta>
  )
}
