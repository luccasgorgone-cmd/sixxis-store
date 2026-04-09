'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Link from 'next/link'

interface Sugestao {
  id: string
  nome: string
  slug: string
  preco: number
  imagens: string[]
}

interface Props {
  dark?: boolean
}

export default function SearchBar({ dark = false }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const buscar = useCallback((q: string) => {
    if (q.length < 2) {
      setSugestoes([])
      setAberto(false)
      return
    }
    setCarregando(true)
    fetch(`/api/produtos?q=${encodeURIComponent(q)}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        const lista: Sugestao[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data) ? data : []
        setSugestoes(lista.slice(0, 5))
        setAberto(lista.length > 0)
      })
      .catch(() => setSugestoes([]))
      .finally(() => setCarregando(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(val), 300)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      setAberto(false)
      router.push(`/produtos?q=${encodeURIComponent(q)}`)
      setQuery('')
    }
  }

  function limpar() {
    setQuery('')
    setSugestoes([])
    setAberto(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search
          size={16}
          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            dark ? 'text-white/50' : 'text-gray-400'
          }`}
        />
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="Buscar produtos..."
          autoComplete="off"
          className={`w-full pl-9 pr-8 py-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] transition ${
            dark
              ? 'bg-white/10 text-white placeholder-white/50 border border-white/20 focus:bg-white/15 focus:border-[#3cbfb3]'
              : 'border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#3cbfb3]'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={limpar}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition`}
            aria-label="Limpar busca"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {/* Dropdown de sugestões */}
      {aberto && sugestoes.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {sugestoes.map((s) => (
            <Link
              key={s.id}
              href={`/produtos/${s.slug}`}
              onClick={() => { setAberto(false); setQuery('') }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
            >
              {/* Miniatura */}
              {s.imagens?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imagens[0]}
                  alt={s.nome}
                  className="w-9 h-9 object-cover rounded-lg shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#3cbfb3] transition-colors">
                  {s.nome}
                </p>
                <p className="text-xs text-[#3cbfb3] font-semibold">
                  R$ {Number(s.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href={`/produtos?q=${encodeURIComponent(query)}`}
            onClick={() => { setAberto(false); setQuery('') }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-[#3cbfb3] font-semibold hover:bg-gray-100 transition-colors"
          >
            <Search size={12} />
            Ver todos os resultados para &ldquo;{query}&rdquo;
          </Link>
        </div>
      )}

      {/* Loading indicator */}
      {carregando && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 z-50">
          <p className="text-xs text-gray-400 text-center">Buscando...</p>
        </div>
      )}
    </div>
  )
}
