'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, ChevronRight } from 'lucide-react'

interface Similar {
  id: string
  nome: string
  slug: string
  categoria: string
  preco: string
  precoPromocional: string | null
  pixPreco: string
  parcelaValor: string
  desconto: number | null
  linha: string | null
  imagem: string | null
  voltagens: string[]
  especsDestaque: { label: string; valor: string }[]
  mediaAvaliacoes: number
  totalAvaliacoes: number
}

interface Props {
  slugAtual: string
  categoriaAtual: string
}

const CAT_LABEL: Record<string, string> = {
  climatizadores: 'climatizadores',
  aspiradores: 'aspiradores',
  spinning: 'spinning',
}

function fmt(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export default function ProdutosSimilares({ slugAtual, categoriaAtual }: Props) {
  const [similares, setSimilares] = useState<Similar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/produtos/${slugAtual}/similares?limit=4`)
      .then(r => r.json())
      .then(data => setSimilares(data.similares || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slugAtual])

  if (loading) {
    return (
      <section className="mt-8 mb-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="h-7 w-52 bg-gray-200 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 sm:p-4 animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 bg-gray-100 rounded-lg mb-2 w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg mb-3 w-1/2" />
                <div className="h-5 bg-gray-100 rounded-lg mb-1 w-2/3" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (similares.length === 0) return null

  return (
    <section className="mt-8 mb-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
              Você também pode gostar
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Produtos selecionados especialmente para você
            </p>
          </div>
          <Link
            href={`/produtos?categoria=${CAT_LABEL[categoriaAtual] ?? categoriaAtual}`}
            className="hidden sm:flex items-center gap-1 text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-medium transition-colors"
          >
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {similares.map(p => {
            const precoBase  = Number(p.preco)
            const precoFinal = p.precoPromocional ? Number(p.precoPromocional) : precoBase
            const temOferta  = !!p.precoPromocional && !!p.desconto && p.desconto > 0

            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Imagem — clicável para a página do produto */}
                <Link href={`/produtos/${p.slug}`} className="relative aspect-square bg-gray-50 overflow-hidden block">
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {temOferta && (
                      <span className="inline-flex items-center gap-0.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Zap size={9} /> -{p.desconto}%
                      </span>
                    )}
                    {p.linha === 'Prime' && (
                      <span className="bg-[#0f2e2b] text-[#3cbfb3] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PRIME
                      </span>
                    )}
                  </div>

                  {p.imagem ? (
                    <Image
                      src={p.imagem}
                      alt={p.nome}
                      fill
                      unoptimized
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl" />
                    </div>
                  )}
                </Link>

                {/* Conteúdo */}
                <div className="flex flex-col flex-1 p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-[#3cbfb3] transition-colors">
                    {p.nome}
                  </h3>

                  {/* Specs destaque */}
                  {p.especsDestaque.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {p.especsDestaque.slice(0, 3).map((spec, i) => (
                        <span
                          key={i}
                          className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-lg whitespace-nowrap"
                        >
                          {spec.valor}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Voltagens */}
                  {p.voltagens.length > 0 && (
                    <div className="flex gap-1 mb-2.5">
                      {p.voltagens.map(v => (
                        <span
                          key={v}
                          className="text-[10px] font-medium text-[#3cbfb3] border border-[#3cbfb3]/30 bg-[#3cbfb3]/5 px-1.5 py-0.5 rounded-md"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Preço */}
                  <div className="mt-auto pt-2 border-t border-gray-50">
                    {temOferta && (
                      <p className="text-[10px] text-gray-400 line-through leading-none mb-0.5">
                        R$ {fmt(precoBase)}
                      </p>
                    )}
                    <p className="text-base sm:text-lg font-black text-gray-900 leading-none">
                      R$ {fmt(precoFinal)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      6x de R$ {fmt(p.parcelaValor)} sem juros
                    </p>
                    <p className="text-[10px] text-[#3cbfb3] font-medium mt-0.5">
                      R$ {fmt(p.pixPreco)} no PIX
                    </p>
                  </div>

                  {/* Comprar Agora */}
                  <a
                    href={`/produtos/${p.slug}?acao=comprar`}
                    onClick={e => { e.preventDefault(); window.location.href = `/produtos/${p.slug}?acao=comprar` }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                    style={{ backgroundColor: '#3cbfb3', color: '#fff' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    Comprar Agora
                  </a>

                  {/* Adicionar ao Carrinho */}
                  <button
                    onClick={async e => {
                      e.preventDefault()
                      e.stopPropagation()
                      try {
                        if (p.voltagens && p.voltagens.length > 1) {
                          window.location.href = `/produtos/${p.slug}?acao=carrinho`
                          return
                        }
                        const res = await fetch('/api/carrinho', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ produtoId: p.id, quantidade: 1, variacaoId: null }),
                        })
                        const btn = e.currentTarget as HTMLButtonElement
                        const original = btn.innerHTML
                        if (res.ok) {
                          btn.innerHTML = '✓ Adicionado!'
                          btn.style.color = '#10b981'
                          btn.style.borderColor = '#10b981'
                          setTimeout(() => { btn.innerHTML = original; btn.style.color = ''; btn.style.borderColor = '' }, 1500)
                        } else {
                          window.location.href = `/produtos/${p.slug}`
                        }
                      } catch {
                        window.location.href = `/produtos/${p.slug}`
                      }
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all border hover:bg-[#3cbfb3]/5"
                    style={{ borderColor: '#3cbfb3', color: '#3cbfb3', backgroundColor: 'transparent' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Adicionar ao Carrinho
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ver todos mobile */}
        <div className="mt-4 sm:hidden text-center">
          <Link
            href={`/produtos?categoria=${CAT_LABEL[categoriaAtual] ?? categoriaAtual}`}
            className="inline-flex items-center gap-1 text-sm text-[#3cbfb3] font-medium"
          >
            Ver todos os produtos <ChevronRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  )
}
