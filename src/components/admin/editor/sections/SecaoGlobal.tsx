'use client'

import { Palette } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { ColorField, ImageUploadField, SelectField, TextField } from '../FormFields'
import type { SectionProps } from '../types'

const FONT_OPTIONS = [
  { value: '',                           label: 'Padrão (Inter)' },
  { value: 'Inter, sans-serif',          label: 'Inter' },
  { value: 'Roboto, sans-serif',         label: 'Roboto' },
  { value: 'Poppins, sans-serif',        label: 'Poppins' },
  { value: 'Montserrat, sans-serif',     label: 'Montserrat' },
  { value: 'Open Sans, sans-serif',      label: 'Open Sans' },
]

export function SecaoGlobal({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<Palette size={18} />}
      title="Global · Marca e aparência"
      description="Cores, fonte e imagens compartilhadas em todos os devices"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
      defaultOpen
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorField label="Cor primária"      value={config.cor_principal      || ''} onChange={update('cor_principal')} />
        <ColorField label="Cor primária dark" value={config.cor_principal_dark || ''} onChange={update('cor_principal_dark')} />
        <ColorField label="Cor de destaque"   value={config.cor_destaque       || ''} onChange={update('cor_destaque')} />
        <ColorField label="Cor do header"     value={config.cor_header         || ''} onChange={update('cor_header')} />
        <ColorField label="Texto do header"   value={config.cor_header_texto   || ''} onChange={update('cor_header_texto')} />
        <ColorField label="Cor dos botões"    value={config.cor_botoes         || ''} onChange={update('cor_botoes')} />
      </div>

      <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUploadField label="Logo principal"  value={config.logo_url        || ''} onChange={update('logo_url')} />
        <ImageUploadField label="Logo do rodapé"  value={config.logo_rodape_url || ''} onChange={update('logo_rodape_url')} height={100} />
        <ImageUploadField label="Favicon"         value={config.favicon_url     || ''} onChange={update('favicon_url')}    height={100} />
      </div>

      <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Fonte principal"
          value={config.fonte_principal || ''}
          onChange={update('fonte_principal')}
          options={FONT_OPTIONS}
        />
        <TextField
          label="Tagline do rodapé"
          value={config.rodape_tagline || ''}
          onChange={update('rodape_tagline')}
          placeholder="Tecnologia e qualidade para seu conforto..."
        />
      </div>
    </EditorSection>
  )
}
