'use client'

import { BarChart3 } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { ColorField, TextField } from '../FormFields'
import type { SectionProps } from '../types'

const STATS_NUMS = [1, 2, 3, 4] as const
const PLACEHOLDERS: Record<number, { num: string; label: string }> = {
  1: { num: '5.000+',   label: 'Clientes Satisfeitos' },
  2: { num: '12 meses', label: 'Garantia Sixxis' },
  3: { num: '100%',     label: 'Entrega para o Brasil' },
  4: { num: '48h',      label: 'Entrega Expressa SP' },
}

export function SecaoStats({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<BarChart3 size={18} />}
      title="Stats · Sixxis em números"
      description="4 números de destaque com fundo colorido"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <div className="space-y-3">
        {STATS_NUMS.map((n) => (
          <div key={n} className="border border-gray-100 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label={`Stat ${n} · Número`}
              value={config[`stat_${n}_num`] || ''}
              onChange={update(`stat_${n}_num`)}
              placeholder={PLACEHOLDERS[n].num}
            />
            <TextField
              label={`Stat ${n} · Rótulo`}
              value={config[`stat_${n}_label`] || ''}
              onChange={update(`stat_${n}_label`)}
              placeholder={PLACEHOLDERS[n].label}
            />
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-4">
        <ColorField
          label="Cor de fundo da seção Stats"
          value={config.cor_stats_fundo || ''}
          onChange={update('cor_stats_fundo')}
          hint="Aplica em --color-stats no CSS global"
        />
      </div>
    </EditorSection>
  )
}
