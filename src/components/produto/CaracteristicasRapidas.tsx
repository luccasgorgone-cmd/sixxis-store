import { Settings2 } from 'lucide-react'

interface EspecificacaoRow {
  label: string
  valor: string
}

interface Props {
  especificacoes?: EspecificacaoRow[] | null
}

export default function CaracteristicasRapidas({ especificacoes }: Props) {
  if (!especificacoes || especificacoes.length === 0) return null

  // Pega as primeiras 8 specs para o bloco de características rápidas
  const caracs = especificacoes.slice(0, 8)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
      <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
        <Settings2 size={16} className="text-[#3cbfb3]" />
        Características do produto
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {caracs.map((c, i) => (
          <div
            key={c.label}
            className={`${i % 4 !== 3 && i !== caracs.length - 1 ? 'border-r border-gray-100 pr-4' : ''}`}
          >
            <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
            <p className="text-sm font-bold text-gray-900">{c.valor}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
