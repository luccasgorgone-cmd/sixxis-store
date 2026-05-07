'use client'

import { Sparkles } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { TextField, TextareaField, SelectField } from '../FormFields'
import {
  PQ_SIXXIS_CARDS,
  PQ_SIXXIS_NUMS,
  PQ_SIXXIS_ICON_OPTIONS,
} from '@/lib/porque-sixxis-defaults'
import { getPqSixxisIcon } from '@/lib/porque-sixxis-icons'
import type { SectionProps } from '../types'

export function SecaoPorQueSixxis({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<Sparkles size={18} />}
      title="Por que Sixxis · 4 cards"
      description="Cards de diferenciais. Cada card tem título, texto e ícone."
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <div className="space-y-4">
        {PQ_SIXXIS_NUMS.map((n, idx) => {
          const def = PQ_SIXXIS_CARDS[idx]
          const iconKey  = `pq_sixxis_${n}_icone`
          const iconValue = config[iconKey] || def.icone
          const PreviewIcon = getPqSixxisIcon(iconValue)
          return (
            <div key={n} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Card {n}</p>
                <div className="w-9 h-9 rounded-lg bg-[#1a4f4a] flex items-center justify-center">
                  <PreviewIcon size={18} className="text-[#3cbfb3]" />
                </div>
              </div>
              <TextField
                label="Título"
                value={config[`pq_sixxis_${n}_titulo`] || ''}
                onChange={update(`pq_sixxis_${n}_titulo`)}
                placeholder={def.titulo}
              />
              <TextareaField
                label="Texto"
                rows={2}
                value={config[`pq_sixxis_${n}_texto`] || ''}
                onChange={update(`pq_sixxis_${n}_texto`)}
                placeholder={def.texto}
              />
              <SelectField
                label="Ícone"
                value={iconValue}
                onChange={update(iconKey)}
                options={PQ_SIXXIS_ICON_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              />
            </div>
          )
        })}
      </div>
    </EditorSection>
  )
}
