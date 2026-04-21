'use client'

import { useState, useCallback } from 'react'
import {
  Mail,
  Save,
  Send,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface TemplateData {
  tipo: string
  label: string
  ativo: boolean
  assunto: string
  corpo: string
  prazo: number
  unidadePrazo: string
  variaveis: string[]
  existeNoBanco: boolean
}

interface Props {
  templates: TemplateData[]
}

type ToastType = { message: string; ok: boolean } | null

export default function EmailTemplateEditor({ templates: initialTemplates }: Props) {
  const [templates, setTemplates] = useState<TemplateData[]>(initialTemplates)
  const [activeTab, setActiveTab] = useState(initialTemplates[0]?.tipo ?? '')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)
  const [testEmail, setTestEmail] = useState('')
  const [showTestInput, setShowTestInput] = useState(false)

  const current = templates.find((t) => t.tipo === activeTab)

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const updateCurrent = useCallback(
    (updates: Partial<TemplateData>) => {
      setTemplates((prev) =>
        prev.map((t) => (t.tipo === activeTab ? { ...t, ...updates } : t)),
      )
    },
    [activeTab],
  )

  async function handleSave() {
    if (!current) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: current.tipo,
          ativo: current.ativo,
          assunto: current.assunto,
          corpo: current.corpo,
          prazo: current.prazo,
          unidadePrazo: current.unidadePrazo,
        }),
      })
      if (res.ok) {
        showToast('Template salvo com sucesso!', true)
        setTemplates((prev) =>
          prev.map((t) => (t.tipo === activeTab ? { ...t, existeNoBanco: true } : t)),
        )
      } else {
        const data = await res.json()
        showToast(data.error ?? 'Erro ao salvar', false)
      }
    } catch {
      showToast('Erro de rede', false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest() {
    if (!current) return
    const email = testEmail.trim()
    if (!email) {
      showToast('Informe um email de destino', false)
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch('/api/admin/email-templates/teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: current.tipo, emailDestino: email }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Email de teste enviado para ${data.enviado_para}`, true)
        setShowTestInput(false)
      } else {
        showToast(data.error ?? 'Erro ao enviar', false)
      }
    } catch {
      showToast('Erro de rede', false)
    } finally {
      setSendingTest(false)
    }
  }

  if (!current) return null

  return (
    <div className="flex flex-col gap-0 max-w-full overflow-hidden">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            toast.ok ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar de tabs — lista em mobile, coluna em desktop */}
        <div className="w-full md:w-56 md:shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden md:overflow-visible">
            <div className="flex md:flex-col overflow-x-auto md:overflow-visible">
              {templates.map((t) => (
                <button
                  key={t.tipo}
                  onClick={() => { setActiveTab(t.tipo); setShowPreview(false); setShowTestInput(false) }}
                  className={`shrink-0 md:shrink md:w-full text-left px-4 py-3 text-sm border-b md:border-b md:border-r-0 border-r border-gray-100 last:border-0 flex items-center justify-between gap-2 transition-colors ${
                    activeTab === t.tipo
                      ? 'bg-[#e8f8f7] text-[#1a4f4a] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Mail size={14} className={activeTab === t.tipo ? 'text-[#3cbfb3]' : 'text-gray-400'} />
                    <span className="truncate">{t.label}</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${t.ativo ? 'bg-green-400' : 'bg-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Header do editor */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-[#0a0a0a]">{current.label}</h2>
                {!current.existeNoBanco && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Não salvo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle ativo */}
                <button
                  onClick={() => updateCurrent({ ativo: !current.ativo })}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    current.ativo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {current.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {current.ativo ? 'Ativo' : 'Inativo'}
                </button>

                {/* Preview inline */}
                <button
                  onClick={() => setShowPreview((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPreview ? 'Fechar' : 'Preview'}
                </button>

                {/* Preview premium em nova aba */}
                <button
                  onClick={() => {
                    window.open(`/api/admin/email-templates/preview?tipo=${current?.tipo}`, '_blank')
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#e8f8f7] text-[#1a4f4a] hover:bg-[#3cbfb3] hover:text-white transition"
                  title="Abrir template premium renderizado em nova aba"
                >
                  <Eye size={16} />
                  Preview Premium
                </button>

                {/* Enviar teste */}
                <button
                  onClick={() => setShowTestInput((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  <Send size={15} />
                  Testar
                  {showTestInput ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Salvar */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white transition disabled:opacity-60"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Salvar
                </button>
              </div>
            </div>

            {/* Input de teste */}
            {showTestInput && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                <input
                  type="email"
                  placeholder="Email de destino para o teste..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
                />
                <button
                  onClick={handleSendTest}
                  disabled={sendingTest}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
                >
                  {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Enviar
                </button>
              </div>
            )}

            {/* Campos do template */}
            {!showPreview && (
              <div className="p-6 space-y-5">
                {/* Assunto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Assunto do Email
                  </label>
                  <input
                    type="text"
                    value={current.assunto}
                    onChange={(e) => updateCurrent({ assunto: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                    placeholder="Assunto do email..."
                  />
                </div>

                {/* Prazo */}
                {current.prazo !== undefined && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Prazo de Envio
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={current.prazo}
                        onChange={(e) => updateCurrent({ prazo: Number(e.target.value) })}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                      />
                      <select
                        value={current.unidadePrazo}
                        onChange={(e) => updateCurrent({ unidadePrazo: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                      >
                        <option value="minutos">Minutos</option>
                        <option value="horas">Horas</option>
                        <option value="dias">Dias</option>
                      </select>
                      {current.prazo === 0 && (
                        <span className="text-xs text-[#3cbfb3] font-medium self-center">
                          Imediato
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Variáveis disponíveis */}
                {current.variaveis.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Variáveis disponíveis:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {current.variaveis.map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            // Copia a variável pro clipboard
                            navigator.clipboard.writeText(v).catch(() => {})
                          }}
                          title="Clique para copiar"
                          className="font-mono text-xs bg-[#e8f8f7] text-[#1a4f4a] px-2 py-1 rounded-md hover:bg-[#3cbfb3] hover:text-white transition cursor-pointer border border-[#c0ebe7]"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Clique para copiar a variável</p>
                  </div>
                )}

                {/* Corpo HTML */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Corpo do Email (HTML)
                  </label>
                  <textarea
                    value={current.corpo}
                    onChange={(e) => updateCurrent({ corpo: e.target.value })}
                    rows={20}
                    spellCheck={false}
                    style={{ maxWidth: '100%' }}
                    className="w-full max-w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] resize-y leading-relaxed"
                    placeholder="HTML do email..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {current.corpo.length} caracteres
                  </p>
                </div>
              </div>
            )}

            {/* Preview */}
            {showPreview && (
              <div className="p-6">
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">
                    Assunto: <span className="text-gray-700">{current.assunto}</span>
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <iframe
                    srcDoc={current.corpo}
                    className="w-full h-[600px]"
                    title="Preview do email"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
