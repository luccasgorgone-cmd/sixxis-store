'use client'

import { Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { EditorSection } from '../EditorSection'
import { TextField, TextareaField } from '../FormFields'
import type { SectionProps } from '../types'

export function SecaoHero({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<ImageIcon size={18} />}
      title="Hero · Banner principal"
      description="Aparece quando não há banners cadastrados. Para banners visuais, use a tela dedicada."
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
        Os textos abaixo aparecem só quando não há banners ativos.
        {' '}
        <Link href="/adm-a7f9c2b4/banners" className="font-semibold underline">
          Gerenciar banners →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Título"         value={config.hero_titulo    || ''} onChange={update('hero_titulo')} placeholder="Climatizadores, Aspiradores e Spinning" />
        <TextField label="Texto do botão" value={config.hero_cta_texto || ''} onChange={update('hero_cta_texto')} placeholder="Ver Produtos" />
      </div>
      <TextareaField
        label="Subtítulo"
        value={config.hero_subtitulo || ''}
        onChange={update('hero_subtitulo')}
        placeholder="Climatizadores, aspiradores e spinning de qualidade premium..."
      />
      <TextField
        label="Link do botão"
        value={config.hero_cta_link || ''}
        onChange={update('hero_cta_link')}
        placeholder="/produtos"
      />
    </EditorSection>
  )
}
