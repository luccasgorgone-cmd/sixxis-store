import { Truck, ShieldCheck, CreditCard } from 'lucide-react'
import { MAX_PARCELAS_SEM_JUROS } from '@/lib/parcelamento'

const ICONS = [Truck, ShieldCheck, CreditCard] as const

interface TrustItem {
  titulo: string
  sub: string
}

const DEFAULT_ITEMS: TrustItem[] = [
  { titulo: 'Entrega para todo o Brasil', sub: 'Despacho em 24h' },
  { titulo: 'Compra 100% Segura',         sub: 'Seus dados protegidos' },
  { titulo: `${MAX_PARCELAS_SEM_JUROS}x sem juros no cartão`, sub: 'Débito, crédito e PIX' },
]

interface Props {
  items?: TrustItem[]
  transparent?: boolean
  /** Fundo verde-escuro sólido (#0f2e2b) com texto branco — usado na home. */
  fundoVerde?: boolean
}

const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

export default function TrustBar({ items = DEFAULT_ITEMS, transparent = false, fundoVerde = false }: Props) {
  const n = items.length
  // `escuro` = texto/bordas claros (sobre fundo escuro: verde sólido ou transparente).
  const escuro = transparent || fundoVerde
  // No mobile, nº ímpar de itens fica numa única coluna empilhada (evita item
  // órfão no grid 2-col); nº par mantém 2x2. No desktop, uma coluna por item.
  const mobileCols = n % 2 === 0 ? 'grid-cols-2' : 'grid-cols-1'
  const lgCols = LG_COLS[n] ?? 'lg:grid-cols-4'
  return (
    <div
      className={`w-full py-3.5 ${
        fundoVerde
          ? 'border-t border-b border-white/10'
          : transparent
          ? 'bg-transparent border-t border-b border-white/15'
          : 'bg-white border-t border-b border-gray-100'
      }`}
      style={fundoVerde ? { backgroundColor: '#0f2e2b' } : undefined}
    >
      {/* Grid responsivo por quantidade: empilha no mobile se ímpar, 2x2 se par;
          uma coluna por item no desktop (divisores verticais). */}
      <div className="max-w-3xl lg:max-w-7xl mx-auto px-4">
        <div className={`grid ${mobileCols} ${lgCols} gap-2 md:gap-4 lg:gap-0`}>
          {items.map(({ titulo, sub }, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div
                key={titulo}
                className={`flex items-center justify-start lg:justify-center gap-2 md:gap-3 py-1 px-2 md:px-3 hover:bg-white/5 transition-colors min-w-0 ${
                  i > 0 ? (escuro ? 'lg:border-l lg:border-white/15' : 'lg:border-l lg:border-gray-200') : ''
                }`}
              >
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${
                  escuro ? 'bg-white/10' : 'bg-[#e8f8f7]'
                }`}>
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3cbfb3]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] md:text-xs lg:text-sm font-bold leading-tight ${
                    escuro ? 'text-white' : 'text-gray-900'
                  }`}>
                    {titulo}
                  </p>
                  <p className={`hidden sm:block text-[11px] leading-tight truncate mt-0.5 ${
                    escuro ? 'text-white/65' : 'text-gray-500'
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
