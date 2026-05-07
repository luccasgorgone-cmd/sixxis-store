'use client'

import { Monitor, Tablet, Smartphone } from 'lucide-react'
import type { Device } from './types'

interface Props {
  active: Device
  onChange: (d: Device) => void
}

const TABS: { value: Device; label: string; size: string; Icon: typeof Monitor }[] = [
  { value: 'desktop', label: 'Desktop', size: '1920×1080', Icon: Monitor },
  { value: 'tablet',  label: 'Tablet',  size: '768×1024',  Icon: Tablet },
  { value: 'mobile',  label: 'Mobile',  size: '390×844',   Icon: Smartphone },
]

export function DeviceTabs({ active, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
      {TABS.map(({ value, label, size, Icon }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              isActive
                ? 'bg-[#0f2e2b] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} />
            <div className="text-left leading-tight">
              <div>{label}</div>
              <div className={`text-[10px] font-normal ${isActive ? 'text-white/60' : 'text-gray-400'}`}>{size}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
