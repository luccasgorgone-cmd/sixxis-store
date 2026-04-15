import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ShieldCheck, Award, Headphones, Zap, Wind, Droplets } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Breadcrumb from '@/components/ui/Breadcrumb'
import type { GaleriaItemCB } from '@/components/produto/GaleriaCB'
import ProdutoGaleriaInfo from '@/components/produto/ProdutoGaleriaInfo'
import DescricaoRica from '@/components/produto/DescricaoRica'
import AbasProduto from '@/components/produto/AbasProduto'
import ProdutosSimilares from '@/components/produto/ProdutosSimilares'
import { EconomiaBloco } from '@/components/produto/EconomiaBloco'
import RevealInit from '@/components/produto/RevealInit'
import ContadorAnimado from '@/components/ui/ContadorAnimado'

export const dynamic = 'force-dynamic'

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

  return (
    <div className="min-h-screen bg-white">
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

          {/* Por que Sixxis */}
          <h2 className="text-xl font-extrabold text-gray-900 mb-1 reveal reveal-delay-1">Por que comprar na Sixxis?</h2>
          <p className="text-sm text-gray-500 mb-5 reveal reveal-delay-1">Qualidade e inovação com a confiança que você merece.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                icon: ShieldCheck,
                title: 'Garantia Real',
                desc: '12 meses de garantia em todos os produtos, com suporte ativo da Sixxis.',
                color: 'text-[#3cbfb3]',
                bg: 'bg-[#e8f8f7]',
                delay: '',
              },
              {
                icon: Zap,
                title: 'Até 80% de Economia',
                desc: 'Consome até 10× menos que um ar-condicionado. Sua conta de luz agradece.',
                color: 'text-amber-500',
                bg: 'bg-amber-50',
                delay: 'reveal-delay-1',
              },
              {
                icon: Wind,
                title: 'Sem Instalação',
                desc: 'Liga na tomada e pronto. Sem obra, sem encanamento, sem dor de cabeça.',
                color: 'text-blue-500',
                bg: 'bg-blue-50',
                delay: 'reveal-delay-2',
              },
              {
                icon: Droplets,
                title: 'Umidifica o Ar',
                desc: 'Adiciona umidade ao ar — mais saudável para a pele e para a respiração.',
                color: 'text-purple-500',
                bg: 'bg-purple-50',
                delay: 'reveal-delay-3',
              },
            ].map(({ icon: Icon, title, desc, color, bg, delay }) => (
              <div key={title} className={`reveal ${delay} bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="font-extrabold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          {/* Por que Sixxis — 3 cards originais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              {
                icon: Award,
                title: '100% Original',
                desc: 'Todos os produtos são originais, com certificação e procedência garantida.',
                color: 'text-amber-500',
                bg: 'bg-amber-50',
              },
              {
                icon: Headphones,
                title: 'Suporte Dedicado',
                desc: 'Time especializado pronto para te ajudar antes, durante e após a compra.',
                color: 'text-blue-500',
                bg: 'bg-blue-50',
              },
              {
                icon: ShieldCheck,
                title: 'Troca em 7 Dias',
                desc: 'Não ficou satisfeito? Troca ou devolução sem burocracia em até 7 dias.',
                color: 'text-[#3cbfb3]',
                bg: 'bg-[#e8f8f7]',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="reveal bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="font-extrabold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          {/* WhatsApp CTA */}
          <div className="reveal rounded-2xl bg-gradient-to-r from-[#0f2e2b] to-[#1a4f4a] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-extrabold text-sm mb-0.5">Ficou com dúvida? Fale com um especialista</p>
              <p className="text-white/60 text-xs">Atendimento rápido pelo WhatsApp</p>
            </div>
            <a
              href={`https://wa.me/5518997474701?text=Olá!%20Tenho%20interesse%20no%20${encodeURIComponent(produto.nome)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe58] text-white font-extrabold text-sm px-5 py-3 rounded-xl transition-all shrink-0 shadow-lg shadow-black/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar no WhatsApp
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}
