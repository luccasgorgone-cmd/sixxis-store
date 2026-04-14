import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Share2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import GaleriaProduto from '@/components/produto/GaleriaProduto'
import BlocoPrecoProduto from '@/components/produto/BlocoPrecoProduto'
import AbasProduto from '@/components/produto/AbasProduto'
import StickyBarMobile from '@/components/produto/StickyBarMobile'
import CardProduto from '@/components/produto/CardProduto'

export const dynamic = 'force-dynamic'

interface Params { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const produto = await prisma.produto.findUnique({ where: { slug }, select: { nome: true, descricao: true } })
  if (!produto) return {}
  return {
    title: produto.nome,
    description: produto.descricao?.slice(0, 160) ?? undefined,
  }
}

export default async function ProdutoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const session = await auth()
  const clienteEmail = session?.user?.email

  const [produto, taxaConfig] = await Promise.all([
    prisma.produto.findUnique({
      where: { slug },
      include: {
        variacoes: { where: { ativo: true }, orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.configuracao.findUnique({ where: { chave: 'juros_cartao_taxa_mensal' } }),
  ])

  if (!produto || !produto.ativo) notFound()

  const taxaJuros = Number(taxaConfig?.valor || 2.99)

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
    where: { ativo: true, categoria: produto.categoria, id: { not: produto.id } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  const imagens     = produto.imagens as string[]
  const preco       = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal  = promocional ?? preco

  const variacoes = produto.variacoes.map(v => ({
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

  const produtoParaBloco = {
    id:               produto.id,
    nome:             produto.nome,
    slug:             produto.slug,
    sku:              produto.sku,
    preco,
    precoPromocional: promocional,
    estoque:          produto.estoque,
    temVariacoes:     produto.temVariacoes,
  }

  return (
    <main className="bg-white pb-28 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#3cbfb3] transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href={`/produtos?categoria=${produto.categoria}`} className="hover:text-[#3cbfb3] transition-colors capitalize">
            {categoriaLabel}
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-600 truncate max-w-[200px]">{produto.nome}</span>
        </nav>

        {/* Layout 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">

          {/* Coluna esquerda — Galeria */}
          <GaleriaProduto imagens={imagens} nome={produto.nome} />

          {/* Coluna direita — Info */}
          <div>
            {/* Categoria badge */}
            {produto.categoria && (
              <Link
                href={`/produtos?categoria=${produto.categoria}`}
                className="inline-block text-xs font-semibold text-[#3cbfb3] bg-[#e8f8f7] hover:bg-[#3cbfb3] hover:text-white px-3 py-1 rounded-full capitalize transition-colors mb-3"
              >
                {produto.categoria}
              </Link>
            )}

            {/* Nome */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
              {produto.nome}
            </h1>

            {/* Bloco preço + variações + botões */}
            <BlocoPrecoProduto
              produto={produtoParaBloco}
              variacoes={variacoes}
              taxaJuros={taxaJuros}
            />

            {/* Compartilhar */}
            <div className="mt-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Olha esse produto na Sixxis Store: ${produto.nome} — https://sixxisstore.com.br/produtos/${produto.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#25D366] border border-gray-200 hover:border-[#25D366] rounded-lg px-3 py-2 transition-colors"
              >
                <Share2 size={13} />
                Compartilhar via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Abas: Descrição / Especificações / FAQ / Avaliações */}
        <AbasProduto
          descricao={produto.descricao}
          produtoId={produto.id}
          comprouProduto={comprouProduto}
        />

        {/* Produtos relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-16 -mx-4 sm:-mx-6 px-4 sm:px-6 py-10" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Você também pode gostar</h2>
                <Link href={`/produtos?categoria=${produto.categoria}`} className="text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-medium hidden sm:block">
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                {relacionados.map(p => <CardProduto key={p.id} produto={p} />)}
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Sticky bar mobile */}
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
