import { Truck, ShieldCheck, CreditCard, Star } from 'lucide-react'

const items = [
  {
    icon: Truck,
    title: 'Entrega para todo o Brasil',
    sub: 'Frete grátis acima de R$\u00a0500',
  },
  {
    icon: ShieldCheck,
    title: 'Compra 100% Segura',
    sub: 'Seus dados protegidos',
  },
  {
    icon: CreditCard,
    title: '6x sem juros no cartão',
    sub: 'Débito, crédito e PIX',
  },
  {
    icon: Star,
    title: 'Produtos Originais',
    sub: 'Garantia Sixxis',
  },
]

export default function TrustBar() {
  return (
    <div className="bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {items.map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center justify-center gap-3 py-4 px-2 transition-colors hover:bg-[#f8f9fa]"
            >
              <Icon size={22} color="#3cbfb3" strokeWidth={2} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                  {title}
                </p>
                <p className="hidden sm:block text-[11px] text-gray-400 leading-tight truncate mt-0.5">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
