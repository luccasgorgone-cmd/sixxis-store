// Defaults compartilhados pela seção "Por que Sixxis?" da home, pelo editor
// admin e pelo endpoint de seed inicial. Único lugar pra mexer nos textos
// padrões e nos ícones aceitos.

export type PorQueSixxisIconName =
  | 'Award' | 'Truck' | 'Headphones' | 'Package'
  | 'Shield' | 'Star' | 'Heart' | 'Zap'
  | 'Clock' | 'ThumbsUp' | 'MapPin' | 'BadgeCheck'
  | 'Cpu' | 'Sparkles'

export interface PorQueSixxisCardDefault {
  titulo: string
  texto:  string
  icone:  PorQueSixxisIconName
}

export const PQ_SIXXIS_CARDS: PorQueSixxisCardDefault[] = [
  {
    titulo: 'Qualidade Premium',
    texto:  'Produtos testados e aprovados, com materiais resistentes para durar por anos.',
    icone:  'Award',
  },
  {
    titulo: 'Entrega Rápida',
    texto:  'Despachamos em até 24h. Receba na sua porta com Correios e transportadoras parceiras.',
    icone:  'Truck',
  },
  {
    titulo: 'Suporte Especializado',
    texto:  'Equipe técnica pronta para ajudar com instalação e manutenção.',
    icone:  'Headphones',
  },
  {
    titulo: 'Entrega para todo Brasil',
    texto:  'Levamos conforto da capital ao interior — entregamos em todos os estados.',
    icone:  'Package',
  },
]

export const PQ_SIXXIS_ICON_OPTIONS: { value: PorQueSixxisIconName; label: string }[] = [
  { value: 'Award',      label: '⭐ Award (qualidade)' },
  { value: 'Truck',      label: '🚚 Truck (entrega)' },
  { value: 'Headphones', label: '🎧 Headphones (suporte)' },
  { value: 'Package',    label: '📦 Package (envio)' },
  { value: 'Shield',     label: '🛡️ Shield (proteção)' },
  { value: 'Star',       label: '⭐ Star (genérico)' },
  { value: 'Heart',      label: '❤️ Heart (amor)' },
  { value: 'Zap',        label: '⚡ Zap (rápido)' },
  { value: 'Clock',      label: '⏰ Clock (tempo)' },
  { value: 'ThumbsUp',   label: '👍 ThumbsUp (aprovação)' },
  { value: 'MapPin',     label: '📍 MapPin (localização)' },
  { value: 'BadgeCheck', label: '✅ BadgeCheck (verificado)' },
  { value: 'Cpu',        label: '🖥️ Cpu (tecnologia)' },
  { value: 'Sparkles',   label: '✨ Sparkles (premium)' },
]

export const PQ_SIXXIS_NUMS = [1, 2, 3, 4] as const

export function pqSixxisDefaultEntries(): Record<string, string> {
  const entries: Record<string, string> = {}
  PQ_SIXXIS_CARDS.forEach((card, i) => {
    const n = i + 1
    entries[`pq_sixxis_${n}_titulo`] = card.titulo
    entries[`pq_sixxis_${n}_texto`]  = card.texto
    entries[`pq_sixxis_${n}_icone`]  = card.icone
  })
  return entries
}
