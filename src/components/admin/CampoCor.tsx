'use client'

import { useState, useEffect } from 'react'

interface Props {
  label: string
  chave: string
  valor: string
  cssVar?: string
  onChange: (chave: string, valor: string) => void
}

export default function CampoCor({ label, chave, valor, cssVar, onChange }: Props) {
  const [hex, setHex] = useState(valor || '#3cbfb3')

  useEffect(() => { setHex(valor || '#3cbfb3') }, [valor])

  function aplicarPreview(v: string) {
    if (cssVar) document.documentElement.style.setProperty(cssVar, v)
  }

  function handleHex(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setHex(v)
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange(chave, v)
      aplicarPreview(v)
    }
  }

  function handlePicker(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setHex(v)
    onChange(chave, v)
    aplicarPreview(v)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#3cbfb3'}
          onChange={handlePicker}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
        />
        <input
          type="text"
          value={hex}
          onChange={handleHex}
          placeholder="#3cbfb3"
          maxLength={7}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] min-w-0"
        />
        <div
          className="w-10 h-10 rounded-lg border border-gray-200 shrink-0"
          style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#3cbfb3' }}
        />
      </div>
    </div>
  )
}
