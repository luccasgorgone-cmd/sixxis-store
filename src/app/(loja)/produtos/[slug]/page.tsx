import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import GaleriaCB from '@/components/produto/GaleriaCB'
import type { GaleriaItemCB } from '@/components/produto/GaleriaCB'
import InfoProdutoCB from '@/components/produto/InfoProdutoCB'
import CaracteristicasRapidas from '@/components/produto/CaracteristicasRapidas'
import DescricaoRica from '@/components/produto/DescricaoRica'
import AbasProduto from '@/components/produto/AbasProduto'
import CardProduto from '@/components/produto/CardProduto'

export const dynamic = 'force-dynamic'

interface Params { slug: string }
interface EspecificacaoRow { label: string; valor: string }
interface FaqRow { pergunta: string; resposta: string }

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

  const [produto, taxaConfig] = await Promise.all([
    prisma.produto.findUnique({
      where: { slug },
      include: {
        variacoes: { where: { ativo: true }, orderBy: { createdAt: 'asc' } },
        avaliacoes: { where: { aprovada: true }, select: { nota: true } },
      },
    }),
    prisma.configuracao.findUnique({ where: { chave: 'juros_cartao_taxa_mensal' } }),
  ])

  if (!produto || !produto.ativo) notFound()

  const taxaJuros = Number(taxaConfig?.valor || 2.99)

  const relacionados = await prisma.produto.findMany({
    where: { ativo: true, categoria: produto.categoria, id: { not: produto.id } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  const imagens = produto.imagens as string[]
  const videoUrl = (produto as unknown as { videoUrl?: string | null }).videoUrl ?? ''
  const itens: GaleriaItemCB[] = [
    ...imagens.map(url => ({ tipo: 'imagem' as const, url })),
    ...(videoUrl ? [{ tipo: 'video' as const, url: videoUrl }] : []),
  ]

  const preco = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null

  const totalAv = produto.avaliacoes.length
  const mediaAv = totalAv > 0
    ? produto.avaliacoes.reduce((s, a) => s + a.nota, 0) / totalAv
    : 0

  const variacoes = produto.variacoes.map(v => ({
    id: v.id,
    nome: v.nome,
    sku: v.sku,
    preco: v.preco != null ? Number(v.preco) : null,
    estoque: v.estoque,
    ativo: v.ativo,
  }))

  const categoriaLabel = produto.categoria
    ? produto.categoria.charAt(0).toUpperCase() + produto.categoria.slice(1)
    : 'Produtos'

  const especificacoes = (produto as unknown as { especificacoes?: EspecificacaoRow[] | null }).especificacoes ?? null
  const faqs = (produto as unknown as { faqs?: FaqRow[] | null }).faqs ?? null

  const produtoParaInfo = {
    id: produto.id,
    nome: produto.nome,
    slug: produto.slug,
    sku: produto.sku,
    preco,
    precoPromocional: promocional,
    estoque: produto.estoque,
    temVariacoes: produto.temVariacoes,
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-100 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide whitespace-nowrap">
            <Link href="/" className="text-gray-500 hover:text-[#3cbfb3] text-xs font-medium transition shrink-0">Início</Link>
            <ChevronRight size={12} className="text-gray-300 shrink-0" />
            <Link href={`/produtos?categoria=${produto.categoria}`} className="text-gray-500 hover:text-[#3cbfb3] text-xs font-medium transition capitalize shrink-0">
              {categoriaLabel}
            </Link>
            <ChevronRight size={12} className="text-gray-300 shrink-0" />
            <span className="text-xs font-bold text-gray-900 shrink-0">{produto.nome}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Galeria + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 lg:overflow-visible">
          <div className="relative">
            <GaleriaCB itens={itens} nome={produto.nome} />
          </div>
          <InfoProdutoCB
            produto={produtoParaInfo}
            variacoes={variacoes}
            taxaJuros={taxaJuros}
            mediaAvaliacoes={mediaAv}
            totalAvaliacoes={totalAv}
          />
        </div>

        {/* Características rápidas */}
        <CaracteristicasRapidas especificacoes={especificacoes} />

        {/* Descrição */}
        <DescricaoRica descricao={produto.descricao} />

        {/* Especificações técnicas */}
        {especificacoes && especificacoes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="text-[#3cbfb3]">≡</span>
              Especificações Técnicas
            </h2>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              {especificacoes.map(({ label, valor }, i) => (
                <div
                  key={label}
                  className={`flex items-start gap-6 px-5 py-3.5 border-b border-gray-50 last:border-0 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                  }`}
                >
                  <span className="text-sm text-gray-500 w-52 shrink-0">{label}</span>
                  <span className="text-sm text-gray-900 font-semibold">{valor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abas (Perguntas Frequentes + Avaliações) */}
        <div id="avaliacoes">
          <AbasProduto
            descricao={null}
            produtoId={produto.id}
            especificacoes={undefined}
            faqs={faqs ?? undefined}
            hideDescricao
          />
        </div>

        {/* Produtos relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-16 -mx-4 sm:-mx-6 px-4 sm:px-6 py-10 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Você também pode gostar</h2>
                <Link href={`/produtos?categoria=${produto.categoria}`}
                  className="text-sm text-[#3cbfb3] hover:text-[#2a9d8f] font-medium hidden sm:block">
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
    </div>
  )
}
