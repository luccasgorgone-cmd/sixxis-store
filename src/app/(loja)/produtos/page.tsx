import { prisma } from '@/lib/prisma'
import CardProduto from '@/components/produto/CardProduto'
import FiltrosProduto from '@/components/produto/FiltrosProduto'

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

  const titulo = params.categoria
    ? params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1)
    : params.q
      ? `Resultados para "${params.q}"`
      : 'Todos os Produtos'

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex gap-8">
        {/* Sidebar filtros */}
        <aside className="w-56 shrink-0 hidden md:block">
          <FiltrosProduto />
        </aside>

        {/* Lista de produtos */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <h1 className="section-title">{titulo}</h1>
            <p className="text-sm text-gray-500">{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</p>
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
              <p className="text-sm text-gray-400 mt-1">Tente outra categoria ou termo de busca.</p>
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
