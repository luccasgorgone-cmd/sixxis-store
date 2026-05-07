'use client'

import { useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import type { Device } from './types'

const DIMENSIONS: Record<Device, { width: number | string; height: number | string; label: string }> = {
  desktop: { width: '100%',  height: '100%',  label: 'Largura total · alinha-se à viewport' },
  tablet:  { width: 768,     height: 1024,    label: '768 × 1024' },
  mobile:  { width: 390,     height: 844,     label: '390 × 844' },
}

interface Props {
  device: Device
  refreshKey: number
  url?: string
}

export function LivePreview({ device, refreshKey, url = '/' }: Props) {
  const [localKey, setLocalKey] = useState(0)
  const dim = DIMENSIONS[device]
  const cacheBuster = `?_v=${refreshKey}-${localKey}`

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Preview</span>
          <span className="text-xs text-gray-700 font-mono truncate">{dim.label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setLocalKey((k) => k + 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Recarregar preview"
          >
            <RefreshCw size={13} /> Recarregar
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Abrir em nova aba"
          >
            <ExternalLink size={13} /> Abrir
          </a>
        </div>
      </div>
      <div className="flex-1 flex items-start justify-center p-4 overflow-auto">
        <div
          className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200 transition-all"
          style={{
            width: dim.width,
            height: dim.height,
            maxWidth: '100%',
            maxHeight: device === 'desktop' ? '100%' : 'calc(100vh - 200px)',
          }}
        >
          <iframe
            key={`${device}-${refreshKey}-${localKey}`}
            src={url + cacheBuster}
            title="Preview do site"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  )
}
