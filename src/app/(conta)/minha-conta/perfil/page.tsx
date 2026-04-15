'use client'

import { useEffect, useState } from 'react'
import LayoutConta from '@/components/conta/LayoutConta'
import { User, Save, Loader2 } from 'lucide-react'

export default function PerfilPage() {
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', telefone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    fetch('/api/conta/perfil')
      .then(r => r.json())
      .then(d => {
        if (d.cliente) setForm({ nome: d.cliente.nome || '', email: d.cliente.email || '', cpf: d.cliente.cpf || '', telefone: d.cliente.telefone || '' })
      })
      .finally(() => setLoading(false))
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg('')
    const res = await fetch('/api/conta/perfil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: form.nome, telefone: form.telefone }) })
    setSaving(false)
    setMsg(res.ok ? 'Perfil atualizado!' : 'Erro ao salvar.')
  }

  if (loading) return <LayoutConta><div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-[#3cbfb3]" /></div></LayoutConta>

  return (
    <LayoutConta>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h1 className="font-extrabold text-gray-900 flex items-center gap-2"><User size={18} className="text-[#3cbfb3]" /> Meu Perfil</h1>
        </div>
        <form onSubmit={salvar} className="px-5 py-5 space-y-4">
          {[
            { label: 'Nome',     key: 'nome',     type: 'text',  disabled: false },
            { label: 'E-mail',   key: 'email',    type: 'email', disabled: true  },
            { label: 'CPF',      key: 'cpf',      type: 'text',  disabled: true  },
            { label: 'Telefone', key: 'telefone', type: 'tel',   disabled: false },
          ].map(({ label, key, type, disabled }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                disabled={disabled}
                className="mt-1.5 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3] disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          ))}
          {msg && <p className={`text-sm font-semibold ${msg.includes('Erro') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar alterações
          </button>
        </form>
      </div>
    </LayoutConta>
  )
}
