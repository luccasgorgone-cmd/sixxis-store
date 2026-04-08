'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface Props {
  dark?: boolean
}

export default function SearchBar({ dark = false }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/produtos?q=${encodeURIComponent(q)}`)
      setQuery('')
    }
  }

  return (
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
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar produtos..."
        className={`w-full pl-9 pr-4 py-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] transition ${
          dark
            ? 'bg-white/10 text-white placeholder-white/50 border border-white/20 focus:bg-white/15 focus:border-[#3cbfb3]'
            : 'border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#3cbfb3]'
        }`}
      />
    </form>
  )
}
