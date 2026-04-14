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
  { titulo: 'Produtos Originais',         sub: 'Garantia Sixxis' },
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
        <div className={`grid grid-cols-2 md:grid-cols-4 ${
          transparent ? 'divide-x divide-white/15' : 'divide-x divide-gray-200'
        }`}>
          {items.map(({ titulo, sub }, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div
                key={titulo}
                className="flex items-center justify-center gap-3 py-1 px-3 hover:bg-white/5 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  transparent ? 'bg-white/10' : 'bg-[#e8f8f7]'
                }`}>
                  <Icon size={16} className="text-[#3cbfb3]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs sm:text-sm font-bold leading-tight truncate ${
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
