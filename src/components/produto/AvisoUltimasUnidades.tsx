import { Flame } from 'lucide-react'
import { formatarAvisoUltimasUnidades, type SaldoLoteBF } from '../../lib/estoque-promocional-bf'

interface Props {
  saldo?: SaldoLoteBF | null
  variacoes?: Array<{ nome: string; estoquePromocional?: SaldoLoteBF | null }>
  modo?: 'card' | 'detalhe'
  className?: string
}

export default function AvisoUltimasUnidades({ saldo, variacoes, modo = 'detalhe', className = '' }: Props) {
  if (!saldo || saldo.restantes <= 0) return null

  const compacto = modo === 'card'
  const saldosPorVariacao = variacoes?.filter((variacao) =>
    (variacao.estoquePromocional?.restantes ?? 0) > 0,
  ) ?? []

  return (
    <div
      aria-live="polite"
      className={[
        'relative overflow-hidden rounded-lg border border-amber-300/80 bg-amber-50 text-amber-950',
        'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-amber-500',
        compacto ? 'px-2.5 py-2 pl-3.5' : 'px-3.5 py-3 pl-5',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span className={compacto
          ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white'
          : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white'}>
          <Flame size={compacto ? 13 : 16} strokeWidth={2.4} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={compacto
            ? 'text-[10px] font-black uppercase leading-3 tracking-[0.08em] text-amber-800'
            : 'text-[11px] font-black uppercase leading-4 tracking-[0.1em] text-amber-800'}>
            Lote promocional
          </p>
          <p className={compacto
            ? 'text-[11px] font-extrabold leading-4 tabular-nums'
            : 'text-sm font-extrabold leading-5 tabular-nums'}>
            {formatarAvisoUltimasUnidades(saldo.restantes)}
          </p>
          {saldosPorVariacao.length > 0 && (
            <p className={compacto
              ? 'mt-0.5 text-[10px] font-bold leading-3 text-amber-800 tabular-nums'
              : 'mt-1 text-xs font-bold leading-4 text-amber-800 tabular-nums'}>
              {saldosPorVariacao.map((variacao) =>
                `${variacao.nome}: ${variacao.estoquePromocional?.restantes}`,
              ).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
