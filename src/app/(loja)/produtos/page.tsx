import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProdutosClient from '@/components/produto/ProdutosClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Produtos — Sixxis Store',
  description: 'Explore a linha completa Sixxis: climatizadores, aspiradores e equipamentos fitness. Qualidade premium com garantia Sixxis.',
}

function ProductsLoading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-5 w-48 bg-white/10 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/10 rounded-xl animate-pulse" style={{ aspectRatio: '3/4' }} />
          ))}
        </div>
      </div>
    </main>
  )
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProdutosClient />
    </Suspense>
  )
}
