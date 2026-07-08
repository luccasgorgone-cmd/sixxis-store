// Seed de peso e dimensões dos produtos (pré-requisito da cotação de frete).
//
// Casa CADA produto por um dos identificadores informados (SKU do produto,
// slug do produto, ou SKU de uma variação → produto pai). Medidas em cm; peso
// em kg. Dimensões são POR PRODUTO — as variações herdam.
//
// POLÍTICA:
//   - DRY-RUN por padrão: imprime o de-para (produto casado + medida) e a lista
//     de quem NÃO casou. Nada é alterado.
//   - --execute aplica (produto.update dos 5 campos).
//
// Uso (PROD — via Railway):
//   railway run npx tsx scripts/seed-produto-dimensoes.ts            # DRY-RUN
//   railway run npx tsx scripts/seed-produto-dimensoes.ts --execute  # aplica

import { prisma } from './_db'

const EXECUTAR = process.argv.includes('--execute')

interface Medida {
  label: string
  // Identificadores candidatos: SKU do produto, slug, ou SKU de variação.
  ids: string[]
  pesoKg: number
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
  volumes: number
}

// de-para (metros→cm já convertido: os valores abaixo já estão em cm).
const MEDIDAS: Medida[] = [
  { label: 'Aspirador',     ids: ['ASPIRA-BRAVO', 'asp-bravo'],                               pesoKg: 2.0,  alturaCm: 11,  larguraCm: 27, comprimentoCm: 44,  volumes: 1 },
  { label: 'Bike Life',     ids: ['SPN-LIFE-SX', 'spinning-sixxis-life'],                     pesoKg: 28.0, alturaCm: 86,  larguraCm: 24, comprimentoCm: 97,  volumes: 1 },
  { label: 'M45',           ids: ['CLIM-M45-TREND'],                                          pesoKg: 15.0, alturaCm: 105, larguraCm: 42, comprimentoCm: 52,  volumes: 1 },
  { label: 'SX040',         ids: ['CLI-SX040A-R-110', 'sx040-trend', 'CLIM-SX040-TREND'],     pesoKg: 15.0, alturaCm: 105, larguraCm: 42, comprimentoCm: 52,  volumes: 1 },
  { label: 'SX060',         ids: ['CLIM-SX060-PRIME'],                                        pesoKg: 22.0, alturaCm: 100, larguraCm: 39, comprimentoCm: 59,  volumes: 1 },
  { label: 'SX070',         ids: ['CLIM-SX070-TREND'],                                        pesoKg: 20.0, alturaCm: 114, larguraCm: 46, comprimentoCm: 65,  volumes: 1 },
  { label: 'SX100',         ids: ['CLIM-SX100-TREND'],                                        pesoKg: 27.5, alturaCm: 130, larguraCm: 50, comprimentoCm: 80,  volumes: 1 },
  { label: 'SX120',         ids: ['CLIM-SX120-PRIME'],                                        pesoKg: 42.0, alturaCm: 128, larguraCm: 49, comprimentoCm: 92,  volumes: 1 },
  { label: 'SX180',         ids: ['CLIM-SX180-TREND'],                                        pesoKg: 34.0, alturaCm: 140, larguraCm: 75, comprimentoCm: 92,  volumes: 1 },
  { label: 'SX200 Prime',   ids: ['CLIM-SX200-PRIME'],                                        pesoKg: 69.0, alturaCm: 158, larguraCm: 67, comprimentoCm: 108, volumes: 1 },
  { label: 'SX200 Trend',   ids: ['CLIM-SX200-TREND'],                                        pesoKg: 46.0, alturaCm: 137, larguraCm: 53, comprimentoCm: 92,  volumes: 1 },
]

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

async function acharProdutoId(ids: string[]): Promise<{ id: string; nome: string; via: string } | null> {
  const idsNorm = ids.map(norm)

  // 1. SKU ou slug do próprio produto.
  const porProduto = await prisma.produto.findMany({
    select: { id: true, nome: true, sku: true, slug: true },
  })
  for (const p of porProduto) {
    if (idsNorm.includes(norm(p.sku))) return { id: p.id, nome: p.nome, via: `sku:${p.sku}` }
    if (idsNorm.includes(norm(p.slug))) return { id: p.id, nome: p.nome, via: `slug:${p.slug}` }
  }

  // 2. SKU de variação → produto pai.
  const variacoes = await prisma.variacaoProduto.findMany({
    select: { sku: true, produto: { select: { id: true, nome: true } } },
  })
  for (const v of variacoes) {
    if (idsNorm.includes(norm(v.sku))) {
      return { id: v.produto.id, nome: v.produto.nome, via: `variacao:${v.sku}` }
    }
  }

  return null
}

async function main() {
  console.log(`\n══════════ SEED DIMENSÕES/PESO (${EXECUTAR ? 'EXECUTAR' : 'DRY-RUN'}) ══════════\n`)

  const casados: string[] = []
  const naoCasados: string[] = []

  for (const m of MEDIDAS) {
    const found = await acharProdutoId(m.ids)
    if (!found) {
      naoCasados.push(`✗ ${m.label} — nenhum produto casou com [${m.ids.join(', ')}]`)
      continue
    }

    casados.push(
      `✓ ${m.label.padEnd(12)} → ${found.nome} (${found.via}) · ` +
      `${m.pesoKg}kg A${m.alturaCm} L${m.larguraCm} C${m.comprimentoCm} vol${m.volumes}`,
    )

    if (EXECUTAR) {
      await prisma.produto.update({
        where: { id: found.id },
        data: {
          pesoKg: m.pesoKg,
          alturaCm: m.alturaCm,
          larguraCm: m.larguraCm,
          comprimentoCm: m.comprimentoCm,
          volumes: m.volumes,
        },
      })
    }
  }

  console.log('── Casados ─────────────────────────────────────────')
  casados.forEach((l) => console.log(l))
  console.log(`\n── Não casaram (${naoCasados.length}) ──────────────────────────`)
  naoCasados.forEach((l) => console.log(l))

  console.log(
    `\n${EXECUTAR ? 'APLICADO' : 'DRY-RUN — nada alterado'}: ` +
    `${casados.length}/${MEDIDAS.length} produtos casados.\n`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
