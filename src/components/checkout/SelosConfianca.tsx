import { ShieldCheck, Truck, Lock, CreditCard, BadgeCheck, Headphones } from 'lucide-react'

// 6 selos de confiança — usados no /carrinho e no /checkout (fonte única, sem
// duplicar o markup). Ícones Lucide monocromáticos, sem emoji.
const SELOS = [
  { icon: ShieldCheck, titulo: '12 meses de garantia',       sub: 'Garantia real e documentada' },
  { icon: Truck,       titulo: 'Entrega para todo o Brasil', sub: 'Despacho em 24h' },
  { icon: Lock,        titulo: 'Compra 100% segura',         sub: 'SSL 256-bit + Antifraude' },
  { icon: CreditCard,  titulo: '6x sem juros',               sub: 'No cartão de crédito' },
  { icon: BadgeCheck,  titulo: 'Qualidade comprovada',       sub: 'Direto da fábrica' },
  { icon: Headphones,  titulo: 'Suporte especializado',      sub: 'Seg–Sex 8h às 18h' },
] as const

export default function SelosConfianca({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {SELOS.map(({ icon: Icon, titulo, sub }) => (
        <div key={titulo} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-[#3cbfb3]/10 flex items-center justify-center">
            <Icon size={15} className="text-[#3cbfb3]" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-800 leading-tight">{titulo}</p>
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
