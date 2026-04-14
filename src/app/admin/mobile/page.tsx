'use client'
import { useState } from 'react'
import { Save, Smartphone, Monitor } from 'lucide-react'

interface MobileConfig {
  bannerMobileUrl:    string
  bannerMobileHeight: string
  announcementTexto:  string
  trustBarItems:      string[]
}

export default function AdminMobilePage() {
  const [config, setConfig] = useState<MobileConfig>({
    bannerMobileUrl:    '',
    bannerMobileHeight: '200',
    announcementTexto:  'CUPOM: SIXXIS10 — 10% OFF na 1ª compra',
    trustBarItems:      [
      'Frete grátis acima de R$ 500',
      'Compra 100% segura',
      'Parcele em 6x sem juros',
    ],
  })
  const [salvo, setSalvo]   = useState(false)
  const [preview, setPreview] = useState<'mobile' | 'desktop'>('mobile')

  const salvar = async () => {
    try {
      await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_banner_url:    config.bannerMobileUrl,
          mobile_banner_height: config.bannerMobileHeight,
          announcement_texto:   config.announcementTexto,
        }),
      })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch {}
  }

  const f = <K extends keyof MobileConfig>(k: K, v: MobileConfig[K]) =>
    setConfig((p) => ({ ...p, [k]: v }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Smartphone size={22} className="text-[#3cbfb3]" />
            Editor Mobile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure a versão mobile do site com preview em tempo real
          </p>
        </div>
        <button
          onClick={salvar}
          className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-md"
        >
          <Save size={15} />
          {salvo ? 'Salvo!' : 'Salvar alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* Painel de edição */}
        <div className="space-y-4">

          {/* Announcement bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Barra de Anúncio</h3>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Texto</label>
              <input
                value={config.announcementTexto}
                onChange={(e) => f('announcementTexto', e.target.value)}
                className="w-full border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {/* Banner mobile */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Banner Mobile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">URL da imagem</label>
                <input
                  value={config.bannerMobileUrl}
                  onChange={(e) => f('bannerMobileUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Recomendado: 390×200px para mobile</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Altura (px)</label>
                <input
                  type="number"
                  value={config.bannerMobileHeight}
                  onChange={(e) => f('bannerMobileHeight', e.target.value)}
                  className="w-32 border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Trust Bar (Selos)</h3>
            <div className="space-y-2">
              {config.trustBarItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => {
                      const novo = [...config.trustBarItems]
                      novo[i] = e.target.value
                      f('trustBarItems', novo)
                    }}
                    className="flex-1 border border-gray-200 focus:border-[#3cbfb3] rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-20">
          <div className="flex gap-2 mb-3">
            {(['mobile', 'desktop'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPreview(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  preview === m ? 'bg-[#0f2e2b] text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {m === 'mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
                {m === 'mobile' ? 'Mobile' : 'Desktop'}
              </button>
            ))}
          </div>

          {/* Frame */}
          <div
            className="bg-gray-900 rounded-3xl p-3 shadow-2xl"
            style={{ width: preview === 'mobile' ? '320px' : '100%', margin: '0 auto' }}
          >
            <div
              className="bg-gray-800 rounded-xl overflow-hidden"
              style={{ height: preview === 'mobile' ? '560px' : '400px' }}
            >
              <div className="h-full overflow-y-auto bg-white">

                {/* Announcement */}
                <div
                  className="px-2 py-1 text-center font-bold"
                  style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b', fontSize: '9px' }}
                >
                  {config.announcementTexto}
                </div>

                {/* Header simulado */}
                <div
                  className="flex items-center justify-between px-2 py-1.5"
                  style={{ backgroundColor: '#0f2e2b' }}
                >
                  <div className="w-12 h-3 bg-[#3cbfb3] rounded opacity-80" />
                  <div className="flex gap-1">
                    <div className="w-4 h-3 bg-white/20 rounded" />
                    <div className="w-4 h-3 bg-white/20 rounded" />
                  </div>
                </div>

                {/* Banner preview */}
                {config.bannerMobileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.bannerMobileUrl}
                    alt="preview"
                    className="w-full object-cover"
                    style={{ height: `${Math.min(parseInt(config.bannerMobileHeight) || 80, 120)}px` }}
                  />
                ) : (
                  <div className="w-full bg-gray-100 flex items-center justify-center" style={{ height: '80px' }}>
                    <p style={{ fontSize: '8px', color: '#9ca3af' }}>Banner mobile aqui</p>
                  </div>
                )}

                {/* Trust bar */}
                <div className="flex gap-2 px-2 py-1.5 overflow-x-auto bg-white border-b border-gray-100">
                  {config.trustBarItems.map((item, i) => (
                    <span key={i} style={{ fontSize: '7px', color: '#4b5563', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 500 }}>
                      ✓ {item}
                    </span>
                  ))}
                </div>

                {/* Produtos grid 2col simulado */}
                <div className="grid grid-cols-2 gap-1.5 p-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-lg p-1.5 shadow-sm">
                      <div className="w-full bg-gray-100 rounded aspect-square mb-1" />
                      <div className="h-1.5 bg-gray-200 rounded mb-1" />
                      <div className="h-1.5 bg-[#3cbfb3] rounded w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Preview simulado · Acesse o site no celular para ver o resultado real
          </p>
        </div>
      </div>
    </div>
  )
}
