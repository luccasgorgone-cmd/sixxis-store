import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import { capaVitrine } from '@/lib/capa-vitrine'
import { simularDupla } from '@/lib/dupla-bf'
import { DESCONTO_PIX_PCT, precoPix } from '@/lib/preco-pix'
import { promoVigentePorFeedId } from '@/lib/promo-segunda-unidade'

export interface Especificacao {
  label: string
  valor: string
}

export interface ProdutoComparavel {
  id: string
  nome: string
  slug: string
  sku: string | null
  preco: number
  imagens: unknown
  especificacoes: Especificacao[]
}

const LINHAS_COMPARACAO: Record<string, { rotulo: string; termos: string[] }[]> = {
  climatizadores: [
    { rotulo: 'Reservatório', termos: ['capacidade'] },
    { rotulo: 'Vazão de ar', termos: ['vazão'] },
    // 'área' cobre fichas antigas com o rótulo "Área Recomendada" (SX040).
    { rotulo: 'Cobertura', termos: ['cobertura', 'área'] },
    { rotulo: 'Potência', termos: ['potência'] },
    { rotulo: 'Velocidades', termos: ['velocidades'] },
  ],
  spinning: [
    { rotulo: 'Resistência', termos: ['resistência'] },
    { rotulo: 'Peso suportado', termos: ['peso máximo'] },
    { rotulo: 'Volante', termos: ['volante'] },
    { rotulo: 'Painel', termos: ['painel'] },
  ],
}

