'use client'

import { Megaphone } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { ColorField, TextField } from '../FormFields'
import type { SectionProps } from '../types'

export function SecaoAnuncio({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<Megaphone size={18} />}
      title="Barra de anúncio (topo)"
      description="Faixa de texto rotativa acima do header"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorField label="Cor de fundo"  value={config.cor_anuncio_fundo || ''} onChange={update('cor_anuncio_fundo')} />
        <ColorField label="Cor do texto"  value={config.cor_anuncio_texto || ''} onChange={update('cor_anuncio_texto')} />
      </div>
      <div className="space-y-3">
        <TextField label="Anúncio 1" value={config.anuncio_1 || ''} onChange={update('anuncio_1')} placeholder="🎉 CUPOM SIXXIS10 — 10% OFF na 1ª compra" />
        <TextField label="Anúncio 2" value={config.anuncio_2 || ''} onChange={update('anuncio_2')} placeholder="🚚 Frete grátis acima de R$ 500" />
        <TextField label="Anúncio 3" value={config.anuncio_3 || ''} onChange={update('anuncio_3')} placeholder="💳 Parcele em até 6x sem juros" />
      </div>
    </EditorSection>
  )
}
