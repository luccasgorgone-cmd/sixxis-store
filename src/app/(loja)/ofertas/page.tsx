import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CardProduto from '@/components/produto/CardProduto'
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
      {/* Breadcrumb: text-gray-500 com último item #0f2e2b bold */}
      <nav className="w-full py-3 px-4" aria-label="Breadcrumb">
        <ol className="max-w-7xl mx-auto flex items-center text-[11px] leading-none">
          <li>
            <Link href="/" className="text-gray-500 hover:text-[#3cbfb3] transition">Início</Link>
          </li>
          <li className="mx-1.5 text-gray-400" aria-hidden="true">/</li>
          <li className="font-bold text-[#0f2e2b]" aria-current="page">Ofertas Relâmpago</li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero com fundo escuro próprio */}
        <OfertasHero targetDate={fimOfertas.toISOString()} />

        {/* Produtos */}
        {ofertas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#0f2e2b]/25 rounded-2xl bg-white">
            <p className="text-[#0f2e2b]">Nenhuma oferta disponível no momento.</p>
            <p className="text-sm mt-1 text-[#0f2e2b]/60">Volte em breve para novas promoções!</p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6 font-semibold text-[#0f2e2b]">
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
