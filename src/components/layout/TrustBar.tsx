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
    title: 'Parcele em até 12x',
    sub: 'Sem juros no cartão',
  },
  {
    icon: Star,
    title: 'Produtos Originais',
    sub: 'Garantia Sixxis',
  },
]

export default function TrustBar() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {items.map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center justify-center gap-3 py-3 px-2"
            >
              <Icon size={22} color="#3cbfb3" strokeWidth={2} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                  {title}
                </p>
                <p className="hidden sm:block text-[11px] text-gray-400 leading-tight truncate">
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
