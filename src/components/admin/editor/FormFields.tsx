'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Loader2, Upload, X } from 'lucide-react'

const inputBase =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]'

interface FieldShellProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export function FieldShell({ label, hint, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}

export function TextField({ label, value, onChange, placeholder, hint }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputBase}
      />
    </FieldShell>
  )
}

interface TextareaFieldProps extends TextFieldProps {
  rows?: number
}

export function TextareaField({ label, value, onChange, placeholder, hint, rows = 3 }: TextareaFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={inputBase + ' resize-y'}
      />
    </FieldShell>
  )
}

interface NumberFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  hint?: string
}

export function NumberField({ label, value, onChange, min, max, step, suffix, hint }: NumberFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          className={inputBase}
        />
        {suffix && <span className="text-xs text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </FieldShell>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  hint?: string
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputBase}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FieldShell>
  )
}

interface ToggleFieldProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  hint?: string
}

export function ToggleField({ label, value, onChange, hint }: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          value ? 'bg-[#3cbfb3]' : 'bg-gray-300'
        }`}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}

export function ColorField({ label, value, onChange, hint }: ColorFieldProps) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(value || '') ? value : '#3cbfb3'
  return (
    <FieldShell label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3cbfb3"
          maxLength={7}
          className={inputBase + ' font-mono'}
        />
        <div
          className="w-10 h-10 rounded-lg border border-gray-200 shrink-0"
          style={{ backgroundColor: safe }}
        />
      </div>
    </FieldShell>
  )
}

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  height?: number
}

export function ImageUploadField({ label, value, onChange, hint, height = 140 }: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (r.ok) {
      const { url } = await r.json()
      if (url) onChange(url)
    }
    e.target.value = ''
  }

  return (
    <FieldShell label={label} hint={hint}>
      <div
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl cursor-pointer flex items-center justify-center overflow-hidden relative transition ${
          value ? '' : 'border-gray-200 hover:border-[#3cbfb3]'
        }`}
        style={{ height: `${height}px` }}
      >
        {value ? (
          <Image src={value} alt="preview" fill className="object-cover" unoptimized />
        ) : uploading ? (
          <Loader2 className="w-7 h-7 text-[#3cbfb3] animate-spin" />
        ) : (
          <div className="text-center">
            <Upload className="w-7 h-7 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Clique para enviar</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div className="flex items-center gap-3 mt-1">
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={inputBase + ' text-xs'}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-600 font-semibold flex items-center gap-0.5 shrink-0"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>
    </FieldShell>
  )
}
