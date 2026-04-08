import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import GaleriaProduto from '@/components/produto/GaleriaProduto'
import BotaoAdicionarCarrinho from '@/components/carrinho/BotaoAdicionarCarrinho'

interface Params {
  slug: string
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function ProdutoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  const produto = await prisma.produto.findUnique({ where: { slug } })
  if (!produto || !produto.ativo) notFound()

  const imagens    = produto.imagens as string[]
  const preco      = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal  = promocional ?? preco
  const precoAtVista = precoFinal * 0.97
  const parcelamento = precoFinal / 12

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid md:grid-cols-2 gap-12">
        <GaleriaProduto imagens={imagens} nome={produto.nome} />

        <div>
          {/* Categoria / Modelo */}
          <div className="flex items-center gap-2 mb-3">
            {produto.categoria && (
              <span className="text-xs font-semibold text-[#3cbfb3] bg-[#e8f8f7] px-3 py-1 rounded-full capitalize">
                {produto.categoria}
              </span>
            )}
            {produto.modelo && (
              <span className="text-xs text-gray-500">Modelo: {produto.modelo}</span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight mb-4 leading-tight">
            {produto.nome}
          </h1>

          {/* Preços */}
          <div className="mb-6 space-y-1">
            {promocional && (
              <p className="text-gray-400 line-through text-lg">
                R$ {formatBRL(preco)}
              </p>
            )}
            <p className="text-4xl font-extrabold text-[#3cbfb3]">
              R$ {formatBRL(precoFinal)}
            </p>
            <p className="text-sm text-[#2a9d8f] font-medium">
              R$ {formatBRL(precoAtVista)} à vista no PIX (-3%)
            </p>
            <p className="text-sm text-gray-500">
              ou 12x de R$ {formatBRL(parcelamento)} no cartão
            </p>
          </div>

          <p className="text-gray-700 mb-8 whitespace-pre-line leading-relaxed">{produto.descricao}</p>

          {produto.estoque > 0 ? (
            <>
              <BotaoAdicionarCarrinho produto={produto} />
              <p className="text-xs text-gray-400 mt-3">
                {produto.estoque} {produto.estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'}
              </p>
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-500 font-medium text-sm">Produto fora de estoque</p>
              <p className="text-xs text-red-400 mt-1">
                Entre em contato para informações sobre disponibilidade.
              </p>
            </div>
          )}

          {/* Selos de confiança */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              'Garantia Sixxis',
              'Produto Original',
              'Entrega para todo Brasil',
              'Pagamento Seguro',
            ].map(s => (
              <div key={s} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-[#3cbfb3] font-bold">✓</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
