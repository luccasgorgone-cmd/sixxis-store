'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, SlidersHorizontal, Check } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface OpcaoFiltro {
  label: string
  valor: string
}

export interface GrupoFiltro {
  id: string
  label: string
  opcoes: OpcaoFiltro[]
  multiple?: boolean
}

interface Props {
  grupos: GrupoFiltro[]
  total: number
}

// ─── Dropdown individual (com createPortal) ───────────────────────────────────

function FiltroDropdown({
  grupo,
  valoresSelecionados,
  onChange,
}: {
  grupo: GrupoFiltro
  valoresSelecionados: string[]
  onChange: (id: string, valores: string[]) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const temSelecionado = valoresSelecionados.length > 0

  useEffect(() => { setMounted(true) }, [])

  const calcPos = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top:  rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 204),
    })
  }, [])

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!aberto) return
    calcPos()
    window.addEventListener('scroll', calcPos, { passive: true })
    window.addEventListener('resize', calcPos, { passive: true })
    return () => {
      window.removeEventListener('scroll', calcPos)
      window.removeEventListener('resize', calcPos)
    }
  }, [aberto, calcPos])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function toggle(valor: string) {
    if (grupo.multiple) {
      const novo = valoresSelecionados.includes(valor)
        ? valoresSelecionados.filter(v => v !== valor)
        : [...valoresSelecionados, valor]
      onChange(grupo.id, novo)
    } else {
      onChange(grupo.id, valoresSelecionados[0] === valor ? [] : [valor])
      setAberto(false)
    }
  }

  function handleBtnClick() {
    if (aberto) {
      setAberto(false)
    } else {
      calcPos()
      setAberto(true)
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleBtnClick}
        className={[
          'flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap shrink-0',
          temSelecionado
            ? 'bg-[#0f2e2b] border-[#0f2e2b] text-white'
            : aberto
              ? 'bg-gray-50 border-gray-300 text-gray-900'
              : 'bg-white border-gray-200 text-gray-700 hover:border-[#3cbfb3] hover:text-[#3cbfb3]',
        ].join(' ')}
      >
        {grupo.label}
        {temSelecionado && (
          <span className="bg-white/25 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {valoresSelecionados.length}
          </span>
        )}
        <ChevronDown
          size={13}
          style={{ transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        />
      </button>

      {/* Dropdown via createPortal — escapa do overflow-x-auto */}
      {mounted && aberto && pos && createPortal(
        <>
          {/* Overlay transparente — fecha ao clicar fora */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setAberto(false)}
          />

          {/* Dropdown */}
          <div
            className="fixed bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
            style={{
              top:      pos.top,
              left:     pos.left,
              minWidth: '180px',
              zIndex:   9999,
            }}
          >
            <div className="p-1.5">
              {grupo.opcoes.map(op => {
                const selecionado = valoresSelecionados.includes(op.valor)
                return (
                  <button
                    key={op.valor}
                    onClick={() => toggle(op.valor)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors
                      ${selecionado
                        ? 'bg-[#3cbfb3]/10 text-[#3cbfb3] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {selecionado
                      ? <Check size={13} className="shrink-0 text-[#3cbfb3]" />
                      : <span className="w-[13px] shrink-0" />
                    }
                    {op.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

// ─── Principal ────────────────────────────────────────────────────────────────

export default function FiltrosHorizontais({ grupos, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filtros, setFiltros] = useState<Record<string, string[]>>(() => {
    const state: Record<string, string[]> = {}
    grupos.forEach(g => {
      const val = searchParams.get(g.id)
      state[g.id] = val ? val.split(',') : []
    })
    return state
  })

  const [ordem, setOrdem] = useState(searchParams.get('ordem') || '')

  // Sync when grupos or searchParams change
  useEffect(() => {
    const state: Record<string, string[]> = {}
    grupos.forEach(g => {
      const val = searchParams.get(g.id)
      state[g.id] = val ? val.split(',') : []
    })
    setFiltros(state)
    setOrdem(searchParams.get('ordem') || '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, grupos.length])

  const totalAtivos = Object.values(filtros).flat().length

  const aplicar = (novosFiltros: Record<string, string[]>, novaOrdem?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    grupos.forEach(g => params.delete(g.id))

    Object.entries(novosFiltros).forEach(([k, vals]) => {
      if (vals.length) params.set(k, vals.join(','))
    })

    const ord = novaOrdem !== undefined ? novaOrdem : ordem
    if (ord) params.set('ordem', ord)
    else params.delete('ordem')

    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleFiltroChange = (id: string, valores: string[]) => {
    const novos = { ...filtros, [id]: valores }
    setFiltros(novos)
    aplicar(novos)
  }

  const limparTudo = () => {
    const zerado: Record<string, string[]> = {}
    grupos.forEach(g => { zerado[g.id] = [] })
    setFiltros(zerado)
    setOrdem('')
    const params = new URLSearchParams()
    const cat = searchParams.get('categoria')
    if (cat) params.set('categoria', cat)
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (!grupos.length) return null

  return (
    <div className="bg-white border-b border-gray-100 sticky z-30" style={{ top: 'var(--header-height, 0)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div
          className="flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Ícone */}
          <div className="flex items-center gap-1.5 shrink-0 mr-1">
            <SlidersHorizontal size={15} strokeWidth={2} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 hidden sm:inline">Filtros</span>
          </div>

          {/* Dropdowns com createPortal */}
          {grupos.map(grupo => (
            <FiltroDropdown
              key={grupo.id}
              grupo={grupo}
              valoresSelecionados={filtros[grupo.id] || []}
              onChange={handleFiltroChange}
            />
          ))}

          {/* Separador */}
          <div className="w-px h-6 bg-gray-200 shrink-0 mx-1" />

          {/* Ordenação */}
          <select
            value={ordem}
            onChange={e => {
              setOrdem(e.target.value)
              aplicar(filtros, e.target.value)
            }}
            className="shrink-0 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 outline-none bg-white hover:border-[#3cbfb3] transition cursor-pointer"
          >
            <option value="">Ordenar por</option>
            <option value="popularidade">Popularidade</option>
            <option value="vendidos">Mais vendidos</option>
            <option value="preco_asc">Menor preço</option>
            <option value="preco_desc">Maior preço</option>
          </select>

          {/* Limpar */}
          {(totalAtivos > 0 || ordem) && (
            <button
              onClick={limparTudo}
              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition shrink-0 border border-red-100 hover:border-red-200"
            >
              <X size={12} strokeWidth={2.5} />
              Limpar ({totalAtivos})
            </button>
          )}

          {/* Contador */}
          <span className="text-xs text-gray-400 ml-auto shrink-0 whitespace-nowrap">
            {total} produto{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
