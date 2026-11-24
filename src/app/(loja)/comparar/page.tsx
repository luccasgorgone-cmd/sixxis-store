import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { capaVitrine } from '@/lib/capa-vitrine'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Comparar produtos',
  robots: { index: false },
}

interface EspecRow { label: string; valor: string }

function getEspec(raw: unknown, ...labelContains: string[]): string {
  try {
    const arr: unknown[] = Array.isArray(raw) ? raw : raw ? JSON.parse(String(raw)) : []
    const rows: EspecRow[] = arr.map((item) => {
      if (Array.isArray(item)) return { label: String(item[0] ?? ''), valor: String(item[1] ?? '') }
      const o = item as Record<string, unknown>
      return { label: String(o.label ?? ''), valor: String(o.valor ?? '') }
    })
    for (const needle of labelContains) {
      const row = rows.find((r) => r.label.toLowerCase().includes(needle.toLowerCase()))
      if (row?.valor) return row.valor
    }
  } catch {}
  return '—'
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids: idsParam = '' } = await searchParams
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3)

  if (ids.length < 2) redirect('/produtos')

  const produtosRaw = await prisma.produto.findMany({
    where: { id: { in: ids }, ativo: true },
  })

  if (produtosRaw.length < 2) redirect('/produtos')

  // Preserva a ordem dos IDs passados
  const byId = new Map(produtosRaw.map((p) => [p.id, p]))
  const produtos = ids.map((id) => byId.get(id)).filter(Boolean) as typeof produtosRaw

  const precos = produtos.map((p) => Number(p.precoPromocional ?? p.preco))
  const menorPreco = Math.min(...precos)

  const linhas: { label: string; valores: string[] }[] = [
    {
      label: 'Preço',
      valores: produtos.map((p) => `R$ ${fmt(Number(p.precoPromocional ?? p.preco))}`),
    },
    {
      label: 'Voltagem',
      valores: produtos.map((p) => getEspec(p.especificacoes, 'voltag')),
    },
    {
      label: 'Potência',
      valores: produtos.map((p) => getEspec(p.especificacoes, 'potênc', 'potenc')),
    },
    {
      label: 'Capacidade do Tanque',
      valores: produtos.map((p) => getEspec(p.especificacoes, 'tanque', 'reservat')),
    },
    {
      label: 'Vazão de Ar',
      valores: produtos.map((p) => getEspec(p.especificacoes, 'vazão', 'vazao')),
    },
    {
      label: 'Cobertura',
      valores: produtos.map((p) => getEspec(p.especificacoes, 'cobertura', 'área', 'ambiente')),
    },
    {
      label: 'Velocidades',
      valores: produtos.map((p) => getEspec(p.especificacoes, 'velocidade')),
    },
    {
      label: 'Garantia',
      valores: produtos.map(() => '12 meses'),
    },
  ]

  return (
    <main>
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Comparar' }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-6">
          Comparar produtos
        </h1>

        <div className="bg-sx-surface rounded-2xl shadow-sm border border-sx-line overflow-hidden">
          {/* Cabeçalho — 1 coluna para labels + 1 por produto */}
          <div
            className="grid border-b border-sx-line"
            style={{ gridTemplateColumns: `160px repeat(${produtos.length}, minmax(0, 1fr))` }}
          >
            <div className="p-4 bg-sx-raised" />
            {produtos.map((p) => {
              const capa = capaVitrine(p.slug, p.imagens)
              const preco = Number(p.precoPromocional ?? p.preco)
              return (
                <div key={p.id} className="p-4 text-center border-l border-sx-line">
                  <Link href={`/produtos/${p.slug}`} className="block">
                    <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-3 bg-sx-stage rounded-xl overflow-hidden">
                      {capa ? (
                        <Image
                          src={capa}
                          alt={p.nome}
                          fill
                          className="object-contain p-2"
                          sizes="160px"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-sx-text line-clamp-2 leading-snug min-h-[2.5rem]">
                      {p.nome}
                    </p>
                    <p className="text-lg font-black text-sx-text mt-2">R$ {fmt(preco)}</p>
                  </Link>
                  <Link
                    href={`/produtos/${p.slug}`}
                    className="mt-3 inline-block bg-sx-accent hover:bg-sx-accent-hover text-sx-ink text-sm font-bold px-4 py-2 rounded-lg transition-colors w-full"
                  >
                    Comprar agora
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Linhas de comparação */}
          {linhas.map((linha, i) => (
            <div
              key={linha.label}
              className={`grid ${i % 2 === 0 ? 'bg-sx-surface' : 'bg-sx-raised'}`}
              style={{ gridTemplateColumns: `160px repeat(${produtos.length}, minmax(0, 1fr))` }}
            >
              <div className="p-4 text-xs font-bold text-sx-muted uppercase tracking-wide bg-sx-raised border-r border-sx-line">
                {linha.label}
              </div>
              {linha.valores.map((valor, j) => {
                const isMelhorPreco =
                  linha.label === 'Preço' && precos[j] === menorPreco && produtos.length > 1
                return (
                  <div
                    key={j}
                    className={`p-4 text-sm border-l border-sx-line ${
                      isMelhorPreco ? 'text-sx-accent-text font-extrabold' : 'text-sx-muted'
                    }`}
                  >
                    {valor}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          Comparação baseada nas especificações declaradas pelo fabricante.
        </p>
      </div>
    </main>
  )
}
