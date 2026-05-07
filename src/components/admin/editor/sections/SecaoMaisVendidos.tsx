'use client'

import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { EditorSection } from '../EditorSection'
import { ColorField, SelectField, TextField, ToggleField } from '../FormFields'
import type { SectionProps } from '../types'

const QTD_OPTIONS = [
  { value: '2', label: '2 produtos' },
  { value: '4', label: '4 produtos' },
  { value: '6', label: '6 produtos' },
]

export function SecaoMaisVendidos({ config, setConfig, device }: SectionProps) {
  const update = (key: string) => (v: string) =>
    setConfig((p) => ({ ...p, [key]: v }))

  const verTodosAtivo = config.mobile_mais_vendidos_botao_ver_todos !== 'false'

  return (
    <EditorSection
      icon={<TrendingUp size={18} />}
      title="Mais Vendidos"
      description="Carrossel de produtos mais vendidos"
      visibleFor={['desktop', 'tablet', 'mobile']}
      currentDevice={device}
    >
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-800">
        Para selecionar quais produtos aparecem,{' '}
        <Link href="/adm-a7f9c2b4/editor-home" className="font-semibold underline">
          edite os destaques na tela legada →
        </Link>
      </div>
      <TextField
        label="Título da seção"
        value={config.mais_vendidos_titulo || ''}
        onChange={update('mais_vendidos_titulo')}
        placeholder="Mais Vendidos"
      />
      <TextField
        label="Texto do link 'Ver todos'"
        value={config.mais_vendidos_link_texto || ''}
        onChange={update('mais_vendidos_link_texto')}
        placeholder="Ver todos →"
      />
      <ColorField
        label="Cor dos títulos de seção (geral)"
        value={config.cor_titulos_secao || ''}
        onChange={update('cor_titulos_secao')}
      />

      {device === 'mobile' && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mobile-only</p>
          <SelectField
            label="Quantidade de produtos no mobile"
            value={config.mobile_mais_vendidos_quantidade || '4'}
            onChange={update('mobile_mais_vendidos_quantidade')}
            options={QTD_OPTIONS}
          />
          <ToggleField
            label="Mostrar botão 'Ver todos' no mobile"
            value={verTodosAtivo}
            onChange={(v) => setConfig((p) => ({ ...p, mobile_mais_vendidos_botao_ver_todos: v ? 'true' : 'false' }))}
          />
        </div>
      )}
    </EditorSection>
  )
}
