'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Device } from './types'

interface Props {
  icon: React.ReactNode
  title: string
  description?: string
  visibleFor: Device[]
  currentDevice: Device
  defaultOpen?: boolean
  children: React.ReactNode
}

export function EditorSection({
  icon, title, description, visibleFor, currentDevice, defaultOpen = false, children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  if (!visibleFor.includes(currentDevice)) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-[#3cbfb3]/10 text-[#3cbfb3] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>}
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}
