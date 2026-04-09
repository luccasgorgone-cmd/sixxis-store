import { prisma } from '@/lib/prisma'
import CardProduto from '@/components/produto/CardProduto'
import CountdownTimer from '@/components/layout/CountdownTimer'

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

  // Fim das ofertas = próxima meia-noite de domingo
  const agora = new Date()
  const fimOfertas = new Date(agora)
  fimOfertas.setDate(agora.getDate() + (7 - agora.getDay()))
  fimOfertas.setHours(23, 59, 59, 0)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <section
        className="relative rounded-2xl overflow-hidden mb-10 text-center py-14 px-6"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0f1f1e 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(circle at 50% 50%, #3cbfb3, transparent 70%)' }}
        />
        <div className="relative z-10">
          <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            🔥 Promoções especiais
          </span>
          <h1 className="text-4xl font-extrabold text-white mb-2">Ofertas da Semana</h1>
          <p className="text-white/60 mb-6">Preços imperdíveis por tempo limitado</p>

          {/* Countdown */}
          <CountdownTimer targetDate={fimOfertas.toISOString()} />
        </div>
      </section>

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
              <CardProduto key={produto.id} produto={produto} showDesconto />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
