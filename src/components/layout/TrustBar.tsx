import { Truck, ShieldCheck, CreditCard, Star } from 'lucide-react'

const ICONS = [Truck, ShieldCheck, CreditCard, Star] as const

interface TrustItem {
  titulo: string
  sub: string
}

const DEFAULT_ITEMS: TrustItem[] = [
  { titulo: 'Entrega para todo o Brasil', sub: 'Frete grátis acima de R$\u00a0500' },
  { titulo: 'Compra 100% Segura',         sub: 'Seus dados protegidos' },
  { titulo: '6x sem juros no cartão',     sub: 'Débito, crédito e PIX' },
  { titulo: 'Qualidade Sixxis',           sub: 'Garantia Sixxis' },
]

interface Props {
  items?: TrustItem[]
  transparent?: boolean
}

export default function TrustBar({ items = DEFAULT_ITEMS, transparent = false }: Props) {
  return (
    <div className={`w-full py-3.5 ${
      transparent
        ? 'bg-transparent border-t border-b border-white/15'
        : 'bg-white border-t border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile: grid 2x2 / Desktop: grid 1x4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-0">
          {items.map(({ titulo, sub }, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div
                key={titulo}
                className={`flex items-center justify-start md:justify-center gap-2 md:gap-3 py-1 px-2 md:px-3 hover:bg-white/5 transition-colors min-w-0 ${
                  i > 0 ? (transparent ? 'md:border-l md:border-white/15' : 'md:border-l md:border-gray-200') : ''
                }`}
              >
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${
                  transparent ? 'bg-white/10' : 'bg-[#e8f8f7]'
                }`}>
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3cbfb3]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] md:text-sm font-bold leading-tight ${
                    transparent ? 'text-white' : 'text-gray-900'
                  }`}>
                    {titulo}
                  </p>
                  <p className={`hidden sm:block text-[11px] leading-tight truncate mt-0.5 ${
                    transparent ? 'text-white/65' : 'text-gray-500'
                  }`}>
                    {sub}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
