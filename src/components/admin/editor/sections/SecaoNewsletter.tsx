'use client'

import { Mail } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { TextField, TextareaField, ToggleField } from '../FormFields'
import type { SectionProps } from '../types'

export function SecaoNewsletter({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  const ativo = config.newsletter_ativo !== 'false'

  return (
    <EditorSection
      icon={<Mail size={18} />}
      title="Newsletter"
      description="Seção de captura de email"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <ToggleField
        label="Exibir seção newsletter"
        value={ativo}
        onChange={(v) => setConfig((p) => ({ ...p, newsletter_ativo: v ? 'true' : 'false' }))}
      />
      <TextField
        label="Título"
        value={config.newsletter_titulo || ''}
        onChange={update('newsletter_titulo')}
        placeholder="Receba novidades e promoções exclusivas"
      />
      <TextareaField
        label="Subtítulo"
        rows={2}
        value={config.newsletter_subtitulo || ''}
        onChange={update('newsletter_subtitulo')}
        placeholder="Cadastre-se e ganhe 5% OFF na próxima compra..."
      />
    </EditorSection>
  )
}
