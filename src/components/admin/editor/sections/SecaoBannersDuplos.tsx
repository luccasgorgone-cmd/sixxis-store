'use client'

import { LayoutGrid } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { ImageUploadField, TextField, ToggleField } from '../FormFields'
import type { SectionProps } from '../types'

const SLOTS = [1, 2, 3, 4] as const

export function SecaoBannersDuplos({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  const ativo = config.banner_duplo_ativo === 'true'

  return (
    <EditorSection
      icon={<LayoutGrid size={18} />}
      title="Banners Duplos"
      description="2 ou 4 banners menores (categorias / promoções)"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
        Seção em preparação. As configurações abaixo são gravadas no DB mas
        ainda não são lidas pela home. Toggle abaixo deixa pronto pra ativar
        quando o componente da home for atualizado.
      </div>
      <ToggleField
        label="Habilitar Banners Duplos na home (em breve)"
        value={ativo}
        onChange={(v) => setConfig((p) => ({ ...p, banner_duplo_ativo: v ? 'true' : 'false' }))}
      />
      <TextField
        label="Título da seção (opcional)"
        value={config.banner_duplo_titulo || ''}
        onChange={update('banner_duplo_titulo')}
        placeholder="Categorias em destaque"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SLOTS.map((n) => (
          <div key={n} className="border border-gray-100 rounded-xl p-3 space-y-3">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Banner {n}</p>
            <ImageUploadField
              label="Imagem"
              value={config[`banner_duplo_${n}_imagem`] || ''}
              onChange={update(`banner_duplo_${n}_imagem`)}
              height={100}
            />
            <TextField
              label="Link"
              value={config[`banner_duplo_${n}_link`] || ''}
              onChange={update(`banner_duplo_${n}_link`)}
              placeholder="/produtos?categoria=..."
            />
          </div>
        ))}
      </div>
    </EditorSection>
  )
}
