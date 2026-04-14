'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import FiltrosHorizontais from '@/components/produtos/FiltrosHorizontais'
import Breadcrumb from '@/components/ui/Breadcrumb'
import type { GrupoFiltro } from '@/components/produtos/FiltrosHorizontais'
import type { Produto } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, string> = {
  climatizadores: 'Climatizadores',
  aspiradores: 'Aspiradores',
  spinning: 'Spinning',
}

const LIMIT = 12

// ── Grupos de filtro por categoria ────────────────────────────────────────────

const GRUPOS_CLIMATIZADORES: GrupoFiltro[] = [
  {
    id: 'voltagem', label: 'Voltagem', multiple: false,
    opcoes: [{ label: '110V', valor: '110V' }, { label: '220V', valor: '220V' }],
  },
  {
    id: 'potencia', label: 'Potência', multiple: false,
    opcoes: [
      { label: 'Até 150W',     valor: 'ate150'  },
      { label: '150W – 250W',  valor: '150-250' },
      { label: 'Acima 250W',   valor: 'mais250' },
    ],
  },
  {
    id: 'litragem', label: 'Tanque', multiple: false,
    opcoes: [
      { label: 'Até 20L',    valor: 'ate20'  },
      { label: '20L – 45L',  valor: '20-45'  },
      { label: 'Acima 45L',  valor: 'mais45' },
    ],
  },
  {
    id: 'desconto', label: 'Desconto', multiple: false,
    opcoes: [
      { label: '10% ou mais', valor: '10' },
      { label: '20% ou mais', valor: '20' },
      { label: '30% ou mais', valor: '30' },
    ],
  },
]

const GRUPOS_ASPIRADORES: GrupoFiltro[] = [
  {
    id: 'voltagem', label: 'Voltagem', multiple: false,
    opcoes: [{ label: 'Bivolt', valor: 'bivolt' }],
  },
]

const GRUPOS_SPINNING: GrupoFiltro[] = [
  {
    id: 'voltagem', label: 'Alimentação', multiple: false,
    opcoes: [
      { label: 'Bivolt',   valor: 'bivolt'   },
      { label: 'Bateria',  valor: 'bateria'  },
    ],
  },
]

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse bg-white">
          <div className="bg-gray-100 w-full" style={{ aspectRatio: '1/1' }} />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-4/5" />
            <div className="h-3 bg-gray-100 rounded w-3/5" />
            <div className="h-5 bg-gray-100 rounded w-2/3 mt-2" />
            <div className="h-9 bg-gray-100 rounded-xl mt-3" />
            <div className="h-8 bg-gray-50 rounded-xl border border-gray-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Paginacao({ pagina, total, limit, onChange }: {
  pagina: number; total: number; limit: number; onChange: (p: number) => void
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / limit))
  if (totalPaginas <= 1) return null

  const pages = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 2)

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, pagina - 1))}
        disabled={pagina === 1}
        className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-[#3cbfb3] disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={16} className="text-gray-600" />
      </button>

      {pages.map((p, idx, arr) => (
        <span key={p} className="flex items-center gap-1.5">
          {idx > 0 && arr[idx - 1] !== p - 1 && (
            <span className="text-gray-400 text-sm px-1">...</span>
          )}
          <button
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold border transition ${
              p === pagina
                ? 'bg-[#0f2e2b] text-white border-[#0f2e2b]'
                : 'border-gray-200 text-gray-600 hover:border-[#3cbfb3] hover:text-[#3cbfb3]'
            }`}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        onClick={() => onChange(Math.min(totalPaginas, pagina + 1))}
        disabled={pagina === totalPaginas}
        className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-[#3cbfb3] disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={16} className="text-gray-600" />
      </button>

      <span className="text-sm text-gray-500 ml-2">
        Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
      </span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProdutosClient() {
  const searchParams = useSearchParams()

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)

  const categoria = searchParams.get('categoria') || ''
  const ordem     = searchParams.get('ordem')     || ''
  const busca     = searchParams.get('q')         || ''
  const precoMin  = searchParams.get('precoMin')  || ''
  const precoMax  = searchParams.get('precoMax')  || ''

  useEffect(() => { setPagina(1) }, [categoria, ordem, busca, precoMin, precoMax])

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (categoria) p.set('categoria', categoria)
    if (ordem)     p.set('ordem', ordem)
    if (busca)     p.set('q', busca)
    if (precoMin)  p.set('precoMin', precoMin)
    if (precoMax)  p.set('precoMax', precoMax)
    p.set('page',  String(pagina))
    p.set('limit', String(LIMIT))

    fetch(`/api/produtos?${p.toString()}`)
      .then(r => r.json())
      .then(data => {
        setProdutos(Array.isArray(data.produtos) ? data.produtos : [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      })
      .catch(() => setProdutos([]))
      .finally(() => setLoading(false))
  }, [categoria, ordem, busca, precoMin, precoMax, pagina])

  const categoriaLabel = categoria ? (CATEGORIAS[categoria] ?? categoria) : null
  const titulo = busca ? `Resultados para "${busca}"` : categoriaLabel ?? 'Todos os Produtos'

  const grupos = categoria === 'climatizadores' ? GRUPOS_CLIMATIZADORES
    : categoria === 'aspiradores' ? GRUPOS_ASPIRADORES
    : categoria === 'spinning'    ? GRUPOS_SPINNING
    : []

  const breadcrumbItems = categoriaLabel
    ? [{ label: 'Início', href: '/' }, { label: 'Produtos', href: '/produtos' }, { label: categoriaLabel }]
    : [{ label: 'Início', href: '/' }, { label: 'Produtos' }]

  // href sem parâmetro q para o pill de busca
  const semQ = new URLSearchParams(searchParams.toString())
  semQ.delete('q')
  const searchPillHref = `/produtos?${semQ.toString()}`

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={breadcrumbItems} />
      <FiltrosHorizontais grupos={grupos} total={total} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Título + pill de busca */}
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{titulo}</h1>
            {!loading && (
              <p className="text-gray-500 text-sm mt-0.5">
                <span className="font-bold text-gray-800">{total}</span>{' '}
                produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {busca && (
            <Link
              href={searchPillHref}
              className="flex items-center gap-1.5 bg-[#3cbfb3]/10 border border-[#3cbfb3]/30 text-[#3cbfb3] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#3cbfb3]/20 transition"
            >
              &quot;{busca}&quot; <X size={11} />
            </Link>
          )}
        </div>

        {/* Grid de produtos */}
        {loading ? (
          <ProductSkeleton />
        ) : produtos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold text-lg mb-1">Nenhum produto encontrado</p>
            <p className="text-sm text-gray-400 mb-6">Tente ajustar os filtros ou fazer outra busca.</p>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-semibold border border-[#3cbfb3]/40 rounded-xl px-5 py-2.5 hover:bg-[#3cbfb3]/5 transition"
            >
              Ver todos os produtos →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
          </div>
        )}

        <Paginacao
          pagina={pagina}
          total={total}
          limit={LIMIT}
          onChange={p => { setPagina(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        />
      </div>
    </div>
  )
}
