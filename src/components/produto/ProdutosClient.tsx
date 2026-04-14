'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import CardProduto from '@/components/produto/CardProduto'
import {
  ChevronRight, Grid3X3, List, SlidersHorizontal, X,
} from 'lucide-react'
import type { Produto } from '@/types'

// ── Constantes ──────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { val: 'climatizadores', label: 'Climatizadores' },
  { val: 'aspiradores',    label: 'Aspiradores'    },
  { val: 'spinning',       label: 'Spinning'       },
]

const ORDENS = [
  { val: 'relevancia', label: 'Relevância'    },
  { val: 'recentes',   label: 'Mais recentes' },
  { val: 'preco-asc',  label: 'Menor preço'   },
  { val: 'preco-desc', label: 'Maior preço'   },
  { val: 'nome',       label: 'A–Z'           },
]

const FAIXAS = [
  { label: 'Até R$ 500',          min: 0,    max: 500    },
  { label: 'R$ 500 – R$ 1.000',   min: 500,  max: 1000   },
  { label: 'R$ 1.000 – R$ 2.000', min: 1000, max: 2000   },
  { label: 'Acima de R$ 2.000',   min: 2000, max: 999999 },
]

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white/10 rounded-xl animate-pulse" style={{ aspectRatio: '3/4' }} />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProdutosClient() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const [produtos,     setProdutos]     = useState<Produto[]>([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid')
  const [drawerOpen,   setDrawerOpen]   = useState(false)

  const categoria = searchParams.get('categoria') || ''
  const ordem     = searchParams.get('ordem')     || 'relevancia'
  const busca     = searchParams.get('q')         || ''
  const precoMin  = searchParams.get('precoMin')  || ''
  const precoMax  = searchParams.get('precoMax')  || ''

  // ── helpers ──────────────────────────────────────────────────────────────

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (val) p.set(key, val)
    else     p.delete(key)
    router.push(`${pathname}?${p.toString()}`)
  }

  function setParams(pairs: [string, string][]) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [key, val] of pairs) {
      if (val) p.set(key, val)
      else     p.delete(key)
    }
    router.push(`${pathname}?${p.toString()}`)
  }

  // ── fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (categoria)                            p.set('categoria', categoria)
    if (ordem && ordem !== 'relevancia')     p.set('ordem', ordem)
    if (busca)                               p.set('q', busca)
    if (precoMin)                            p.set('precoMin', precoMin)
    if (precoMax)                            p.set('precoMax', precoMax)

    fetch(`/api/produtos?${p.toString()}`)
      .then(r => r.json())
      .then(data => {
        setProdutos(Array.isArray(data.produtos) ? data.produtos : [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      })
      .catch(() => setProdutos([]))
      .finally(() => setLoading(false))
  }, [categoria, ordem, busca, precoMin, precoMax])

  // ── derived state ─────────────────────────────────────────────────────────

  const activeFaixa = FAIXAS.find(
    f => String(f.min) === precoMin && String(f.max) === precoMax,
  )

  const activeFilters: { label: string; clear: () => void }[] = []
  if (categoria) activeFilters.push({
    label: CATEGORIAS.find(c => c.val === categoria)?.label ?? categoria,
    clear: () => setParam('categoria', ''),
  })
  if (activeFaixa) activeFilters.push({
    label: activeFaixa.label,
    clear: () => setParams([['precoMin', ''], ['precoMax', '']]),
  })
  if (busca) activeFilters.push({
    label: `"${busca}"`,
    clear: () => setParam('q', ''),
  })

  const categoriaLabel = categoria
    ? (CATEGORIAS.find(c => c.val === categoria)?.label ?? categoria)
    : null
  const titulo = busca ? `Resultados para "${busca}"` : categoriaLabel ?? 'Todos os Produtos'

  // ── sidebar content (shared by desktop + mobile drawer) ──────────────────

  const sidebarContent = (
    <div className="space-y-6">
      {/* Categorias */}
      <div>
        <p className="text-white font-bold text-sm pb-2 mb-3 border-b border-white/15">
          Categoria
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => setParam('categoria', '')}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                !categoria
                  ? 'bg-[#3cbfb3] text-white font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Todos
            </button>
          </li>
          {CATEGORIAS.map(c => (
            <li key={c.val}>
              <button
                onClick={() => setParam('categoria', c.val)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                  categoria === c.val
                    ? 'bg-[#3cbfb3] text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Faixa de preço */}
      <div>
        <p className="text-white font-bold text-sm pb-2 mb-3 border-b border-white/15">
          Faixa de Preço
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => setParams([['precoMin', ''], ['precoMax', '']])}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                !precoMin && !precoMax
                  ? 'bg-[#3cbfb3] text-white font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Todos os preços
            </button>
          </li>
          {FAIXAS.map(f => {
            const active = String(f.min) === precoMin && String(f.max) === precoMax
            return (
              <li key={f.label}>
                <button
                  onClick={() => setParams([['precoMin', String(f.min)], ['precoMax', String(f.max)]])}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                    active
                      ? 'bg-[#3cbfb3] text-white font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Ordenação */}
      <div>
        <p className="text-white font-bold text-sm pb-2 mb-3 border-b border-white/15">
          Ordenar por
        </p>
        <ul className="space-y-0.5">
          {ORDENS.map(o => (
            <li key={o.val}>
              <button
                onClick={() => setParam('ordem', o.val)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                  ordem === o.val
                    ? 'bg-[#3cbfb3] text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <>
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#3cbfb3] transition-colors">Home</Link>
            <ChevronRight size={12} />
            {categoriaLabel ? (
              <>
                <Link href="/produtos" className="hover:text-[#3cbfb3] transition-colors">Produtos</Link>
                <ChevronRight size={12} />
                <span className="text-[#3cbfb3] font-semibold">{categoriaLabel}</span>
              </>
            ) : (
              <span className="text-[#3cbfb3] font-semibold">{titulo}</span>
            )}
          </nav>

          <div className="flex gap-6 lg:gap-8">

            {/* Sidebar desktop */}
            <aside className="w-52 shrink-0 hidden md:block">
              <div className="sticky top-24 bg-white/[0.06] border border-white/10 backdrop-blur-sm rounded-2xl p-4">
                {sidebarContent}
              </div>
            </aside>

            {/* Main content */}
            <section className="flex-1 min-w-0">

              {/* Header row */}
              <div className="flex items-center justify-between mb-5 gap-3">
                <div>
                  <h1 className="text-xl font-extrabold text-white leading-tight">{titulo}</h1>
                  {!loading && (
                    <p className="text-xs text-white/50 mt-0.5">
                      {total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Mobile filter button */}
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="md:hidden flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
                  >
                    <SlidersHorizontal size={16} />
                    Filtros
                  </button>

                  {/* View toggle */}
                  <div className="flex bg-white/10 rounded-xl p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition ${
                        viewMode === 'grid' ? 'bg-[#3cbfb3] text-white' : 'text-white/50 hover:text-white'
                      }`}
                      aria-label="Visualização em grade"
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition ${
                        viewMode === 'list' ? 'bg-[#3cbfb3] text-white' : 'text-white/50 hover:text-white'
                      }`}
                      aria-label="Visualização em lista"
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active filter pills */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {activeFilters.map(f => (
                    <button
                      key={f.label}
                      onClick={f.clear}
                      className="flex items-center gap-1.5 bg-[#3cbfb3]/20 border border-[#3cbfb3]/40 text-[#3cbfb3] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#3cbfb3]/30 transition"
                    >
                      {f.label}
                      <X size={12} />
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              {loading ? (
                <ProductSkeleton />
              ) : produtos.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/20 rounded-2xl bg-white/[0.03]">
                  <p className="text-white/60 font-medium">Nenhum produto encontrado.</p>
                  <p className="text-sm text-white/40 mt-1">Tente outra categoria ou filtro.</p>
                  <Link
                    href="/produtos"
                    className="inline-block mt-4 text-sm text-[#3cbfb3] hover:underline font-medium"
                  >
                    Ver todos os produtos →
                  </Link>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
                </div>
              )}

            </section>
          </div>
        </div>
      </main>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] shadow-2xl transition-transform duration-300 md:hidden overflow-y-auto"
        style={{
          backgroundColor: '#1a4f4a',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0" style={{ backgroundColor: '#0f2e2b' }}>
          <p className="text-white font-bold text-base flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Filtros
          </p>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition"
            aria-label="Fechar filtros"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          {sidebarContent}
        </div>
      </div>
    </>
  )
}
