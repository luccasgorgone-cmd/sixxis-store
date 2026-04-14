'use client'

import { X, SlidersHorizontal, Grid3X3, List, ChevronDown } from 'lucide-react'

interface ActiveFilter {
  label: string
  clear: () => void
}

interface Props {
  titulo: string
  total: number
  loading: boolean
  ordem: string
  viewMode: 'grid' | 'list'
  activeFilters: ActiveFilter[]
  onOrdem: (val: string) => void
  onViewMode: (val: 'grid' | 'list') => void
  onOpenDrawer: () => void
}

const ORDENS = [
  { val: 'relevancia', label: 'Relevância' },
  { val: 'vendidos',   label: 'Mais vendidos' },
  { val: 'recentes',   label: 'Mais recentes' },
  { val: 'preco-asc',  label: 'Menor preço' },
  { val: 'preco-desc', label: 'Maior preço' },
  { val: 'nome',       label: 'A–Z' },
]

export default function ToolbarProdutos({
  titulo,
  total,
  loading,
  ordem,
  viewMode,
  activeFilters,
  onOrdem,
  onViewMode,
  onOpenDrawer,
}: Props) {
  return (
    <div className="mb-5">
      {/* Top row: title + controls */}
      <div className="flex items-center justify-between gap-3 mb-3">
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
            onClick={onOpenDrawer}
            className="md:hidden flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <SlidersHorizontal size={16} />
            Filtros
            {activeFilters.length > 0 && (
              <span className="bg-[#3cbfb3] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Sort select */}
          <div className="relative hidden sm:block">
            <select
              value={ordem}
              onChange={e => onOrdem(e.target.value)}
              className="appearance-none bg-white/10 border border-white/20 text-white text-sm font-semibold pl-3 pr-8 py-2 rounded-xl focus:outline-none focus:border-[#3cbfb3] cursor-pointer transition hover:bg-white/15"
            >
              {ORDENS.map(o => (
                <option key={o.val} value={o.val} className="bg-[#0f2e2b] text-white">
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex bg-white/10 rounded-xl p-0.5">
            <button
              onClick={() => onViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-[#3cbfb3] text-white' : 'text-white/50 hover:text-white'
              }`}
              aria-label="Grade"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => onViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list' ? 'bg-[#3cbfb3] text-white' : 'text-white/50 hover:text-white'
              }`}
              aria-label="Lista"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sort */}
      <div className="sm:hidden mb-3 relative">
        <select
          value={ordem}
          onChange={e => onOrdem(e.target.value)}
          className="w-full appearance-none bg-white/10 border border-white/20 text-white text-sm font-semibold pl-3 pr-8 py-2 rounded-xl focus:outline-none"
        >
          {ORDENS.map(o => (
            <option key={o.val} value={o.val} className="bg-[#0f2e2b] text-white">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(f => (
            <button
              key={f.label}
              onClick={f.clear}
              className="flex items-center gap-1.5 bg-[#3cbfb3]/20 border border-[#3cbfb3]/40 text-[#3cbfb3] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#3cbfb3]/30 transition"
            >
              {f.label}
              <X size={11} />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={() => activeFilters.forEach(f => f.clear())}
              className="flex items-center gap-1.5 bg-white/5 border border-white/15 text-white/50 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-white/10 transition"
            >
              Limpar todos
            </button>
          )}
        </div>
      )}
    </div>
  )
}
