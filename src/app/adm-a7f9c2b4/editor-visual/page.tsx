'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RotateCcw, Save, Sparkles } from 'lucide-react'
import { Toast } from '@/components/admin/Toast'
import { DeviceTabs } from '@/components/admin/editor/DeviceTabs'
import { LivePreview } from '@/components/admin/editor/LivePreview'
import { SecaoGlobal } from '@/components/admin/editor/sections/SecaoGlobal'
import { SecaoAnuncio } from '@/components/admin/editor/sections/SecaoAnuncio'
import { SecaoHero } from '@/components/admin/editor/sections/SecaoHero'
import { SecaoStats } from '@/components/admin/editor/sections/SecaoStats'
import { SecaoMaisVendidos } from '@/components/admin/editor/sections/SecaoMaisVendidos'
import { SecaoPorQueSixxis } from '@/components/admin/editor/sections/SecaoPorQueSixxis'
import { SecaoBannersDuplos } from '@/components/admin/editor/sections/SecaoBannersDuplos'
import { SecaoNewsletter } from '@/components/admin/editor/sections/SecaoNewsletter'
import { SecaoBannerWhatsapp } from '@/components/admin/editor/sections/SecaoBannerWhatsapp'
import { SecaoTrustBar } from '@/components/admin/editor/sections/SecaoTrustBar'
import { SecaoOfertasRelampago } from '@/components/admin/editor/sections/SecaoOfertasRelampago'
import { SecaoFooter } from '@/components/admin/editor/sections/SecaoFooter'
import type { Configs, Device } from '@/components/admin/editor/types'

export default function EditorVisualPage() {
  const [device, setDevice] = useState<Device>('desktop')
  const [config, setConfigState] = useState<Configs>({})
  const [pristine, setPristine] = useState<Configs>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const setConfig: React.Dispatch<React.SetStateAction<Configs>> = useCallback((updater) => {
    setConfigState((prev) =>
      typeof updater === 'function' ? (updater as (p: Configs) => Configs)(prev) : updater,
    )
  }, [])

  const sectionProps = useMemo(
    () => ({ config, setConfig: setConfig as (u: (p: Configs) => Configs) => void, device }),
    [config, setConfig, device],
  )

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/configuracoes', { credentials: 'include' })
      .then((r) => r.json())
      .then((c: Configs) => {
        if (cancelled) return
        const safe = c && typeof c === 'object' ? c : {}
        setConfigState(safe)
        setPristine(safe)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
        setToast({ message: 'Erro ao carregar configurações', type: 'error' })
      })
    return () => { cancelled = true }
  }, [])

  const dirty = useMemo(() => {
    const keys = new Set([...Object.keys(config), ...Object.keys(pristine)])
    for (const k of keys) {
      if ((config[k] ?? '') !== (pristine[k] ?? '')) return true
    }
    return false
  }, [config, pristine])

  async function handleSave() {
    if (!dirty || saving) return
    setSaving(true)
    const changed: Configs = {}
    const keys = new Set([...Object.keys(config), ...Object.keys(pristine)])
    for (const k of keys) {
      if ((config[k] ?? '') !== (pristine[k] ?? '')) changed[k] = config[k] ?? ''
    }
    try {
      const r = await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ configs: changed }),
      })
      if (!r.ok) throw new Error('save_failed')
      setPristine({ ...config })
      setPreviewKey((k) => k + 1)
      setToast({ message: `${Object.keys(changed).length} configuração(ões) salvas`, type: 'success' })
    } catch {
      setToast({ message: 'Erro ao salvar', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    if (!dirty) return
    setConfigState({ ...pristine })
    setToast({ message: 'Alterações descartadas', type: 'success' })
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] -m-6">
        {/* Painel de controles (esquerda) */}
        <div className="w-full lg:w-[480px] xl:w-[560px] shrink-0 flex flex-col bg-gray-50 border-r border-gray-200">
          {/* Header sticky */}
          <header className="bg-white border-b border-gray-200 p-4 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3cbfb3] to-[#0f2e2b] flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-gray-900 leading-tight">Editor Visual</h1>
                  <p className="text-[11px] text-gray-500">Personalize o site por device com preview ao vivo</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={!dirty || saving}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <RotateCcw size={13} /> Descartar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#3cbfb3] hover:bg-[#2a9d8f] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Salvando...' : dirty ? 'Salvar alterações' : 'Tudo salvo'}
              </button>
            </div>
          </header>

          {/* Device tabs */}
          <div className="p-4 pb-0">
            <DeviceTabs active={device} onChange={setDevice} />
          </div>

          {/* Seções (scrollável) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <>
                <SecaoGlobal {...sectionProps} />
                <SecaoAnuncio {...sectionProps} />
                <SecaoHero {...sectionProps} />
                <SecaoTrustBar {...sectionProps} />
                <SecaoOfertasRelampago {...sectionProps} />
                <SecaoStats {...sectionProps} />
                <SecaoMaisVendidos {...sectionProps} />
                <SecaoPorQueSixxis {...sectionProps} />
                <SecaoBannersDuplos {...sectionProps} />
                <SecaoNewsletter {...sectionProps} />
                <SecaoBannerWhatsapp {...sectionProps} />
                <SecaoFooter {...sectionProps} />
                <p className="text-center text-[11px] text-gray-400 pt-4 pb-2">
                  12 seções · ordem segue o fluxo da home
                </p>
              </>
            )}
          </div>
        </div>

        {/* Preview (direita) */}
        <div className="flex-1 min-h-[600px] lg:min-h-0">
          <LivePreview device={device} refreshKey={previewKey} />
        </div>
      </div>
    </>
  )
}
