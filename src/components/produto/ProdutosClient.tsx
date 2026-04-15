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

const GRUPOS_GERAL: GrupoFiltro[] = [
  {
    id: 'categoria', label: 'Categoria', multiple: false,
    opcoes: [
      { label: 'Climatizadores', valor: 'climatizadores' },
      { label: 'Aspiradores',    valor: 'aspiradores'    },
      { label: 'Spinning',       valor: 'spinning'       },
    ],
  },
  {
    id: 'preco', label: 'Preço', multiple: false,
    opcoes: [
      { label: 'Até R$ 500',          valor: 'ate500'       },
      { label: 'R$ 500 a R$ 1.500',   valor: '500-1500'     },
      { label: 'Acima de R$ 1.500',   valor: 'mais1500'     },
    ],
  },
]

const GRUPOS_CLIMATIZADORES: GrupoFiltro[] = [
  {
    id: 'voltagem', label: 'Voltagem', multiple: false,
    opcoes: [
      { label: '110V',   valor: '110V'   },
      { label: '220V',   valor: '220V'   },
      { label: 'Bivolt', valor: 'bivolt' },
    ],
  },
  {
    id: 'capacidade', label: 'Capacidade', multiple: false,
    opcoes: [
      { label: 'Até 20L',       valor: 'ate20'    },
      { label: '20 a 40L',      valor: '20-40'    },
      { label: '40 a 60L',      valor: '40-60'    },
      { label: 'Acima de 60L',  valor: 'mais60'   },
    ],
  },
  {
    id: 'cobertura', label: 'Cobertura (m²)', multiple: false,
    opcoes: [
      { label: 'Até 15m²',        valor: 'ate15'    },
      { label: '15 a 25m²',       valor: '15-25'    },
      { label: '25 a 40m²',       valor: '25-40'    },
      { label: 'Acima de 40m²',   valor: 'mais40'   },
    ],
  },
  {
    id: 'vazao', label: 'Vazão de Ar', multiple: false,
    opcoes: [
      { label: 'Até 500 m³/h',        valor: 'ate500'    },
      { label: '500 a 1000 m³/h',     valor: '500-1000'  },
      { label: 'Acima de 1000 m³/h',  valor: 'mais1000'  },
    ],
  },
  {
    id: 'velocidades', label: 'Velocidades', multiple: false,
    opcoes: [
      { label: '2 velocidades',  valor: '2vel'  },
      { label: '3 velocidades',  valor: '3vel'  },
      { label: '4+ velocidades', valor: '4vel'  },
    ],
  },
  {
    id: 'preco', label: 'Preço', multiple: false,
    opcoes: [
      { label: 'Até R$ 800',             valor: 'ate800'    },
      { label: 'R$ 800 a R$ 1.500',      valor: '800-1500'  },
      { label: 'R$ 1.500 a R$ 2.500',    valor: '1500-2500' },
      { label: 'Acima de R$ 2.500',      valor: 'mais2500'  },
    ],
  },
]

const GRUPOS_ASPIRADORES: GrupoFiltro[] = [
  {
    id: 'tipo', label: 'Tipo', multiple: false,
    opcoes: [
      { label: 'Sem fio',  valor: 'sem-fio'  },
      { label: 'Com fio',  valor: 'com-fio'  },
      { label: 'Robô',     valor: 'robo'     },
      { label: 'Multiuso', valor: 'multiuso' },
    ],
  },
  {
    id: 'voltagem', label: 'Voltagem', multiple: false,
    opcoes: [
      { label: '110V',    valor: '110V'    },
      { label: '220V',    valor: '220V'    },
      { label: 'Bivolt',  valor: 'bivolt'  },
      { label: 'Bateria', valor: 'bateria' },
    ],
  },
  {
    id: 'potencia', label: 'Potência', multiple: false,
    opcoes: [
      { label: 'Até 1000W',       valor: 'ate1000'   },
      { label: '1000 a 1500W',    valor: '1000-1500' },
      { label: 'Acima de 1500W',  valor: 'mais1500'  },
    ],
  },
  {
    id: 'reservatorio', label: 'Reservatório', multiple: false,
    opcoes: [
      { label: 'Até 1L',     valor: 'ate1'   },
      { label: '1L a 2L',    valor: '1-2'    },
      { label: 'Acima de 2L', valor: 'mais2' },
    ],
  },
  {
    id: 'preco', label: 'Preço', multiple: false,
    opcoes: [
      { label: 'Até R$ 300',          valor: 'ate300'   },
      { label: 'R$ 300 a R$ 600',     valor: '300-600'  },
      { label: 'R$ 600 a R$ 1.000',   valor: '600-1000' },
      { label: 'Acima de R$ 1.000',   valor: 'mais1000' },
    ],
  },
]

const GRUPOS_SPINNING: GrupoFiltro[] = [
  {
    id: 'tipo', label: 'Tipo', multiple: false,
    opcoes: [
      { label: 'Bike Spinning',    valor: 'spinning'    },
      { label: 'Bike Ergométrica', valor: 'ergometrica' },
      { label: 'Elíptico',         valor: 'eliptico'    },
    ],
  },
  {
    id: 'resistencia', label: 'Resistência', multiple: false,
    opcoes: [
      { label: 'Magnética',       valor: 'magnetica'       },
      { label: 'Por Atrito',      valor: 'atrito'          },
      { label: 'Eletromagnética', valor: 'eletromagnetica' },
    ],
  },
  {
    id: 'peso_max', label: 'Peso Suportado', multiple: false,
    opcoes: [
      { label: 'Até 100kg',       valor: 'ate100'   },
      { label: '100 a 120kg',     valor: '100-120'  },
      { label: 'Acima de 120kg',  valor: 'mais120'  },
    ],
  },
  {
    id: 'preco', label: 'Preço', multiple: false,
    opcoes: [
      { label: 'Até R$ 800',          valor: 'ate800'    },
      { label: 'R$ 800 a R$ 1.500',   valor: '800-1500'  },
      { label: 'R$ 1.500 a R$ 2.500', valor: '1500-2500' },
      { label: 'Acima de R$ 2.500',   valor: 'mais2500'  },
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
    : GRUPOS_GERAL

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
