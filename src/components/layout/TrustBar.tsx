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
  // Mobile: 3 itens lado a lado (3 colunas); par = 2x2; outros ímpares empilham.
  const mobileCols = n === 3 ? 'grid-cols-3' : n % 2 === 0 ? 'grid-cols-2' : 'grid-cols-1'
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
                className={`flex flex-col items-center text-center justify-center gap-1.5 lg:flex-row lg:items-center lg:text-left lg:gap-3 py-2 px-1.5 md:px-3 hover:bg-white/5 transition-colors min-w-0 ${
                  i > 0 ? (escuro ? 'lg:border-l lg:border-white/15' : 'lg:border-l lg:border-gray-200') : ''
                }`}
              >
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 ${
                  escuro ? 'bg-white/10' : 'bg-[#e8f8f7]'
                }`}>
                  <Icon className="w-4 h-4 md:w-[18px] md:h-[18px] text-[#3cbfb3]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-bold leading-tight ${
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
