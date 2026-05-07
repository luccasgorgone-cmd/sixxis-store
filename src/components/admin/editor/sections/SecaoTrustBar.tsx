'use client'

import { ShieldCheck } from 'lucide-react'
import { EditorSection } from '../EditorSection'
import { ColorField, TextField } from '../FormFields'
import type { SectionProps } from '../types'

const TRUST_NUMS = [1, 2, 3, 4] as const
const PLACEHOLDERS: Record<number, { titulo: string; sub: string }> = {
  1: { titulo: 'Entrega para todo o Brasil', sub: 'Frete grátis acima de R$ 500' },
  2: { titulo: 'Compra 100% Segura',         sub: 'Seus dados protegidos' },
  3: { titulo: '6x sem juros no cartão',     sub: 'Débito, crédito e PIX' },
  4: { titulo: 'Qualidade comprovada',       sub: 'Garantia Sixxis' },
}

export function SecaoTrustBar({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  return (
    <EditorSection
      icon={<ShieldCheck size={18} />}
      title="Trust Bar · Selos abaixo do banner"
      description="4 selos de confiança (entrega, segurança, parcelamento, qualidade)"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <p className="text-[11px] text-gray-400">
        Os ícones dos selos são fixos no componente da home (Truck, Shield, CreditCard, BadgeCheck).
        Aqui você edita só os textos.
      </p>
      <div className="space-y-3">
        {TRUST_NUMS.map((n) => (
          <div key={n} className="border border-gray-100 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label={`Selo ${n} · Título`}
              value={config[`trust_${n}_titulo`] || ''}
              onChange={update(`trust_${n}_titulo`)}
              placeholder={PLACEHOLDERS[n].titulo}
            />
            <TextField
              label={`Selo ${n} · Subtítulo`}
              value={config[`trust_${n}_sub`] || ''}
              onChange={update(`trust_${n}_sub`)}
              placeholder={PLACEHOLDERS[n].sub}
            />
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorField label="Cor de fundo da Trust Bar" value={config.cor_trustbar_fundo  || ''} onChange={update('cor_trustbar_fundo')} />
        <ColorField label="Cor dos ícones"            value={config.cor_trustbar_icones || ''} onChange={update('cor_trustbar_icones')} />
      </div>
    </EditorSection>
  )
}
