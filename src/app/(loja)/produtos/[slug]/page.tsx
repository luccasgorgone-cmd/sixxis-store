import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Script from 'next/script'
import { prisma } from '@/lib/prisma'
import Breadcrumb from '@/components/ui/Breadcrumb'
import type { GaleriaItemCB } from '@/components/produto/GaleriaCB'
import ProdutoGaleriaInfo from '@/components/produto/ProdutoGaleriaInfo'
import DescricaoRica from '@/components/produto/DescricaoRica'
import AbasProduto from '@/components/produto/AbasProduto'
import ProdutosSimilares from '@/components/produto/ProdutosSimilares'
import { EconomiaBloco } from '@/components/produto/EconomiaBloco'
import { PorQueComprarSixxis } from '@/components/produto/PorQueComprarSixxis'
import RevealInit from '@/components/produto/RevealInit'
import ContadorAnimado from '@/components/ui/ContadorAnimado'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://sixxis-store-production.up.railway.app'

// Limpa HTML e limita a N caracteres
function limparHTML(html: string | null | undefined, max = 160): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, max)
}

function getNomeCategoria(cat: string | null): string {
  if (!cat) return 'Produtos'
  const map: Record<string, string> = {
    climatizadores: 'Climatizadores',
    aspiradores: 'Aspiradores',
    spinning: 'Spinning & Fitness',
    purificadores: 'Purificadores',
    ventiladores: 'Ventiladores',
    umidificadores: 'Umidificadores',
    aquecedores: 'Aquecedores',
    acessorios: 'Acessórios',
  }
  return map[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1))
}

interface Params { slug: string }
interface EspecificacaoRow { label: string; valor: string }
interface FaqRow { pergunta: string; resposta: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const produto = await prisma.produto.findUnique({
    where: { slug },
    select: {
      nome: true, descricao: true, imagens: true, categoria: true,
      preco: true, precoPromocional: true, especificacoes: true,
    },
  })
  if (!produto) return { title: 'Produto não encontrado' }

  const categoria = getNomeCategoria(produto.categoria)
  const preco = Number(produto.precoPromocional || produto.preco)
  const imagens = produto.imagens as string[] | null
  const imagemPrincipal = imagens?.[0]
  const urlProduto = `${SITE_URL}/produtos/${slug}`

