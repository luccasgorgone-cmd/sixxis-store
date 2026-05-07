'use client'

import { Anchor } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { ColorField, TextField, TextareaField } from '../FormFields'
import type { SectionProps } from '../types'

export function SecaoFooter({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<Anchor size={18} />}
      title="Footer · Rodapé"
      description="Tagline, redes sociais e cor de fundo"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <TextareaField
        label="Tagline"
        rows={2}
        value={config.rodape_tagline || ''}
        onChange={update('rodape_tagline')}
        placeholder="Tecnologia e qualidade para seu conforto e bem-estar."
      />
      <ColorField
        label="Cor de fundo do rodapé"
        value={config.bg_footer_cor || config.color_footer || ''}
        onChange={update('bg_footer_cor')}
      />
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Redes sociais</p>
        <TextField label="WhatsApp principal" value={config.social_whatsapp || ''} onChange={update('social_whatsapp')} placeholder="5518997474701" />
        <TextField label="Instagram"          value={config.social_instagram || ''} onChange={update('social_instagram')} placeholder="https://instagram.com/sixxis" />
        <TextField label="Facebook"           value={config.social_facebook || ''} onChange={update('social_facebook')} placeholder="https://facebook.com/sixxis" />
      </div>
    </EditorSection>
  )
}