function brl(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function valorSpec(specs: Especificacao[], termos: string[]) {
  const achada = specs.find((s) => termos.some((t) => s.label.toLowerCase().includes(t)))
  return achada?.valor.trim() || '—'
}

function CabecalhoSecao({ titulo, apoio }: { titulo: React.ReactNode; apoio: string }) {
  return (
    <div className="mb-6 max-w-2xl md:mb-8">
      <h2 className="text-2xl font-extrabold leading-[1.14] text-sx-text sm:text-[30px] lg:text-[34px]">{titulo}</h2>
      <p className="mt-2 text-sm leading-relaxed text-sx-muted sm:text-base">{apoio}</p>
    </div>
  )
}

export function NavSecoesProduto({ temComparacao, temDupla, temFicha }: { temComparacao: boolean; temDupla: boolean; temFicha: boolean }) {
  const links = [
    { href: '#detalhes', label: 'Detalhes' },
    ...(temComparacao ? [{ href: '#comparar', label: 'Comparar' }] : []),
    ...(temDupla ? [{ href: '#dupla', label: 'Leve 2' }] : []),
    ...(temFicha ? [{ href: '#especificacoes', label: 'Especificações' }] : []),
    { href: '#avaliacoes', label: 'Avaliações e dúvidas' },
  ]
  return (
    <nav aria-label="Seções do produto" className="-mx-4 mb-8 border-y border-sx-line bg-sx-surface px-4 sm:-mx-6 sm:px-6">
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {links.map((link) => (
          <li key={link.href} className="shrink-0">
            <a href={link.href} className="inline-flex h-12 items-center px-3 text-[13px] font-bold text-sx-muted transition-colors hover:text-sx-accent-text">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function CombinacaoProduto({ produto }: { produto: ProdutoComparavel }) {
  if (!promoVigentePorFeedId(produto.sku ?? produto.slug)) return null
  const item = { id: produto.id, preco: produto.preco, sku: produto.sku, slug: produto.slug }
  const dupla = simularDupla(item, item)
  if (!dupla) return null
  return (
    <section id="dupla" className="my-12 scroll-mt-24 md:my-16">
      <div className="sx-escuro grid gap-7 rounded-2xl bg-[#0b1413] px-6 py-8 sm:px-9 md:py-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:px-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sx-accent-text">2ª unidade com 50% OFF</p>
          <h2 className="mt-2.5 text-[26px] font-extrabold leading-[1.12] text-white sm:text-[32px]">
            Seu próximo produto<br />por metade do preço.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-sx-muted">
            Leve outra unidade ou combine com um produto diferente. O desconto entra na unidade de menor valor, direto no carrinho.
          </p>
        </div>
        <dl className="rounded-xl border border-sx-line bg-sx-surface p-5 text-sm">
          <div className="flex justify-between gap-4 py-1.5"><dt className="text-sx-muted">2 unidades</dt><dd className="font-semibold text-white tabular-nums">{brl(produto.preco * 2)}</dd></div>
          <div className="flex justify-between gap-4 py-1.5"><dt className="text-sx-muted">Desconto da dupla</dt><dd className="font-semibold text-sx-accent-text tabular-nums">− {brl(dupla.desconto)}</dd></div>
          <div className="mt-2 flex justify-between gap-4 border-t border-sx-line pt-3"><dt className="text-sx-muted">Total no cartão</dt><dd className="text-base font-extrabold text-white tabular-nums">{brl(dupla.totalCartao)}</dd></div>
          <div className="flex justify-between gap-4 py-1.5"><dt className="text-sx-muted">Total no Pix ({DESCONTO_PIX_PCT}% OFF)</dt><dd className="text-base font-extrabold text-sx-accent-text tabular-nums">{brl(dupla.totalPix)}</dd></div>
          <p className="mt-1 text-xs text-sx-subtle">Valores dos produtos, antes do frete.</p>
        </dl>
      </div>
    </section>
  )
}

export function ComparativoProduto({ atual, opcoes, categoria }: { atual: ProdutoComparavel; opcoes: ProdutoComparavel[]; categoria: string }) {
  const linhas = LINHAS_COMPARACAO[categoria]
  if (!linhas || opcoes.length === 0) return null
  const produtos = [atual, ...opcoes.slice(0, 2)]
  const colunas = produtos.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
  return (
    <section id="comparar" className="my-12 scroll-mt-24 md:my-16">
      <CabecalhoSecao titulo="Qual Sixxis combina com você?" apoio="Compare os principais dados e encontre a sua próxima escolha." />
      <div className={`grid gap-3 sm:gap-4 ${colunas}`}>
        {produtos.map((produto, indice) => {
          const capa = capaVitrine(produto.slug, produto.imagens)
          return (
            <article key={produto.id} className={`flex flex-col rounded-xl border bg-sx-surface p-4 sm:p-5 ${indice === 0 ? 'border-sx-accent-text/50' : 'border-sx-line'}`}>
              <p className={`h-4 text-[11px] font-bold uppercase leading-4 tracking-wide ${indice === 0 ? 'text-sx-accent-text' : 'text-sx-subtle'}`}>
                {indice === 0 ? 'Você está vendo' : 'Outra opção'}
              </p>
              <div className="mt-3 flex items-center gap-4 md:block">
                <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-sx-stage md:w-full">
                  {capa ? (
                    <Image src={capa} alt={produto.nome} fill sizes="(max-width: 768px) 96px, 33vw" className="object-contain p-2 md:p-5" unoptimized loading="lazy" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sx-subtle"><Package size={28} aria-hidden="true" /></span>
                  )}
                </div>
                <div className="min-w-0 md:mt-4">
                  <h3 className="min-h-[2.5em] text-[15px] font-bold leading-[1.25] tracking-normal text-sx-text">{produto.nome}</h3>
                  <p className="mt-1 text-lg font-extrabold leading-tight text-sx-text tabular-nums">{brl(produto.preco)}</p>
                  <p className="text-xs font-semibold text-sx-accent-text tabular-nums">{brl(precoPix(produto.preco))} no Pix</p>
                </div>
              </div>
              <dl className="mt-4 flex-1 border-t border-sx-line">
                {linhas.map((linha) => (
                  <div key={linha.rotulo} className="flex min-h-11 items-center justify-between gap-3 border-b border-sx-line py-2 text-[13px] last:border-b-0 md:h-[58px]">
                    <dt className="shrink-0 text-sx-muted">{linha.rotulo}</dt>
                    <dd className="text-right font-semibold leading-snug text-sx-text">{valorSpec(produto.especificacoes, linha.termos)}</dd>
                  </div>
                ))}
              </dl>
              {indice > 0 && (
                <Link href={`/produtos/${produto.slug}`} className="mt-3 inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-sx-accent-text/45 text-[13px] font-bold text-sx-accent-text transition-colors hover:bg-sx-tint">
                  Ver produto <ArrowRight size={14} aria-hidden="true" />
                </Link>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function FichaTecnica({ especificacoes, nome }: { especificacoes: Especificacao[]; nome: string }) {
  if (especificacoes.length === 0) return null
  return (
    <section id="especificacoes" className="my-12 scroll-mt-24 md:my-16">
      <CabecalhoSecao titulo={<>Cada detalhe.<br />À sua vista.</>} apoio={`As informações do ${nome}, organizadas para consultar e comparar.`} />
      <dl className="grid border-t border-sx-line md:grid-cols-2 md:gap-x-12">
        {especificacoes.map((spec) => (
          <div key={spec.label} className="flex min-h-12 items-center justify-between gap-5 border-b border-sx-line py-2.5 text-sm">
            <dt className="text-sx-muted">{spec.label}</dt>
            <dd className="text-right font-semibold leading-snug text-sx-text">{spec.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
