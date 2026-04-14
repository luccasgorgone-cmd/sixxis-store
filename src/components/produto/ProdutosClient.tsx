'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import CardProduto from '@/components/produto/CardProduto'
import CategoriaBanner from '@/components/produtos/CategoriaBanner'
import SidebarFiltros from '@/components/produtos/SidebarFiltros'
import ToolbarProdutos from '@/components/produtos/ToolbarProdutos'
import type { Produto } from '@/types'

// ── Constantes ──────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { val: 'climatizadores', label: 'Climatizadores' },
  { val: 'aspiradores',    label: 'Aspiradores'    },
  { val: 'spinning',       label: 'Spinning'       },
]

const FAIXAS_PRECO = [
  { label: 'Até R$ 500',          min: 0,    max: 500    },
  { label: 'R$ 500 – R$ 1.000',   min: 500,  max: 1000   },
  { label: 'R$ 1.000 – R$ 2.000', min: 1000, max: 2000   },
  { label: 'R$ 2.000 – R$ 5.000', min: 2000, max: 5000   },
  { label: 'Acima de R$ 5.000',   min: 5000, max: 999999 },
]

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white/8 rounded-2xl animate-pulse overflow-hidden border border-white/5">
          <div className="bg-white/10 w-full" style={{ aspectRatio: '1/1' }} />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/10 rounded w-4/5" />
            <div className="h-3 bg-white/10 rounded w-3/5" />
            <div className="h-5 bg-white/10 rounded w-2/3 mt-2" />
            <div className="h-8 bg-white/10 rounded-xl mt-3" />
            <div className="h-7 bg-white/5 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProdutosClient() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [produtos,   setProdutos]   = useState<Produto[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [viewMode,   setViewMode]   = useState<'grid' | 'list'>('grid')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [contagens,  setContagens]  = useState<Record<string, number>>({})

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

  // ── fetch contagens ───────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/produtos/contagens')
      .then(r => r.json())
      .then(data => setContagens(data))
      .catch(() => {})
  }, [])

  // ── fetch produtos ────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (categoria)                        p.set('categoria', categoria)
    if (ordem && ordem !== 'relevancia') p.set('ordem', ordem)
    if (busca)                           p.set('q', busca)
    if (precoMin)                        p.set('precoMin', precoMin)
    if (precoMax)                        p.set('precoMax', precoMax)

    fetch(`/api/produtos?${p.toString()}`)
      .then(r => r.json())
      .then(data => {
        setProdutos(Array.isArray(data.produtos) ? data.produtos : [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      })
      .catch(() => setProdutos([]))
      .finally(() => setLoading(false))
  }, [categoria, ordem, busca, precoMin, precoMax])

  // ── derived ───────────────────────────────────────────────────────────────

  const activeFaixa = FAIXAS_PRECO.find(
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

  const categoriasComContagem = CATEGORIAS.map(c => ({
    ...c,
    count: contagens[c.val],
  }))

  // ── sidebar content ───────────────────────────────────────────────────────

  const sidebarContent = (
    <SidebarFiltros
      categorias={categoriasComContagem}
      faixas={FAIXAS_PRECO}
      categoria={categoria}
      precoMin={precoMin}
      precoMax={precoMax}
      onCategoria={val => setParam('categoria', val)}
      onFaixa={(min, max) => setParams([['precoMin', min], ['precoMax', max]])}
    />
  )

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <>
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          <div className="flex gap-6 lg:gap-8">

            {/* Sidebar desktop */}
            <aside className="w-56 shrink-0 hidden md:block">
              <div className="sticky top-24 bg-white/[0.06] border border-white/10 backdrop-blur-sm rounded-2xl p-5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">Filtros</p>
                {sidebarContent}
              </div>
            </aside>

            {/* Main content */}
            <section className="flex-1 min-w-0">

              {/* Categoria banner (only when a category is selected) */}
              <CategoriaBanner categoria={categoria} total={total} loading={loading} />

              {/* Toolbar */}
              <ToolbarProdutos
                titulo={titulo}
                total={total}
                loading={loading}
                ordem={ordem}
                viewMode={viewMode}
                activeFilters={activeFilters}
                onOrdem={val => setParam('ordem', val)}
                onViewMode={setViewMode}
                onOpenDrawer={() => setDrawerOpen(true)}
              />

              {/* Products */}
              {loading ? (
                <ProductSkeleton />
              ) : produtos.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/15 rounded-2xl bg-white/[0.02]">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Search size={28} className="text-white/20" />
                  </div>
                  <p className="text-white/60 font-semibold text-lg mb-1">Nenhum produto encontrado</p>
                  <p className="text-sm text-white/30 mb-6">Tente ajustar os filtros ou fazer uma nova busca.</p>
                  {activeFilters.length > 0 && (
                    <button
                      onClick={() => setParams([['categoria', ''], ['precoMin', ''], ['precoMax', ''], ['q', '']])}
                      className="inline-flex items-center gap-2 text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-semibold border border-[#3cbfb3]/40 rounded-xl px-5 py-2.5 hover:bg-[#3cbfb3]/10 transition"
                    >
                      <X size={14} />
                      Limpar filtros
                    </button>
                  )}
                  <Link
                    href="/produtos"
                    className="block mt-3 text-sm text-white/40 hover:text-white/60 transition"
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
            {activeFilters.length > 0 && (
              <span className="bg-[#3cbfb3] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
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
        {activeFilters.length > 0 && (
          <div className="p-5 border-t border-white/10">
            <button
              onClick={() => {
                setParams([['categoria', ''], ['precoMin', ''], ['precoMax', ''], ['q', '']])
                setDrawerOpen(false)
              }}
              className="w-full text-center text-sm text-white/50 hover:text-white transition font-medium"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>
    </>
  )
}
