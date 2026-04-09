import { Truck, ShieldCheck, CreditCard, Star } from 'lucide-react'

const items = [
  {
    Icon:  Truck,
    title: 'Entrega para todo o Brasil',
    sub:   'Frete grátis acima de R$\u00a0500',
  },
  {
    Icon:  ShieldCheck,
    title: 'Compra 100% Segura',
    sub:   'Seus dados protegidos',
  },
  {
    Icon:  CreditCard,
    title: '6x sem juros no cartão',
    sub:   'Débito, crédito e PIX',
  },
  {
    Icon:  Star,
    title: 'Produtos Originais',
    sub:   'Garantia Sixxis',
  },
]

export default function TrustBar() {
  return (
    <div className="bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {items.map(({ Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center justify-center gap-3 py-4 px-3 hover:bg-[#f9fafb] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[#3cbfb3]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#1f2937] leading-tight truncate">
                  {title}
                </p>
                <p className="hidden sm:block text-[11px] text-gray-500 leading-tight truncate mt-0.5">
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
