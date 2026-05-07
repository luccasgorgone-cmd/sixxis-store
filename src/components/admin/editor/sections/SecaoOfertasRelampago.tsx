'use client'

import { Zap } from 'lucide-react'
import Link from 'next/link'
import { EditorSection } from '../EditorSection'
import { ColorField, TextField, TextareaField, ToggleField } from '../FormFields'
import type { SectionProps } from '../types'

export function SecaoOfertasRelampago({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  const ativo = config.ofertas_relampago_ativo !== 'false'

  return (
    <EditorSection
      icon={<Zap size={18} />}
      title="Ofertas Relâmpago"
      description="Carrossel de ofertas com timer regressivo"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-800">
        Para configurar produtos em oferta e datas,{' '}
        <Link href="/adm-a7f9c2b4/produtos" className="font-semibold underline">
          edite os produtos →
        </Link>
      </div>
      <ToggleField
        label="Exibir seção Ofertas Relâmpago"
        value={ativo}
        onChange={(v) => setConfig((p) => ({ ...p, ofertas_relampago_ativo: v ? 'true' : 'false' }))}
      />
      <TextField
        label="Título da seção"
        value={config.ofertas_relampago_titulo || ''}
        onChange={update('ofertas_relampago_titulo')}
        placeholder="OFERTAS RELÂMPAGO"
      />
      <TextareaField
        label="Subtítulo (opcional)"
        rows={2}
        value={config.ofertas_relampago_subtitulo || ''}
        onChange={update('ofertas_relampago_subtitulo')}
        placeholder="Aproveite enquanto duram!"
      />
      <ColorField
        label="Cor do timer regressivo"
        value={config.cor_timer || ''}
        onChange={update('cor_timer')}
        hint="Default: #3cbfb3"
      />

      {device === 'mobile' && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mobile-only</p>
          <TextField
            label="Título no mobile (override)"
            value={config.mobile_ofertas_relampago_titulo || ''}
            onChange={update('mobile_ofertas_relampago_titulo')}
            placeholder="⚡ Ofertas Relâmpago"
          />
        </div>
      )}
    </EditorSection>
  )
}
