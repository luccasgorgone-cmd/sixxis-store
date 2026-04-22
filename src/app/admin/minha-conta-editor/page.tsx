'use client'

import { useEffect, useState } from 'react'
import { ImageIcon, Gem, Type, Save, Upload, RotateCcw, Check, Diamond, Award, Crown, Sparkles, LucideIcon } from 'lucide-react'

interface NivelFidelidade {
  id: string
  slug: string
  nome: string
  iconeUrl: string | null
  iconeLucide: string | null
  cor: string
  gastoMin: number
  gastoMax: number | null
  cashbackPc: number
  ordem: number
}

const ABAS = [
  { id: 'banners', label: 'Banners',        icon: ImageIcon },
  { id: 'niveis',  label: 'Ícones Club',    icon: Gem },
  { id: 'conteudo', label: 'Conteúdo',      icon: Type },
] as const

const BANNERS_PRONTOS = {
  desktop: [
    { key: 'climatizador', url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/desktop-climatizador.jpg', label: 'Climatizador' },
    { key: 'spinning',     url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/desktop-spinning.jpg',    label: 'Spinning' },
    { key: 'fitness',      url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/desktop-fitness.jpg',     label: 'Fitness' },
    { key: 'oferta',       url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/desktop-oferta.jpg',      label: 'Oferta geral' },
    { key: 'boasvindas',   url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/desktop-boasvindas.jpg',  label: 'Boas-vindas' },
  ],
  mobile: [
    { key: 'climatizador', url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/mobile-climatizador.jpg' },
    { key: 'spinning',     url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/mobile-spinning.jpg' },
    { key: 'fitness',      url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/mobile-fitness.jpg' },
    { key: 'oferta',       url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/mobile-oferta.jpg' },
    { key: 'boasvindas',   url: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/banners/mobile-boasvindas.jpg' },
  ],
}

const ICONES_LUCIDE: { key: string; icone: LucideIcon; label: string }[] = [
  { key: 'Sparkles', icone: Sparkles, label: 'Sparkles' },
  { key: 'Award',    icone: Award,    label: 'Award' },
  { key: 'Gem',      icone: Gem,      label: 'Gem' },
  { key: 'Diamond',  icone: Diamond,  label: 'Diamond' },
  { key: 'Crown',    icone: Crown,    label: 'Crown' },
]

const NIVEIS_DEFAULT: Record<string, Partial<NivelFidelidade>> = {
  cristal:   { cor: '#9ca3af', gastoMin: 0,     gastoMax: 499,    cashbackPc: 2, iconeLucide: 'Sparkles' },
  topazio:   { cor: '#f59e0b', gastoMin: 500,   gastoMax: 1999,   cashbackPc: 3, iconeLucide: 'Award' },
  safira:    { cor: '#2563eb', gastoMin: 2000,  gastoMax: 4999,   cashbackPc: 4, iconeLucide: 'Gem' },
  diamante:  { cor: '#06b6d4', gastoMin: 5000,  gastoMax: 9999,   cashbackPc: 5, iconeLucide: 'Diamond' },
  esmeralda: { cor: '#10b981', gastoMin: 10000, gastoMax: null,   cashbackPc: 6, iconeLucide: 'Crown' },
}

type Config = Record<string, string>

export default function MinhaContaEditorPage() {
  const [aba, setAba] = useState<typeof ABAS[number]['id']>('banners')
  const [niveis, setNiveis] = useState<NivelFidelidade[]>([])
  const [config, setConfig] = useState<Config>({})
  const [salvando, setSalvando] = useState(false)
  const [salvoOk, setSalvoOk] = useState(false)

  async function carregar() {
    const [rN, rC] = await Promise.all([
      fetch('/api/admin/niveis-fidelidade'),
      fetch('/api/admin/minha-conta-editor'),
    ])
    const dN = await rN.json().catch(() => ({ niveis: [] }))
    const dC = await rC.json().catch(() => ({ config: {} }))
    setNiveis(dN.niveis ?? [])
    setConfig(dC.config ?? {})
  }
  useEffect(() => { carregar() }, [])

  function editarConfig(k: string, v: string) {
    setConfig(prev => ({ ...prev, [k]: v }))
    setSalvoOk(false)
  }

  async function salvarConfig() {
    setSalvando(true)
    await fetch('/api/admin/minha-conta-editor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSalvando(false)
    setSalvoOk(true)
    setTimeout(() => setSalvoOk(false), 2000)
  }

  async function salvarNivel(nivel: NivelFidelidade) {
    await fetch('/api/admin/niveis-fidelidade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nivel),
    })
    carregar()
  }

  async function upload(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!r.ok) return null
      const d = await r.json()
      return d.url ?? null
    } catch { return null }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f2e2b' }}>Minha Conta Editor</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure banners, ícones de níveis e o conteúdo da página Minha Conta
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto">
        {ABAS.map(t => {
          const ativo = aba === t.id
          const Icone = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className="px-4 py-2.5 text-sm font-bold transition flex items-center gap-2 whitespace-nowrap"
              style={{
                color: ativo ? '#0f2e2b' : '#6b7280',
                borderBottom: ativo ? '2px solid #3cbfb3' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <Icone size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Aba 1 — Banners */}
      {aba === 'banners' && (
        <div className="space-y-5">
          {(['desktop', 'mobile'] as const).map(tipo => {
            const chave = tipo === 'desktop' ? 'minha_conta_banner_desktop' : 'minha_conta_banner_mobile'
            const url = config[chave] ?? ''
            const dimensoes = tipo === 'desktop' ? '1920 × 400' : '720 × 400'
            return (
              <div key={tipo} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-gray-900">Banner {tipo}</h3>
                    <p className="text-xs text-gray-500">Recomendado: {dimensoes}</p>
                  </div>
                  {url && (
                    <button
                      onClick={() => editarConfig(chave, '')}
                      className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline"
                    >
                      <RotateCcw size={11} /> Restaurar padrão
                    </button>
                  )}
                </div>

                {/* Preview */}
                <div
                  className="w-full rounded-xl border-2 border-dashed border-gray-200 mb-4 overflow-hidden bg-gray-50 flex items-center justify-center"
                  style={{ aspectRatio: tipo === 'desktop' ? '1920 / 400' : '720 / 400', maxHeight: 300 }}
                >
                  {url
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={url} alt="" className="w-full h-full object-cover" />
                    : <p className="text-sm text-gray-400">Sem banner — usando padrão</p>
                  }
                </div>

                {/* Upload */}
                <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-[#3cbfb3] bg-[#3cbfb3]/5 cursor-pointer hover:bg-[#3cbfb3]/10 transition mb-4">
                  <Upload size={14} style={{ color: '#3cbfb3' }} />
                  <span className="text-sm font-bold" style={{ color: '#0f2e2b' }}>Enviar arquivo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const u = await upload(f)
                      if (u) editarConfig(chave, u)
                    }}
                  />
                </label>

                {/* Galeria */}
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Banners prontos</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {BANNERS_PRONTOS[tipo].map(b => (
                    <button
                      key={b.key}
                      onClick={() => editarConfig(chave, b.url)}
                      className="relative aspect-video rounded-lg overflow-hidden border-2 transition"
                      style={{ borderColor: url === b.url ? '#3cbfb3' : '#e5e7eb' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.url} alt="" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />
                      {tipo === 'desktop' && 'label' in b && (
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 font-bold text-center">
                          {b.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          <button
            onClick={salvarConfig}
            disabled={salvando}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm shadow-md transition hover:shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
          >
            {salvando ? '...' : salvoOk ? <><Check size={15} /> Salvo!</> : <><Save size={15} /> Salvar banners</>}
          </button>
        </div>
      )}

      {/* Aba 2 — Níveis */}
      {aba === 'niveis' && (
        <div className="space-y-4">
          {niveis.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Carregando níveis...</p>
          ) : niveis.map(n => {
            const iconeEntry = ICONES_LUCIDE.find(i => i.key === n.iconeLucide) ?? ICONES_LUCIDE[0]
            const Icone = iconeEntry.icone
            return (
              <div key={n.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${n.cor}22` }}
                  >
                    {n.iconeUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={n.iconeUrl} alt="" className="w-14 h-14 object-contain" />
                    ) : (
                      <Icone size={44} color={n.cor} strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="flex-1 min-w-[240px] space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black" style={{ color: n.cor }}>{n.nome}</h3>
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{n.slug}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Gasto mín. (R$)</label>
                        <input
                          type="number"
                          value={n.gastoMin}
                          onChange={e => setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, gastoMin: parseFloat(e.target.value) || 0 } : x))}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Gasto máx. (R$)</label>
                        <input
                          type="number"
                          value={n.gastoMax ?? ''}
                          placeholder="sem limite"
                          onChange={e => setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, gastoMax: e.target.value === '' ? null : parseFloat(e.target.value) } : x))}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cashback (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={n.cashbackPc}
                          onChange={e => setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, cashbackPc: parseFloat(e.target.value) || 0 } : x))}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cor</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={n.cor}
                            onChange={e => setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, cor: e.target.value } : x))}
                            className="w-10 h-8 rounded-lg border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={n.cor}
                            onChange={e => setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, cor: e.target.value } : x))}
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Ícone Lucide</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {ICONES_LUCIDE.map(i => {
                            const I = i.icone
                            const sel = n.iconeLucide === i.key && !n.iconeUrl
                            return (
                              <button
                                key={i.key}
                                onClick={() => setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, iconeLucide: i.key, iconeUrl: null } : x))}
                                className="w-9 h-9 rounded-lg border-2 flex items-center justify-center transition"
                                style={{ borderColor: sel ? '#3cbfb3' : '#e5e7eb' }}
                                title={i.label}
                              >
                                <I size={18} color={sel ? n.cor : '#6b7280'} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition">
                        <Upload size={12} /> Upload custom
                        <input
                          type="file"
                          accept="image/png,image/svg+xml"
                          className="hidden"
                          onChange={async e => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            if (f.size > 200 * 1024) { alert('Máximo 200KB'); return }
                            const u = await upload(f)
                            if (u) setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, iconeUrl: u } : x))
                          }}
                        />
                      </label>
                      <button
                        onClick={() => {
                          const def = NIVEIS_DEFAULT[n.slug]
                          if (!def) return
                          setNiveis(prev => prev.map(x => x.slug === n.slug ? { ...x, ...def, iconeUrl: null } : x))
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                      >
                        <RotateCcw size={11} /> Default
                      </button>
                      <button
                        onClick={() => salvarNivel(n)}
                        className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition hover:shadow-md"
                        style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
                      >
                        <Save size={11} /> Salvar nível
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Aba 3 — Conteúdo */}
      {aba === 'conteudo' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">
                Título do hero
              </label>
              <input
                type="text"
                value={config.minha_conta_hero_titulo ?? ''}
                onChange={e => editarConfig('minha_conta_hero_titulo', e.target.value)}
                placeholder="Olá, bem-vindo de volta"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">
                Subtítulo do hero
              </label>
              <input
                type="text"
                value={config.minha_conta_hero_subtitulo ?? ''}
                onChange={e => editarConfig('minha_conta_hero_subtitulo', e.target.value)}
                placeholder="Gerencie pedidos, cashback e endereços"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">
                Mensagem de boas-vindas
              </label>
              <textarea
                rows={3}
                value={config.minha_conta_mensagem_boasvindas ?? ''}
                onChange={e => editarConfig('minha_conta_mensagem_boasvindas', e.target.value)}
                placeholder="Obrigado por escolher a Sixxis..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">
                Cor de destaque
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.minha_conta_cor_destaque ?? '#3cbfb3'}
                  onChange={e => editarConfig('minha_conta_cor_destaque', e.target.value)}
                  className="w-14 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.minha_conta_cor_destaque ?? '#3cbfb3'}
                  onChange={e => editarConfig('minha_conta_cor_destaque', e.target.value)}
                  className="w-40 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wide mb-3">Seções exibidas</p>
            <div className="space-y-2">
              {([
                ['minha_conta_mostra_pedidos',               'Pedidos'],
                ['minha_conta_mostra_cashback',              'Cashback'],
                ['minha_conta_mostra_enderecos',             'Endereços'],
                ['minha_conta_mostra_avaliacoes_pendentes',  'Avaliações pendentes'],
                ['minha_conta_mostra_cupons',                'Cupons'],
              ] as const).map(([chave, label]) => {
                const ativo = (config[chave] ?? 'true') === 'true'
                return (
                  <label key={chave} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition cursor-pointer">
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={e => editarConfig(chave, e.target.checked ? 'true' : 'false')}
                      className="w-4 h-4 accent-[#3cbfb3]"
                    />
                  </label>
                )
              })}
            </div>
          </div>

          <button
            onClick={salvarConfig}
            disabled={salvando}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm shadow-md transition hover:shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
          >
            {salvando ? '...' : salvoOk ? <><Check size={15} /> Salvo!</> : <><Save size={15} /> Salvar conteúdo</>}
          </button>
        </div>
      )}
    </div>
  )
}
