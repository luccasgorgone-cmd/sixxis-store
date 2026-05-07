'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Loader2, Upload, Save, X } from 'lucide-react'

export interface Banner {
  id:                string
  imagem:            string
  imagemTablet:      string | null
  imagemMobile:      string | null
  titulo:            string | null
  subtitulo:         string | null
  link:              string | null
  ordem:             number
  ativo:             boolean
  tempoCads:         number
  aspectMobile?:     string | null
  aspectTablet?:     string | null
  aspectDesktop?:    string | null
  maxHeightDesktop?: string | null
}

type FormState = {
  imagem:           string
  imagemTablet:     string
  imagemMobile:     string
  titulo:           string
  subtitulo:        string
  link:             string
  ativo:            boolean
  tempoCads:        number
  aspectMobile:     string
  aspectTablet:     string
  aspectDesktop:    string
  maxHeightDesktop: string
}

const DEFAULT_ASPECT_MOBILE  = '1/1'
const DEFAULT_ASPECT_TABLET  = '4/3'
const DEFAULT_ASPECT_DESKTOP = '1920/560'
const DEFAULT_MAX_H_DESKTOP  = '560px'

const EMPTY: FormState = {
  imagem: '', imagemTablet: '', imagemMobile: '', titulo: '', subtitulo: '', link: '',
  ativo: true, tempoCads: 5,
  aspectMobile:     DEFAULT_ASPECT_MOBILE,
  aspectTablet:     DEFAULT_ASPECT_TABLET,
  aspectDesktop:    DEFAULT_ASPECT_DESKTOP,
  maxHeightDesktop: DEFAULT_MAX_H_DESKTOP,
}

function bannerToForm(b: Banner): FormState {
  return {
    imagem:           b.imagem,
    imagemTablet:     b.imagemTablet ?? '',
    imagemMobile:     b.imagemMobile ?? '',
    titulo:           b.titulo       ?? '',
    subtitulo:        b.subtitulo    ?? '',
    link:             b.link         ?? '',
    ativo:            b.ativo,
    tempoCads:        b.tempoCads,
    aspectMobile:     b.aspectMobile     ?? DEFAULT_ASPECT_MOBILE,
    aspectTablet:     b.aspectTablet     ?? DEFAULT_ASPECT_TABLET,
    aspectDesktop:    b.aspectDesktop    ?? DEFAULT_ASPECT_DESKTOP,
    maxHeightDesktop: b.maxHeightDesktop ?? DEFAULT_MAX_H_DESKTOP,
  }
}

const PRESETS_MOBILE  = ['1/1', '4/5', '16/9', '4/3'] as const
const PRESETS_TABLET  = ['4/3', '16/10', '21/9'] as const
const PRESETS_DESKTOP = ['1920/560', '21/9', '16/9', '16/10'] as const

