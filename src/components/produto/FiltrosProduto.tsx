'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const categorias = [
  { label: 'Todos',          value: '' },
  { label: 'Climatizadores', value: 'climatizadores' },
  { label: 'Aspiradores',    value: 'aspiradores' },
  { label: 'Spinning',       value: 'spinning' },
]

export default function FiltrosProduto() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoriaAtual = searchParams.get('categoria') ?? ''

  function filtrar(categoria: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (categoria) {
      params.set('categoria', categoria)
    } else {
      params.delete('categoria')
    }
    router.push(`/produtos?${params.toString()}`)
  }

  return (
    <div className="bg-sx-surface border border-sx-line rounded-xl p-5">
      <p className="font-bold text-sm text-[#0a0a0a] mb-4 uppercase tracking-wide">Categoria</p>
      <ul className="space-y-1">
        {categorias.map(({ label, value }) => (
          <li key={value}>
            <button
              onClick={() => filtrar(value)}
              className={`text-sm w-full text-left px-3 py-2 rounded-lg transition ${
                categoriaAtual === value
                  ? 'bg-sx-accent text-sx-ink font-semibold'
                  : 'hover:bg-sx-accent/10 text-sx-text-2 hover:text-sx-accent-text'
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