  // Specs resumidas (label: valor)
  let specsText = ''
  try {
    const raw = produto.especificacoes as unknown
    const arr: unknown[] = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : [])
    specsText = arr.slice(0, 3).map((item) => {
      if (Array.isArray(item)) return `${item[0]}: ${item[1]}`
      const o = item as Record<string, unknown>
      return `${o.label}: ${o.valor}`
    }).join(', ')
  } catch {}

  // Meta description SEM HTML
  const descBase = limparHTML(produto.descricao, 80)
  const descSEO = `Compre ${produto.nome} na Sixxis Store. ${
    specsText ? specsText + '. ' : descBase ? descBase + '. ' : ''
  }${preco > 0 ? `A partir de R$ ${preco.toLocaleString('pt-BR')}. ` : ''}Garantia 12 meses, frete para todo o Brasil.`.substring(0, 160)

  return {
    title: `${produto.nome} — ${categoria}`,
    description: descSEO,
    keywords: [
      produto.nome,
      `${produto.nome} preço`,
      `${produto.nome} comprar`,
      'Sixxis', 'Sixxis Store', categoria, 'Araçatuba',
    ].join(', '),
    openGraph: {
      title: `${produto.nome}${preco > 0 ? ` — R$ ${preco.toLocaleString('pt-BR')}` : ''}`,
      description: descSEO,
      url: urlProduto,
      // og:type=product (nao suportado pelo schema oficial do Next; injetamos
      // <meta property="og:type" content="product"> direto no JSX da page).
      siteName: 'Sixxis Store',
      locale: 'pt_BR',
      images: imagemPrincipal
        ? [{ url: imagemPrincipal, width: 1200, height: 630, alt: produto.nome }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: produto.nome,
      description: descSEO,
      images: imagemPrincipal ? [imagemPrincipal] : [],
    },
    alternates: { canonical: urlProduto },
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

  const imagens = produto.imagens as string[]
  const videoUrl = (produto as unknown as { videoUrl?: string | null }).videoUrl ?? ''
  const itens: GaleriaItemCB[] = [
    ...imagens.map(url => ({ tipo: 'imagem' as const, url })),
    ...(videoUrl ? [{ tipo: 'video' as const, url: videoUrl }] : []),
  ]

  // imagensPorVariacao — used for color variant gallery switching (e.g. SX200 Prime Branco/Preto)
  const imagensPorVariacao = (() => {
    try {
      const raw = (produto as unknown as { imagensPorVariacao?: unknown }).imagensPorVariacao
      if (!raw) return undefined
      if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, string[]>
      return JSON.parse(raw as string) as Record<string, string[]>
    } catch { return undefined }
  })()

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

  const categoriaLabel = getNomeCategoria(produto.categoria)

  // Normaliza specs — aceita [{label,valor}] ou [["label","valor"]]
  const especificacoes = (() => {
    try {
      const raw = (produto as unknown as { especificacoes?: unknown }).especificacoes
      if (!raw) return [] as EspecificacaoRow[]
      const arr: unknown[] = Array.isArray(raw) ? raw : JSON.parse(raw as string)
      return arr.map((item) => {
        if (Array.isArray(item)) return { label: String(item[0] ?? ''), valor: String(item[1] ?? '') }
        const o = item as Record<string, unknown>
        return { label: String(o.label ?? ''), valor: String(o.valor ?? '') }
      }) as EspecificacaoRow[]
    } catch { return [] as EspecificacaoRow[] }
  })()
  const faqs = (produto as unknown as { faqs?: FaqRow[] | null }).faqs ?? null

  // Extrair potência em Watts das specs (NÃO usar vazão de ar)
  const specPotencia = especificacoes.find(s =>
    (s.label?.toLowerCase().includes('potênci') || s.label?.toLowerCase().includes('potenci')) &&
    !s.label?.toLowerCase().includes('vazão') &&
    !s.label?.toLowerCase().includes('consumo de água')
  )?.valor
  const consumoW = specPotencia ? parseInt(specPotencia.replace(/[^0-9]/g, '')) : 0

  const produtoParaInfo = {
    id: produto.id,
    nome: produto.nome,
    slug: produto.slug,
    sku: produto.sku,
    preco,
    precoPromocional: promocional,
    estoque: produto.estoque,
    temVariacoes: produto.temVariacoes,
    imagem: imagens[0] ?? undefined,
  }

  const schemaProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produto.nome,
    description: limparHTML(produto.descricao, 300),
    image: imagens?.length ? imagens : undefined,
    sku: produto.sku || produto.slug,
    brand: { '@type': 'Brand', name: 'Sixxis' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/produtos/${produto.slug}`,
      priceCurrency: 'BRL',
      price: (promocional ?? preco).toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      availability: produto.estoque > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Sixxis Store' },
    },
    ...(totalAv > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: mediaAv.toFixed(1),
        reviewCount: totalAv,
      },
    }),
  }

  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início',   item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Produtos', item: `${SITE_URL}/produtos` },
      ...(produto.categoria
        ? [{ '@type': 'ListItem', position: 3, name: categoriaLabel, item: `${SITE_URL}/produtos?categoria=${produto.categoria}` }]
        : []),
      { '@type': 'ListItem', position: produto.categoria ? 4 : 3, name: produto.nome },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <meta property="og:type" content="product" />
      <Script
        id={`schema-produto-${produto.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaProduct) }}
      />
      <Script
        id={`schema-breadcrumb-${produto.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }}
      />
      <RevealInit />
      <Breadcrumb items={[
        { label: 'Início', href: '/' },
        { label: categoriaLabel, href: `/produtos?categoria=${produto.categoria}` },
        { label: produto.nome },
      ]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Galeria + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 lg:overflow-visible">
          <ProdutoGaleriaInfo
            produto={produtoParaInfo}
            variacoes={variacoes}
            taxaJuros={taxaJuros}
            mediaAvaliacoes={mediaAv}
            totalAvaliacoes={totalAv}
            itensIniciais={itens}
            imagensPorVariacao={imagensPorVariacao}
            especificacoes={especificacoes.length > 0 ? especificacoes : undefined}
          />
        </div>

        {/* ★ Você também pode gostar */}
        <ProdutosSimilares
          slugAtual={produto.slug}
          categoriaAtual={produto.categoria ?? ''}
        />

        {/* Descrição */}
        <DescricaoRica descricao={produto.descricao} />

        {/* Bloco de economia — após Principais Benefícios, antes do FAQ */}
        <EconomiaBloco slug={produto.slug} consumoW={consumoW} preco={preco} />

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

        {/* Stats + Por que Sixxis */}
        <section className="mt-16">
          {/* Stats row com ContadorAnimado */}
          <div className="grid grid-cols-3 gap-4 mb-10 reveal">
            <div className="text-center py-5 bg-[#f0fffe] rounded-2xl border border-[#3cbfb3]/15">
              <p className="text-2xl font-black text-[#1a4f4a]">
                +<ContadorAnimado alvo={1000000} sufixo="" />
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Produtos Vendidos</p>
            </div>
            <div className="text-center py-5 bg-[#f0fffe] rounded-2xl border border-[#3cbfb3]/15">
              <p className="text-2xl font-black text-[#1a4f4a]">
                <ContadorAnimado alvo={12} sufixo=" meses" />
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Garantia Sixxis</p>
            </div>
            <div className="text-center py-5 bg-[#f0fffe] rounded-2xl border border-[#3cbfb3]/15">
              <p className="text-2xl font-black text-[#1a4f4a]">
                <ContadorAnimado alvo={100} sufixo="%" />
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Originais</p>
            </div>
          </div>

          <PorQueComprarSixxis />
        </section>

      </div>
    </div>
  )
}
