'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, Upload, X, Eye, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

type Frequencia = 'sessao' | 'dia' | 'semana'

interface PopupConfig {
  ativado:        boolean
  bannerDesktop:  string | null
  bannerTablet:   string | null
  bannerMobile:   string | null
  altText:        string | null
  linkDestino:    string | null
  abrirNovaAba:   boolean
  titulo:         string | null
  texto:          string | null
  corBotao:       string | null
  textoBotao:     string | null
  delaySegundos:  number
  frequencia:     Frequencia
  paginas:        string[]
}

const VAZIO: PopupConfig = {
  ativado:        false,
  bannerDesktop:  null,
  bannerTablet:   null,
  bannerMobile:   null,
  altText:        '',
  linkDestino:    '',
  abrirNovaAba:   false,
  titulo:         '',
  texto:          '',
  corBotao:       '#3cbfb3',
  textoBotao:     '',
  delaySegundos:  3,
  frequencia:     'sessao',
  paginas:        ['home'],
}

export default function PopupAdminPage() {
  const [config, setConfig] = useState<PopupConfig>(VAZIO)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [erro, setErro] = useState('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | null>(null)

  useEffect(() => {
    fetch('/api/admin/popup-inicial', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          const c = d.config
          setConfig({
            ativado:        Boolean(c.ativado),
            bannerDesktop:  c.bannerDesktop,
            bannerTablet:   c.bannerTablet ?? null,
            bannerMobile:   c.bannerMobile,
            altText:        c.altText ?? '',
            linkDestino:    c.linkDestino ?? '',
            abrirNovaAba:   Boolean(c.abrirNovaAba),
            titulo:         c.titulo ?? '',
            texto:          c.texto ?? '',
            corBotao:       c.corBotao ?? '#3cbfb3',
            textoBotao:     c.textoBotao ?? '',
            delaySegundos:  c.delaySegundos ?? 3,
            frequencia:     (c.frequencia as Frequencia) ?? 'sessao',
            paginas:        Array.isArray(c.paginas) ? c.paginas : ['home'],
          })
        }
      })
      .catch(() => setErro('Não foi possível carregar a configuração.'))
      .finally(() => setLoading(false))
  }, [])

  async function salvar() {
    setSalvando(true)
    setErro('')
    setSavedOk(false)
    try {
      const r = await fetch('/api/admin/popup-inicial', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao salvar')
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function uploadBanner(file: File, variant: 'desktop' | 'tablet' | 'mobile') {
    setErro('')
    if (file.size > 2 * 1024 * 1024) {
      setErro('Imagem maior que 2MB.')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('variant', variant)
    try {
      const r = await fetch('/api/admin/upload-banner', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha no upload')
      setConfig((c) => ({
        ...c,
        ...(variant === 'desktop'
          ? { bannerDesktop: d.url }
          : variant === 'tablet'
            ? { bannerTablet: d.url }
            : { bannerMobile: d.url }),
      }))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro no upload')
    }
  }

  function togglePagina(p: string) {
    setConfig((c) => {
      const tem = c.paginas.includes(p)
      return { ...c, paginas: tem ? c.paginas.filter((x) => x !== p) : [...c.paginas, p] }
    })
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse mb-6" />
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Bell size={22} className="text-[#3cbfb3]" /> Pop-up Inicial
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Banner promocional que aparece quando o cliente entra na loja.
        </p>
      </div>

      {erro && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {erro}
        </div>
      )}
      {savedOk && (
        <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-sm text-emerald-700">
          <CheckCircle size={16} className="shrink-0 mt-0.5" /> Configuração salva. As mudanças são aplicadas imediatamente.
        </div>
      )}

      <div className="space-y-5">

        {/* Toggle ativo */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Pop-up ativado</p>
              <p className="text-xs text-gray-500">Quando desligado, o pop-up não aparece pra ninguém.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig((c) => ({ ...c, ativado: !c.ativado }))}
              className={`relative w-12 h-7 rounded-full transition-colors ${config.ativado ? 'bg-[#3cbfb3]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${config.ativado ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </Card>

        {/* Upload Desktop */}
        <Card titulo="Banner desktop" sub="1200x600px recomendado · máx 2MB">
          <BannerUpload
            url={config.bannerDesktop}
            onUpload={(f) => uploadBanner(f, 'desktop')}
            onRemove={() => setConfig((c) => ({ ...c, bannerDesktop: null }))}
          />
        </Card>

        {/* Upload Tablet/iPad */}
        <Card titulo="Banner tablet/iPad" sub="1024x768px ou 1024x600px · máx 2MB · opcional">
          <BannerUpload
            url={config.bannerTablet}
            onUpload={(f) => uploadBanner(f, 'tablet')}
            onRemove={() => setConfig((c) => ({ ...c, bannerTablet: null }))}
          />
        </Card>

        {/* Upload Mobile */}
        <Card titulo="Banner mobile" sub="800x1000px vertical · máx 2MB · opcional">
          <BannerUpload
            url={config.bannerMobile}
            onUpload={(f) => uploadBanner(f, 'mobile')}
            onRemove={() => setConfig((c) => ({ ...c, bannerMobile: null }))}
          />
        </Card>

        {/* Alt + Link */}
        <Card titulo="Acessibilidade & link">
          <Field label="Texto alternativo (descreve a imagem para leitores de tela)">
            <input
              type="text"
              value={config.altText ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, altText: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3cbfb3]"
              placeholder="Promoção de aniversário Sixxis"
            />
          </Field>
          <Field label="Link ao clicar (opcional)">
            <input
              type="url"
              value={config.linkDestino ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, linkDestino: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3cbfb3]"
              placeholder="/ofertas"
            />
          </Field>
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={config.abrirNovaAba}
              onChange={(e) => setConfig((c) => ({ ...c, abrirNovaAba: e.target.checked }))}
            />
            Abrir em nova aba
          </label>
        </Card>

        {/* Conteúdo extra */}
        <Card titulo="Conteúdo extra (opcional)" sub="Aparece abaixo do banner ou em vez dele se não houver imagem.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Título">
              <input
                type="text"
                value={config.titulo ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, titulo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3cbfb3]"
              />
            </Field>
            <Field label="Texto do botão">
              <input
                type="text"
                value={config.textoBotao ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, textoBotao: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3cbfb3]"
                placeholder="Aproveitar oferta"
              />
            </Field>
          </div>
          <Field label="Texto (HTML simples permitido)">
            <textarea
              value={config.texto ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, texto: e.target.value }))}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3cbfb3]"
            />
          </Field>
          <Field label="Cor do botão">
            <input
              type="color"
              value={config.corBotao ?? '#3cbfb3'}
              onChange={(e) => setConfig((c) => ({ ...c, corBotao: e.target.value }))}
              className="h-10 w-20 border border-gray-200 rounded-xl"
            />
          </Field>
        </Card>

        {/* Comportamento */}
        <Card titulo="Comportamento">
          <Field label={`Aparecer após ${config.delaySegundos}s`}>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={config.delaySegundos}
              onChange={(e) => setConfig((c) => ({ ...c, delaySegundos: Number(e.target.value) }))}
              className="w-full"
            />
          </Field>
          <Field label="Frequência">
            <div className="flex gap-2 flex-wrap">
              {([
                { v: 'sessao' as const, l: 'A cada nova sessão (recomendado)' },
                { v: 'dia'    as const, l: '1× por dia' },
                { v: 'semana' as const, l: '1× por semana' },
              ]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, frequencia: opt.v }))}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    config.frequencia === opt.v
                      ? 'bg-[#3cbfb3] text-white border-[#3cbfb3]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#3cbfb3]/40'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Mostrar em">
            <div className="flex gap-2 flex-wrap">
              {[
                { v: 'home',     l: 'Home' },
                { v: 'produtos', l: 'Páginas de produto' },
                { v: '*',        l: 'Todas as páginas' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => togglePagina(opt.v)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    config.paginas.includes(opt.v)
                      ? 'bg-[#3cbfb3] text-white border-[#3cbfb3]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#3cbfb3]/40'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </Field>
        </Card>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 sticky bottom-4 bg-white/90 backdrop-blur p-3 rounded-2xl border border-gray-100 shadow-md">
          <button
            type="button"
            onClick={() => setPreviewMode('desktop')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Eye size={14} /> Pré-visualizar desktop
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('mobile')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Eye size={14} /> Pré-visualizar mobile
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-60 transition"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {salvando ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {previewMode && (
        <PreviewModal
          mode={previewMode}
          config={config}
          onClose={() => setPreviewMode(null)}
        />
      )}
    </div>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────────

function Card({ titulo, sub, children }: { titulo?: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {titulo && (
        <div className="mb-3">
          <p className="text-sm font-bold text-gray-900">{titulo}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function BannerUpload({ url, onUpload, onRemove }: {
  url: string | null
  onUpload: (f: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-3">
      {url ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="banner" className="w-full h-auto max-h-72 object-contain" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs font-semibold text-gray-700 shadow flex items-center gap-1"
          >
            <X size={12} /> Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 hover:border-[#3cbfb3]/50 hover:bg-[#3cbfb3]/5 rounded-xl py-10 flex flex-col items-center justify-center gap-2 text-gray-500 transition"
        >
          <Upload size={20} />
          <span className="text-sm font-medium">Clique pra fazer upload</span>
          <span className="text-xs">PNG, JPG ou WEBP · até 2MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onUpload(f)
          if (inputRef.current) inputRef.current.value = ''
        }}
      />
      {url && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-[#3cbfb3] hover:underline"
        >
          Trocar imagem
        </button>
      )}
    </div>
  )
}

function PreviewModal({ mode, config, onClose }: {
  mode: 'desktop' | 'mobile'
  config: PopupConfig
  onClose: () => void
}) {
  const banner = mode === 'mobile' && config.bannerMobile
    ? config.bannerMobile
    : config.bannerDesktop || config.bannerMobile

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: mode === 'mobile' ? 360 : 720, maxWidth: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Preview · {mode}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt={config.altText || ''} className="w-full h-auto" />
        )}
        {(config.titulo || config.texto || config.textoBotao) && (
          <div className="p-6 text-center">
            {config.titulo && <h2 className="text-xl font-black text-gray-900 mb-2">{config.titulo}</h2>}
            {config.texto && (
              <div
                className="text-sm text-gray-700 mb-4 prose prose-sm max-w-none mx-auto"
                dangerouslySetInnerHTML={{ __html: config.texto }}
              />
            )}
            {config.textoBotao && (
              <span
                className="inline-block px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ backgroundColor: config.corBotao || '#3cbfb3' }}
              >
                {config.textoBotao}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
