'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Props {
  categoria: string | null
  total: number
  loading: boolean
}

const META: Record<string, {
  emoji: string
  label: string
  desc: string
  from: string
  to: string
}> = {
  climatizadores: {
    emoji: '❄️',
    label: 'Climatizadores',
    desc: 'Refresque seu ambiente com tecnologia de ponta e eficiência energética.',
    from: '#0f2e2b',
    to: '#1a6b62',
  },
  aspiradores: {
    emoji: '🌪️',
    label: 'Aspiradores',
    desc: 'Limpeza profunda com sucção poderosa para todos os tipos de superfície.',
    from: '#0f2e2b',
    to: '#1a5246',
  },
  spinning: {
    emoji: '🚴',
    label: 'Spinning',
    desc: 'Equipamentos fitness profissionais para um treino de alto desempenho.',
    from: '#0f2e2b',
    to: '#0d3b58',
  },
}

export default function CategoriaBanner({ categoria, total, loading }: Props) {
  if (!categoria) return null

  const meta = META[categoria] ?? {
    emoji: '🛒',
    label: categoria.charAt(0).toUpperCase() + categoria.slice(1),
    desc: 'Explore os melhores produtos da Sixxis Store.',
    from: '#0f2e2b',
    to: '#1a4f4a',
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6 px-6 py-7 relative"
      style={{ background: `linear-gradient(135deg, ${meta.from} 0%, ${meta.to} 100%)` }}
    >
      {/* Background decoration */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none pointer-events-none">
        {meta.emoji}
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-white/50 mb-3">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link href="/produtos" className="hover:text-white transition-colors">Produtos</Link>
        <ChevronRight size={12} />
        <span className="text-white/80 font-semibold">{meta.label}</span>
      </nav>

      <div className="flex items-start gap-4">
        <span className="text-4xl leading-none">{meta.emoji}</span>
        <div>
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-1">{meta.label}</h1>
          <p className="text-white/60 text-sm max-w-md">{meta.desc}</p>
          {!loading && (
            <span className="inline-block mt-2 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
              {total} produto{total !== 1 ? 's' : ''} disponíve{total !== 1 ? 'is' : 'l'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