function aspectToCss(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '1 / 1'
  if (trimmed.includes('/')) return trimmed.replace(/\//g, ' / ')
  if (trimmed.includes(':')) return trimmed.replace(/:/g, ' / ')
  return trimmed
}

function isValidAspect(value: string): boolean {
  return /^\d+(\.\d+)?\s*[/:]\s*\d+(\.\d+)?$/.test(value.trim())
}

interface Props {
  banner?: Banner
  ordem?: number
  onSaved: () => void
  onCancel: () => void
  onError: (msg: string) => void
  onSuccess: (msg: string) => void
}

export function BannerForm({ banner, ordem, onSaved, onCancel, onError, onSuccess }: Props) {
  const isEditing = !!banner
  const [form, setForm] = useState<FormState>(banner ? bannerToForm(banner) : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingTablet, setUploadingTablet] = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileRefTablet = useRef<HTMLInputElement>(null)
  const fileRefMobile = useRef<HTMLInputElement>(null)

  const busy = saving || uploading || uploadingTablet || uploadingMobile

  async function uploadImagem(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (!r.ok) return null
    const { url } = await r.json()
    return url
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imagem' | 'imagemTablet' | 'imagemMobile',
    setBusy: (v: boolean) => void,
    errorLabel: string,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    const url = await uploadImagem(file)
    setBusy(false)
    if (url) setForm((f) => ({ ...f, [field]: url }))
    else onError(`Erro no upload ${errorLabel}`)
    e.target.value = ''
  }

  async function handleSalvar() {
    if (!form.imagem) { onError('Adicione uma imagem desktop'); return }
    if (!form.titulo.trim()) { onError('Adicione um título descritivo'); return }
    if (!isValidAspect(form.aspectMobile))  { onError('Proporção mobile inválida (use formato W/H)');  return }
    if (!isValidAspect(form.aspectTablet))  { onError('Proporção tablet inválida (use formato W/H)');  return }
    if (!isValidAspect(form.aspectDesktop)) { onError('Proporção desktop inválida (use formato W/H)'); return }
    setSaving(true)
    const url = isEditing
      ? `/api/admin/banners/${banner!.id}`
      : '/api/admin/banners'
    const method = isEditing ? 'PUT' : 'POST'
    const body = isEditing
      ? { ...form, ordem: banner!.ordem }
      : { ...form, ordem: ordem ?? 0 }
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    setSaving(false)
    if (r.ok) {
      onSuccess(isEditing ? 'Banner atualizado!' : 'Banner criado!')
      onSaved()
    } else {
      onError(isEditing ? 'Erro ao atualizar' : 'Erro ao salvar')
    }
  }

  function handleCancel() {
    if (busy) {
      if (!confirm('Há um upload em andamento. Cancelar mesmo assim?')) return
    }
    onCancel()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
        {isEditing ? 'Editar banner' : 'Novo Banner'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          {/* Desktop */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Imagem desktop — 1920×560px (3.43:1)</p>
          <p className="text-[10px] text-gray-400 -mt-1">Layout largo. Texto à esquerda + produtos à direita.</p>
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl h-44 cursor-pointer flex items-center justify-center overflow-hidden relative transition ${
              form.imagem ? '' : 'border-gray-200 hover:border-[#3cbfb3]'
            }`}
          >
            {form.imagem ? (
              <Image src={form.imagem} alt="preview desktop" fill className="object-cover" unoptimized />
            ) : uploading ? (
              <Loader2 className="w-8 h-8 text-[#3cbfb3] animate-spin" />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Clique para enviar imagem desktop</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
                   onChange={(e) => handleFileChange(e, 'imagem', setUploading, 'desktop')} />
          </div>
          {isEditing && form.imagem && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-[#3cbfb3] hover:text-[#2a9d8f] font-medium"
            >
              Trocar imagem desktop
            </button>
          )}

          {/* Tablet */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Imagem tablet/iPad — 1024×768px (4:3) — opcional</p>
            {form.imagemTablet && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, imagemTablet: '' }))}
                className="text-[10px] text-red-400 hover:text-red-600 font-medium uppercase tracking-wider flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Remover
              </button>
            )}
          </div>
          <div
            onClick={() => fileRefTablet.current?.click()}
            className={`border-2 border-dashed rounded-xl h-36 cursor-pointer flex items-center justify-center overflow-hidden relative transition ${
              form.imagemTablet ? '' : 'border-gray-200 hover:border-[#3cbfb3]'
            }`}
          >
            {form.imagemTablet ? (
              <Image src={form.imagemTablet} alt="preview tablet" fill className="object-cover" unoptimized />
            ) : uploadingTablet ? (
              <Loader2 className="w-7 h-7 text-[#3cbfb3] animate-spin" />
            ) : (
              <div className="text-center">
                <Upload className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Substitui no iPad (768–1023px). Layout 4:3 vertical ou horizontal.</p>
              </div>
            )}
            <input ref={fileRefTablet} type="file" accept="image/*" className="hidden"
                   onChange={(e) => handleFileChange(e, 'imagemTablet', setUploadingTablet, 'tablet')} />
          </div>

          {/* Mobile */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Imagem mobile — 800×800px (1:1 quadrado) — opcional</p>
            {form.imagemMobile && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, imagemMobile: '' }))}
                className="text-[10px] text-red-400 hover:text-red-600 font-medium uppercase tracking-wider flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Remover
              </button>
            )}
          </div>
          <div
            onClick={() => fileRefMobile.current?.click()}
            className={`border-2 border-dashed rounded-xl h-32 cursor-pointer flex items-center justify-center overflow-hidden relative transition ${
              form.imagemMobile ? '' : 'border-gray-200 hover:border-[#3cbfb3]'
            }`}
          >
            {form.imagemMobile ? (
              <Image src={form.imagemMobile} alt="preview mobile" fill className="object-cover" unoptimized />
            ) : uploadingMobile ? (
              <Loader2 className="w-7 h-7 text-[#3cbfb3] animate-spin" />
            ) : (
              <div className="text-center">
                <Upload className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Substitui no mobile (≤ 767px). Layout quadrado, texto e produtos empilhados.</p>
              </div>
            )}
            <input ref={fileRefMobile} type="file" accept="image/*" className="hidden"
                   onChange={(e) => handleFileChange(e, 'imagemMobile', setUploadingMobile, 'mobile')} />
          </div>
        </div>

        <div className="space-y-3">
          {([
            { key: 'titulo', label: 'Título', placeholder: 'Título do banner', required: true },
            { key: 'subtitulo', label: 'Subtítulo', placeholder: 'Subtítulo opcional', required: false },
            { key: 'link', label: 'Link', placeholder: '/produtos?categoria=climatizadores', required: false },
          ] as const).map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-600">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required={required}
                aria-required={required}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600">Tempo de exibição (s)</label>
            <input
              type="number"
              min={2}
              max={30}
              value={form.tempoCads}
              onChange={(e) => setForm((f) => ({ ...f, tempoCads: Number(e.target.value) }))}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
            />
          </div>
        </div>
      </div>

      {/* Dimensões e proporções */}
      <div className="border-t border-gray-100 pt-5 mt-2 mb-4">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Dimensões e proporções
        </h3>
        <p className="text-[11px] text-gray-400 mb-4">
          Controla o aspect-ratio do container do banner em cada device. Formato <code className="text-gray-600">largura/altura</code> (ex: 16/9).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <AspectField
            label="Mobile (&lt; 768px)"
            value={form.aspectMobile}
            presets={PRESETS_MOBILE}
            onChange={(v) => setForm((f) => ({ ...f, aspectMobile: v }))}
          />
          <AspectField
            label="Tablet (768-1023px)"
            value={form.aspectTablet}
            presets={PRESETS_TABLET}
            onChange={(v) => setForm((f) => ({ ...f, aspectTablet: v }))}
          />
          <AspectField
            label="Desktop (≥ 1024px)"
            value={form.aspectDesktop}
            presets={PRESETS_DESKTOP}
            onChange={(v) => setForm((f) => ({ ...f, aspectDesktop: v }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Altura máx desktop</label>
            <input
              value={form.maxHeightDesktop}
              onChange={(e) => setForm((f) => ({ ...f, maxHeightDesktop: e.target.value }))}
              placeholder="560px"
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
            />
            <p className="text-[10px] text-gray-400 mt-1">Ex: 560px, 640px, auto</p>
          </div>
        </div>

        {/* Preview ao vivo */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
          <div className="flex items-end gap-4 flex-wrap">
            <PreviewBox label="Mobile"  aspect={form.aspectMobile}  width={80}  />
            <PreviewBox label="Tablet"  aspect={form.aspectTablet}  width={140} />
            <PreviewBox label="Desktop" aspect={form.aspectDesktop} width={220} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={busy}
          className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? 'Salvar alterações' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

interface AspectFieldProps {
  label: string
  value: string
  presets: readonly string[]
  onChange: (v: string) => void
}

function AspectField({ label, value, presets, onChange }: AspectFieldProps) {
  const isCustom = !presets.includes(value)
  const valid = isValidAspect(value)
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <select
        value={isCustom ? '__custom__' : value}
        onChange={(e) => {
          const v = e.target.value
          if (v === '__custom__') onChange(value && !presets.includes(value) ? value : '')
          else onChange(v)
        }}
        className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
      >
        {presets.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        <option value="__custom__">Custom...</option>
      </select>
      {isCustom && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ex: 800/600"
          className={`w-full mt-1.5 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            valid
              ? 'border-gray-200 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]'
              : 'border-red-300 focus:ring-red-300'
          }`}
        />
      )}
      {isCustom && !valid && (
        <p className="text-[10px] text-red-500 mt-1">Use formato W/H (ex: 16/9)</p>
      )}
    </div>
  )
}

function PreviewBox({ label, aspect, width }: { label: string; aspect: string; width: number }) {
  const valid = isValidAspect(aspect)
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="bg-gradient-to-br from-[#1a4f4a]/30 to-[#0f2e2b]/50 rounded-lg border border-gray-200 flex items-center justify-center text-[10px] text-white/80 font-mono"
        style={{
          width: `${width}px`,
          aspectRatio: valid ? aspectToCss(aspect) : '1 / 1',
        }}
      >
        {valid ? aspect : '—'}
      </div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  )
}
