'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, SlidersHorizontal, X, Search, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import SubcategoriasCarrossel from '@/components/produtos/SubcategoriasCarrossel'
import SidebarFiltrosCB from '@/components/produtos/SidebarFiltrosCB'
import type { Produto } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, string> = {
  climatizadores: 'Climatizadores',
  aspiradores: 'Aspiradores',
  spinning: 'Spinning',
}

const ORDENS = [
  { val: 'relevancia', label: 'Popularidade' },
  { val: 'vendidos',   label: 'Mais vendidos' },
  { val: 'preco-asc',  label: 'Menor preço' },
  { val: 'preco-desc', label: 'Maior preço' },
]

const LIMIT = 12

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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

function Paginacao({ pagina, total, limit, onChange }: { pagina: number; total: number; limit: number; onChange: (p: number) => void }) {
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
        <ChevronRightIcon size={16} className="text-gray-600" />
      </button>

      <span className="text-sm text-gray-500 ml-2">
        Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
      </span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProdutosClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pagina, setPagina] = useState(1)

  const categoria = searchParams.get('categoria') || ''
  const ordem = searchParams.get('ordem') || 'relevancia'
  const busca = searchParams.get('q') || ''
  const precoMin = searchParams.get('precoMin') || ''
  const precoMax = searchParams.get('precoMax') || ''

  // Reset pagina when filters change
  useEffect(() => { setPagina(1) }, [categoria, ordem, busca, precoMin, precoMax])

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (val) p.set(key, val); else p.delete(key)
    router.push(`${pathname}?${p.toString()}`)
  }

  function setParams(pairs: [string, string][]) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [key, val] of pairs) {
      if (val) p.set(key, val); else p.delete(key)
    }
    router.push(`${pathname}?${p.toString()}`)
  }

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (categoria) p.set('categoria', categoria)
    if (ordem && ordem !== 'relevancia') p.set('ordem', ordem)
    if (busca) p.set('q', busca)
    if (precoMin) p.set('precoMin', precoMin)
    if (precoMax) p.set('precoMax', precoMax)
    p.set('page', String(pagina))
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

  const filtrosAtivos = [
    categoria ? 1 : 0,
    (precoMin || precoMax) ? 1 : 0,
    busca ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const sidebarEl = (
    <SidebarFiltrosCB
      categoria={categoria}
      precoMin={precoMin}
      precoMax={precoMax}
      onFaixa={(min, max) => setParams([['precoMin', min], ['precoMax', max]])}
    />
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 border-b border-gray-100 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-gray-700 transition">Início</Link>
            {categoriaLabel ? (
              <>
                <ChevronRight size={13} className="text-gray-300" />
                <Link href="/produtos" className="hover:text-gray-700 transition">Produtos</Link>
                <ChevronRight size={13} className="text-gray-300" />
                <span className="text-gray-800 font-medium">{categoriaLabel}</span>
              </>
            ) : (
              <>
                <ChevronRight size={13} className="text-gray-300" />
                <span className="text-gray-800 font-medium">Todos os Produtos</span>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Subcategorias carrossel */}
      <SubcategoriasCarrossel categoria={categoria} />

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-7">
          {/* Sidebar */}
          {sidebarEl}

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">{titulo}</h1>
                {!loading && (
                  <p className="text-gray-500 text-sm mt-0.5">
                    <span className="font-bold text-gray-800">{total}</span> produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Sort buttons (desktop) */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-sm text-gray-500">Ordenar por</span>
                  {ORDENS.map(op => (
                    <button
                      key={op.val}
                      onClick={() => setParam('ordem', op.val)}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl border transition whitespace-nowrap ${
                        ordem === op.val
                          ? 'bg-[#0f2e2b] text-white border-[#0f2e2b]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#3cbfb3] hover:text-[#3cbfb3]'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {/* Sort select (mobile) */}
                <select
                  value={ordem}
                  onChange={e => setParam('ordem', e.target.value)}
                  className="sm:hidden border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
                >
                  {ORDENS.map(op => <option key={op.val} value={op.val}>{op.label}</option>)}
                </select>

                {/* Filter button (mobile) */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl hover:border-[#3cbfb3] transition"
                >
                  <SlidersHorizontal size={15} />
                  Filtrar
                  {filtrosAtivos > 0 && (
                    <span className="w-4 h-4 bg-[#3cbfb3] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {filtrosAtivos}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Active filter pills */}
            {filtrosAtivos > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {categoria && (
                  <button onClick={() => setParam('categoria', '')}
                    className="flex items-center gap-1.5 bg-[#3cbfb3]/10 border border-[#3cbfb3]/30 text-[#3cbfb3] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#3cbfb3]/20 transition">
                    {CATEGORIAS[categoria] ?? categoria} <X size={11} />
                  </button>
                )}
                {(precoMin || precoMax) && (
                  <button onClick={() => setParams([['precoMin', ''], ['precoMax', '']])}
                    className="flex items-center gap-1.5 bg-[#3cbfb3]/10 border border-[#3cbfb3]/30 text-[#3cbfb3] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#3cbfb3]/20 transition">
                    Faixa de preço <X size={11} />
                  </button>
                )}
                {busca && (
                  <button onClick={() => setParam('q', '')}
                    className="flex items-center gap-1.5 bg-[#3cbfb3]/10 border border-[#3cbfb3]/30 text-[#3cbfb3] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#3cbfb3]/20 transition">
                    &quot;{busca}&quot; <X size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Products grid */}
            {loading ? (
              <ProductSkeleton />
            ) : produtos.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Search size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold text-lg mb-1">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-400 mb-6">Tente ajustar os filtros ou fazer outra busca.</p>
                <Link href="/produtos"
                  className="inline-flex items-center gap-2 text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-semibold border border-[#3cbfb3]/40 rounded-xl px-5 py-2.5 hover:bg-[#3cbfb3]/5 transition">
                  Ver todos os produtos →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
              </div>
            )}

            {/* Pagination */}
            <Paginacao
              pagina={pagina}
              total={total}
              limit={LIMIT}
              onChange={p => { setPagina(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          </main>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 lg:hidden overflow-y-auto"
        style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-gray-900 font-bold text-base flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-[#3cbfb3]" />
            Filtros
          </p>
          <button onClick={() => setDrawerOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{sidebarEl}</div>
      </div>
    </div>
  )
}
