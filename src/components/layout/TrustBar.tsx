import { Truck, ShieldCheck, CreditCard, Star } from 'lucide-react'

const items = [
  {
    icon:  Truck,
    color: '#3cbfb3',
    title: 'Entrega para todo o Brasil',
    sub:   'Frete grátis acima de R$\u00a0500',
  },
  {
    icon:  ShieldCheck,
    color: '#22c55e',
    title: 'Compra 100% Segura',
    sub:   'Seus dados protegidos',
  },
  {
    icon:  CreditCard,
    color: '#6366f1',
    title: '6x sem juros no cartão',
    sub:   'Débito, crédito e PIX',
  },
  {
    icon:  Star,
    color: '#f59e0b',
    title: 'Produtos Originais',
    sub:   'Garantia Sixxis',
  },
]

export default function TrustBar() {
  return (
    <div className="bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,.06)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {items.map(({ icon: Icon, color, title, sub }) => (
            <div
              key={title}
              className="flex items-center justify-center gap-3 py-4 px-3 transition-colors hover:bg-[#f8f9fa]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon size={20} color={color} strokeWidth={2} />
              </div>
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
