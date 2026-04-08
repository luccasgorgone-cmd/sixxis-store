'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, X, Tag } from 'lucide-react'
import { Toast } from '@/components/admin/Toast'

interface Cupom {
  id:          string
  codigo:      string
  tipo:        string
  valor:       number
  usoMaximo:   number | null
  usoAtual:    number
  valorMinimo: number | null
  expiresAt:   string | null
  ativo:       boolean
  createdAt:   string
}

interface FormState {
  codigo:      string
  tipo:        'percentual' | 'fixo'
  valor:       string
  usoMaximo:   string
  valorMinimo: string
  expiresAt:   string
  ativo:       boolean
}

const FORM_EMPTY: FormState = {
  codigo: '', tipo: 'percentual', valor: '', usoMaximo: '', valorMinimo: '', expiresAt: '', ativo: true,
}

function fmt(v: number, tipo: string) {
  return tipo === 'percentual' ? `${v}%` : `R$${Number(v).toFixed(2)}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function AdminCuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>({ ...FORM_EMPTY })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type })

  const fetchCupons = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/cupons')
    const d = await r.json()
    setCupons(d.cupons ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCupons() }, [fetchCupons])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/admin/cupons', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        valor:      Number(form.valor),
        usoMaximo:  form.usoMaximo ? Number(form.usoMaximo) : null,
        valorMinimo: form.valorMinimo ? Number(form.valorMinimo) : null,
        expiresAt:  form.expiresAt || null,
      }),
    })
    setSaving(false)
    if (r.ok) {
      showToast('Cupom criado!')
      setForm({ ...FORM_EMPTY })
      setShowModal(false)
      fetchCupons()
    } else {
      const d = await r.json()
      showToast(d.error ?? 'Erro ao criar cupom', 'error')
    }
  }

  async function handleDelete(id: string, codigo: string) {
    if (!confirm(`Deletar cupom ${codigo}?`)) return
    await fetch(`/api/admin/cupons?id=${id}`, { method: 'DELETE' })
    showToast('Cupom deletado')
    fetchCupons()
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Novo Cupom</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Código *</label>
                <input
                  required
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  placeholder="DESCONTO10"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as 'percentual' | 'fixo' }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Valor {form.tipo === 'percentual' ? '(%)' : '(R$)'} *
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    step={form.tipo === 'percentual' ? 1 : 0.01}
                    value={form.valor}
                    onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                    placeholder={form.tipo === 'percentual' ? '10' : '50.00'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Uso máximo</label>
                  <input
                    type="number"
                    min={1}
                    value={form.usoMaximo}
                    onChange={(e) => setForm((f) => ({ ...f, usoMaximo: e.target.value }))}
                    placeholder="Ilimitado"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Pedido mínimo (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.valorMinimo}
                    onChange={(e) => setForm((f) => ({ ...f, valorMinimo: e.target.value }))}
                    placeholder="0,00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Validade</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                  className="w-4 h-4 accent-[#3cbfb3]"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">Cupom ativo</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Criar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
            <p className="text-sm text-gray-500 mt-0.5">{cupons.length} cupom{cupons.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
          >
            <Plus className="w-4 h-4" /> Novo Cupom
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
          </div>
        ) : cupons.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum cupom cadastrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Código', 'Tipo/Valor', 'Uso', 'Mínimo', 'Validade', 'Status', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cupons.map((c) => {
                  const expirado = c.expiresAt && new Date(c.expiresAt) < new Date()
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-sm text-gray-900">{c.codigo}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(c.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#3cbfb3]">
                        {fmt(Number(c.valor), c.tipo)}
                        <p className="text-xs text-gray-400 font-normal capitalize">{c.tipo}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {c.usoAtual}{c.usoMaximo != null ? `/${c.usoMaximo}` : ''}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {c.valorMinimo ? `R$${Number(c.valorMinimo).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {c.expiresAt ? (
                          <span className={expirado ? 'text-red-500' : 'text-gray-600'}>
                            {fmtDate(c.expiresAt)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          c.ativo && !expirado
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}>
                          {c.ativo && !expirado ? 'Ativo' : expirado ? 'Expirado' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleDelete(c.id, c.codigo)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
