'use client'

import { useState } from 'react'
import LayoutConta from '@/components/conta/LayoutConta'
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function SegurancaPage() {
  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' })
  const [show, setShow] = useState({ atual: false, nova: false, confirmar: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (form.novaSenha !== form.confirmar) { setMsg('As senhas não coincidem.'); return }
    if (form.novaSenha.length < 6)         { setMsg('A nova senha deve ter ao menos 6 caracteres.'); return }
    setSaving(true); setMsg('')
    const res = await fetch('/api/conta/senha', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha }) })
    setSaving(false)
    if (res.ok) { setMsg('Senha alterada com sucesso!'); setForm({ senhaAtual: '', novaSenha: '', confirmar: '' }) }
    else { const d = await res.json(); setMsg(d.error || 'Erro ao alterar senha.') }
  }

  const fields = [
    { label: 'Senha atual',          key: 'senhaAtual', showKey: 'atual'     },
    { label: 'Nova senha',           key: 'novaSenha',  showKey: 'nova'      },
    { label: 'Confirmar nova senha', key: 'confirmar',  showKey: 'confirmar' },
  ] as const

  return (
    <LayoutConta>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h1 className="font-extrabold text-gray-900 flex items-center gap-2"><Lock size={18} className="text-[#3cbfb3]" /> Segurança</h1>
        </div>
        <form onSubmit={salvar} className="px-5 py-5 space-y-4">
          {fields.map(({ label, key, showKey }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <div className="relative mt-1.5">
                <input
                  type={show[showKey] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]"
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          {msg && (
            <div className={`flex items-center gap-2 text-sm font-semibold ${msg.includes('sucesso') ? 'text-green-600' : 'text-red-500'}`}>
              {msg.includes('sucesso') && <ShieldCheck size={14} />} {msg}
            </div>
          )}
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Alterar senha
          </button>
        </form>
      </div>
    </LayoutConta>
  )
}
