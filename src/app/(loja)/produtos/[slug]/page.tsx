import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Share2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import GaleriaProduto from '@/components/produto/GaleriaProduto'
import BotaoAdicionarCarrinho from '@/components/carrinho/BotaoAdicionarCarrinho'
import SeletorVariacao from '@/components/produto/SeletorVariacao'
import AvaliacoesProduto from '@/components/produto/AvaliacoesProduto'
import FormAvaliacao from '@/components/produto/FormAvaliacao'
import ListaEsperaForm from '@/components/produto/ListaEsperaForm'
import CardProduto from '@/components/produto/CardProduto'
import StickyBarMobile from '@/components/produto/StickyBarMobile'

export const dynamic = 'force-dynamic'

interface Params {
  slug: string
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function ProdutoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  const session = await auth()
  const clienteEmail = session?.user?.email

  const produto = await prisma.produto.findUnique({
    where: { slug },
    include: {
      variacoes: {
        where: { ativo: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!produto || !produto.ativo) notFound()

  let comprouProduto = false
  if (clienteEmail) {
    const compra = await prisma.itemPedido.findFirst({
      where: {
        produtoId: produto.id,
        pedido: { cliente: { email: clienteEmail }, status: { not: 'cancelado' } },
      },
    })
    comprouProduto = !!compra
  }

  const relacionados = await prisma.produto.findMany({
    where: {
      ativo:     true,
      categoria: produto.categoria,
      id:        { not: produto.id },
    },
    take:    4,
    orderBy: { createdAt: 'desc' },
  })

  const imagens      = produto.imagens as string[]
  const preco        = Number(produto.preco)
  const promocional  = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal   = promocional ?? preco
  const precoAtVista = precoFinal * 0.97
  const parcelamento = precoFinal / 6

  const variacoes = produto.variacoes.map((v) => ({
    id:      v.id,
    nome:    v.nome,
    sku:     v.sku,
    preco:   v.preco != null ? Number(v.preco) : null,
    estoque: v.estoque,
    ativo:   v.ativo,
  }))

  const categoriaLabel = produto.categoria
    ? produto.categoria.charAt(0).toUpperCase() + produto.categoria.slice(1)
    : 'Produtos'

  return (
    /* pb-24 no mobile para o sticky bar não sobrepor conteúdo */
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 md:pb-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 sm:mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#3cbfb3] transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link
          href={`/produtos?categoria=${produto.categoria}`}
          className="hover:text-[#3cbfb3] transition-colors capitalize"
        >
          {categoriaLabel}
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-600 truncate max-w-[160px] sm:max-w-[200px]">{produto.nome}</span>
      </nav>

      {/* Layout: flex-col em mobile, grid em md */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-8 sm:gap-12">
        {/* Galeria — full-width no mobile */}
        <GaleriaProduto imagens={imagens} nome={produto.nome} />

        <div>
          {/* Categoria / Modelo */}
          <div className="flex items-center gap-2 mb-3">
            {produto.categoria && (
              <Link
                href={`/produtos?categoria=${produto.categoria}`}
                className="text-xs font-semibold text-[#3cbfb3] bg-[#e8f8f7] hover:bg-[#3cbfb3] hover:text-white px-3 py-1 rounded-full capitalize transition-colors duration-200"
              >
                {produto.categoria}
              </Link>
            )}
            {produto.modelo && (
              <span className="text-xs text-gray-500">Modelo: {produto.modelo}</span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight mb-4 leading-tight">
            {produto.nome}
          </h1>

          {/* Preços — só mostrar se não tem variações */}
          {!produto.temVariacoes && (
            <div className="mb-6 p-4 sm:p-5 bg-[#f8f9fa] rounded-xl border border-gray-100 space-y-1.5">
              {promocional && (
                <p className="text-gray-400 line-through text-base sm:text-lg">
                  R$ {formatBRL(preco)}
                </p>
              )}
              <p className="text-3xl sm:text-4xl font-extrabold text-[#3cbfb3] leading-none">
                R$ {formatBRL(precoFinal)}
              </p>
              <p className="text-sm text-[#2a9d8f] font-medium">
                R$ {formatBRL(precoAtVista)} à vista no PIX (-3%)
              </p>
              <p className="text-sm text-gray-500">
                ou 6x de R$ {formatBRL(parcelamento)} sem juros no cartão
              </p>
            </div>
          )}

          {/* Preço base para produto COM variações */}
          {produto.temVariacoes && (
            <div className="mb-6 p-4 sm:p-5 bg-[#f8f9fa] rounded-xl border border-gray-100 space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">A partir de</p>
              {promocional && (
                <p className="text-gray-400 line-through text-base">
                  R$ {formatBRL(preco)}
                </p>
              )}
              <p className="text-3xl font-extrabold text-[#3cbfb3]">
                R$ {formatBRL(precoFinal)}
              </p>
            </div>
          )}

          <p className="text-gray-700 mb-6 whitespace-pre-line leading-relaxed text-sm">
            {produto.descricao}
          </p>

          {/* Seletor de variação OU botão direto */}
          <div id="seletor-variacao">
            {produto.temVariacoes ? (
              <SeletorVariacao
                produto={{
                  id:               produto.id,
                  nome:             produto.nome,
                  preco,
                  precoPromocional: promocional,
                  estoque:          produto.estoque,
                }}
                variacoes={variacoes}
              />
            ) : produto.estoque > 0 ? (
              <>
                {/* Desktop: botão com seletor de quantidade */}
                <div className="hidden md:block">
                  <BotaoAdicionarCarrinho produto={produto} />
                  <p className="text-xs text-gray-400 mt-3">
                    {produto.estoque} {produto.estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'}
                  </p>
                </div>
                {/* Mobile: handled by StickyBarMobile */}
                <p className="md:hidden text-xs text-gray-400 mt-2">
                  {produto.estoque} {produto.estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'}
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-500 font-medium text-sm">Produto fora de estoque</p>
                  <p className="text-xs text-red-400 mt-1">
                    Cadastre seu e-mail e avise quando voltar ao estoque.
                  </p>
                </div>
                <ListaEsperaForm produtoId={produto.id} />
              </div>
            )}
          </div>

          {/* Selos de confiança */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2 sm:gap-3">
            {[
              'Garantia Sixxis',
              'Produto Original',
              'Entrega para todo Brasil',
              'Pagamento Seguro',
            ].map((s) => (
              <div key={s} className="flex items-center gap-2 text-xs text-gray-600 bg-[#f8f9fa] rounded-lg px-3 py-2">
                <span className="text-[#3cbfb3] font-bold text-base leading-none">✓</span>
                {s}
              </div>
            ))}
          </div>

          {/* Compartilhar via WhatsApp */}
          <div className="mt-4 sm:mt-5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Olha esse produto na Sixxis Store: ${produto.nome} — https://sixxisstore.com.br/produtos/${produto.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#25D366] border border-gray-200 hover:border-[#25D366] rounded-lg px-3 py-2 transition-colors duration-200"
            >
              <Share2 size={13} />
              Compartilhar via WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Desktop: botão add-to-cart embutido (visível apenas em md+) */}
      {!produto.temVariacoes && produto.estoque > 0 && (
        <div
          className="hidden md:block"
          style={{ marginTop: '-100%', position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
      )}

      {/* ── Avaliações ── */}
      <section className="mt-12 sm:mt-16 border-t border-gray-100 pt-10 sm:pt-12">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10">
          <AvaliacoesProduto produtoId={produto.id} />
          <FormAvaliacao
            produtoId={produto.id}
            comprouProduto={comprouProduto}
          />
        </div>
      </section>

      {/* ── Você também pode gostar ── */}
      {relacionados.length > 0 && (
        <section className="mt-12 sm:mt-16 -mx-4 sm:-mx-6 px-4 sm:px-6 py-10 sm:py-14" style={{ backgroundColor: 'var(--color-fundo-alt, #f8f9fa)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <p className="text-xs font-semibold text-[#3cbfb3] uppercase tracking-wider mb-1">Da mesma categoria</p>
                <h2 className="section-title">Você também pode gostar</h2>
              </div>
              <Link
                href={`/produtos?categoria=${produto.categoria}`}
                className="hidden sm:flex items-center gap-1 text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-medium transition-colors"
              >
                Ver todos <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {relacionados.map((p) => (
                <CardProduto key={p.id} produto={p} />
              ))}
            </div>
            <div className="mt-6 sm:hidden text-center">
              <Link
                href={`/produtos?categoria=${produto.categoria}`}
                className="text-sm text-[#3cbfb3] font-medium"
              >
                Ver toda a categoria →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Sticky bottom bar mobile ── */}
      <StickyBarMobile
        produtoId={produto.id}
        nome={produto.nome}
        precoFinal={precoFinal}
        esgotado={produto.estoque === 0}
        temVariacoes={produto.temVariacoes}
      />
    </main>
  )
}
