import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProdutosClient from '@/components/produto/ProdutosClient'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sixxis.com.br'

// SEO por categoria (?categoria=). title é string PURA — o template '%s | Sixxis'
// do layout raiz adiciona a marca; NÃO repetir "Sixxis" aqui (evita marca dupla).
// Cada categoria tem canonical próprio (página distinta, indexável); os demais
// filtros (?q=, ?ordem=) e categorias desconhecidas caem no caso base /produtos.
const META_CATEGORIAS: Record<string, { title: string; description: string; canonical: string }> = {
  climatizadores: {
    title: 'Climatizadores de Ar Evaporativos',
    description:
      'Climatizadores evaporativos Sixxis para casa e ambientes comerciais: mais frescor com baixo consumo de energia. Garantia de 12 meses e frete para todo o Brasil.',
    canonical: `${SITE_URL}/produtos?categoria=climatizadores`,
  },
  aspiradores: {
    title: 'Aspiradores de Pó Potentes',
    description:
      'Aspiradores de pó Sixxis com alta potência de sucção para a limpeza do dia a dia. Frete para todo o Brasil, parcelamento em até 12x e garantia de 12 meses.',
    canonical: `${SITE_URL}/produtos?categoria=aspiradores`,
  },
  spinning: {
    title: 'Bikes de Spinning para Casa',
    description:
      'Bikes de spinning Sixxis para treinos intensos em casa: estrutura robusta e regulagem completa. Frete para todo o Brasil, parcelamento e garantia de 12 meses.',
    canonical: `${SITE_URL}/produtos?categoria=spinning`,
  },
}

const META_BASE = {
  title: 'Catálogo de Produtos',
  description:
    'Catálogo completo Sixxis: climatizadores evaporativos, aspiradores e bikes de spinning. Garantia de 12 meses e frete para todo o Brasil.',
  canonical: `${SITE_URL}/produtos`,
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ categoria?: string | string[] }> },
): Promise<Metadata> {
  const sp = await searchParams
  const cat = Array.isArray(sp.categoria) ? sp.categoria[0] : sp.categoria
  const meta = (cat && META_CATEGORIAS[cat]) || META_BASE

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
  }
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
