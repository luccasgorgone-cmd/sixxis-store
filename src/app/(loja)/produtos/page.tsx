import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import CardProduto from '@/components/produto/CardProduto'
import FiltrosProduto from '@/components/produto/FiltrosProduto'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Produtos — Sixxis Store',
  description: 'Explore a linha completa Sixxis: climatizadores, aspiradores e equipamentos fitness. Qualidade premium com garantia Sixxis.',
}

interface SearchParams {
  categoria?: string
  modelo?: string
  q?: string
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const produtos = await prisma.produto.findMany({
    where: {
      ativo: true,
      ...(params.categoria && { categoria: params.categoria }),
      ...(params.modelo    && { modelo: params.modelo }),
      ...(params.q && {
        OR: [
          { nome:      { contains: params.q } },
          { descricao: { contains: params.q } },
        ],
      }),
    },
    orderBy: { nome: 'asc' },
  })

  const categoriaLabel = params.categoria
    ? params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1)
    : null

  const titulo = params.q
    ? `Resultados para "${params.q}"`
    : categoriaLabel ?? 'Todos os Produtos'

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6" aria-label="Breadcrumb">
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

      <div className="flex gap-8">
        {/* Sidebar filtros */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <FiltrosProduto />
          </div>
        </aside>

        {/* Lista de produtos */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title">{titulo}</h1>
              <p className="text-xs text-gray-400 mt-2 pl-4">
                {produtos.length} produto{produtos.length !== 1 ? 's' : ''} encontrado{produtos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-[#f8f9fa]">
              <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
              <p className="text-sm text-gray-400 mt-1">Tente outra categoria ou termo de busca.</p>
              <Link href="/produtos" className="inline-block mt-4 text-sm text-[#3cbfb3] hover:underline font-medium">
                Ver todos os produtos →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {produtos.map((produto) => (
                <CardProduto key={produto.id} produto={produto} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
