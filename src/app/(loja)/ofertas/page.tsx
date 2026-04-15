import { prisma } from '@/lib/prisma'
import CardProduto from '@/components/produto/CardProduto'
import Breadcrumb from '@/components/ui/Breadcrumb'
import OfertasHero from '@/components/home/OfertasHero'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Ofertas — Sixxis Store' }

export default async function OfertasPage() {
  const ofertas = await prisma.produto.findMany({
    where: {
      ativo: true,
      precoPromocional: { not: null },
    },
    include: {
      variacoes: { where: { ativo: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fim das ofertas = próxima meia-noite
  const agora = new Date()
  const fimOfertas = new Date(agora)
  fimOfertas.setHours(23, 59, 59, 0)

  return (
    <main>
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Ofertas Relâmpago' }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Hero */}
        <OfertasHero targetDate={fimOfertas.toISOString()} />

        {/* Produtos */}
        {ofertas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500">Nenhuma oferta disponível no momento.</p>
            <p className="text-sm text-gray-400 mt-1">Volte em breve para novas promoções!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {ofertas.length} produto{ofertas.length !== 1 ? 's' : ''} em oferta
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {ofertas.map((produto) => (
                <CardProduto key={produto.id} produto={produto} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
