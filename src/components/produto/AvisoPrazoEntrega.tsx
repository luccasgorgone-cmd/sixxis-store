import { CalendarClock } from 'lucide-react'
import type { AvisoEntregaProduto } from '../../lib/produto-disponibilidade'

interface Props {
  aviso?: AvisoEntregaProduto | null
  modo?: 'card' | 'detalhe'
  className?: string
}

export default function AvisoPrazoEntrega({ aviso, modo = 'detalhe', className = '' }: Props) {
  if (!aviso) return null

  const compacto = modo === 'card'

  return (
    <div className={[
      'rounded-lg border border-sx-accent/35 bg-sx-tint text-sx-text',
      compacto ? 'px-2.5 py-2' : 'px-3.5 py-3',
      className,
    ].join(' ')}>
      <div className="flex items-center gap-2.5">
        <span className={compacto
          ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sx-accent text-sx-ink'
          : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sx-accent text-sx-ink'}>
          <CalendarClock size={compacto ? 13 : 16} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={compacto
            ? 'text-[10px] font-black uppercase leading-3 tracking-[0.08em] text-sx-accent-text'
            : 'text-[11px] font-black uppercase leading-4 tracking-[0.1em] text-sx-accent-text'}>
            {aviso.titulo}
          </p>
          <p className={compacto
            ? 'text-[11px] font-extrabold leading-4 tabular-nums'
            : 'text-sm font-extrabold leading-5 tabular-nums'}>
            {aviso.mensagem}
          </p>
        </div>
      </div>
    </div>
  )
}
