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

export default function TrustBar({ items = DEFAULT_ITEMS }: { items?: TrustItem[] }) {
  return (
    <div
      className="border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,.04)]"
      style={{ backgroundColor: 'var(--color-trustbar-fundo, #ffffff)' }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {items.map(({ titulo, sub }, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div
                key={titulo}
                className="flex items-center justify-center gap-3 py-4 px-3 hover:bg-[#f9fafb] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
                  <Icon
                    size={16}
                    style={{ color: 'var(--color-trustbar-icones, #3cbfb3)' }}
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-[#1f2937] leading-tight truncate">
                    {titulo}
                  </p>
                  <p className="hidden sm:block text-[11px] text-gray-500 leading-tight truncate mt-0.5">
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
