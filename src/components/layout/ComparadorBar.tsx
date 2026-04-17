'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GitCompare, X } from 'lucide-react'
import { useComparador } from '@/hooks/useListas'

interface ProdutoInfo {
  id: string
  nome: string
  imagens: unknown
}

export default function ComparadorBar() {
  const ids = useComparador((s) => s.ids)
  const remover = useComparador((s) => s.remover)
  const limpar = useComparador((s) => s.limpar)
  const [produtos, setProdutos] = useState<ProdutoInfo[]>([])

  useEffect(() => {
    if (ids.length < 2) { setProdutos([]); return }
    fetch(`/api/produtos/por-ids?ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((data) => setProdutos(Array.isArray(data?.produtos) ? data.produtos : []))
      .catch(() => setProdutos([]))
  }, [ids])

  if (ids.length < 2) return null

  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 shrink-0">
          <GitCompare size={16} className="text-[#3cbfb3]" />
          Comparando {ids.length} {ids.length === 1 ? 'produto' : 'produtos'}
        </div>
        <div className="flex gap-2 flex-1 min-w-0 overflow-x-auto">
          {produtos.map((p) => {
            const imagens = Array.isArray(p.imagens) ? (p.imagens as string[]) : []
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-2.5 py-1.5 shrink-0 max-w-[220px]"
              >
                {imagens[0] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imagens[0]} alt={p.nome} className="w-6 h-6 rounded object-contain bg-white shrink-0" />
                )}
                <span className="text-xs text-gray-700 truncate">{p.nome}</span>
                <button
                  onClick={() => remover(p.id)}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label={`Remover ${p.nome} da comparação`}
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
        <Link
          href={`/comparar?ids=${ids.join(',')}`}
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          Comparar agora
        </Link>
        <button
          onClick={limpar}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 shrink-0"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}
