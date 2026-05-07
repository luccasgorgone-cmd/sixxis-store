'use client'

import { MessageCircle } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { TextField, TextareaField } from '../FormFields'
import type { SectionProps } from '../types'

export function SecaoBannerWhatsapp({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<MessageCircle size={18} />}
      title="Banner WhatsApp"
      description="Seção CTA para WhatsApp na home"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <TextField
        label="Título"
        value={config.whatsapp_banner_titulo || ''}
        onChange={update('whatsapp_banner_titulo')}
        placeholder="Precisa de ajuda?"
      />
      <TextareaField
        label="Subtítulo"
        rows={2}
        value={config.whatsapp_banner_subtitulo || ''}
        onChange={update('whatsapp_banner_subtitulo')}
        placeholder="Nossa equipe está pronta para te atender..."
      />
      <TextField
        label="Número de WhatsApp (suporte)"
        value={config.social_whatsapp_suporte || ''}
        onChange={update('social_whatsapp_suporte')}
        placeholder="5518997474701"
        hint="Apenas dígitos com DDI+DDD (ex: 5518997474701)"
      />
    </EditorSection>
  )
}
