// Pedido do Luccas (2026-08-24): a home mostrava só climatizadores como "Mais
// Vendidos" (SX040, SX060 Prime, SX120 Prime, SX200 Prime). Troca pelos 4
// produtos abaixo, pra diversificar o que aparece de cara na home entre as
// categorias — os climatizadores que saíram continuam alcançáveis pelo "Ver
// todos" já existente na seção, sem precisar forçar todos no destaque.
//
// Uso:
//   npx tsx scripts/curar-mais-vendidos-2026-08.ts --dry
//   npx tsx scripts/curar-mais-vendidos-2026-08.ts

import { prisma } from './_db'

const DRY = process.argv.includes('--dry')

const NOVOS_DESTAQUES = [
  'spinning-sixxis-cardio',
  'spinning-sixxis-life',
  'asp-bravo',
  'm45-trend',
]

async function main() {
  const atuais = await prisma.produtoDestaque.findMany({
    where: { secao: 'mais-vendidos' },
    include: { produto: { select: { slug: true } } },
  })
  console.log(`Destaques atuais: ${atuais.map((d) => d.produto.slug).join(', ') || '(nenhum)'}`)

  const produtos = await prisma.produto.findMany({
    where: { slug: { in: NOVOS_DESTAQUES } },
    select: { id: true, slug: true },
  })
  const faltando = NOVOS_DESTAQUES.filter((s) => !produtos.some((p) => p.slug === s))
  if (faltando.length) {
    console.error(`[!] produto(s) não encontrado(s), abortando: ${faltando.join(', ')}`)
    process.exit(1)
  }

  console.log(`Novos destaques: ${NOVOS_DESTAQUES.join(', ')}`)
  if (DRY) {
    console.log('\n[dry-run] nenhuma alteração gravada.')
    return
  }

  await prisma.$transaction([
    prisma.produtoDestaque.deleteMany({ where: { secao: 'mais-vendidos' } }),
    ...NOVOS_DESTAQUES.map((slug, i) =>
      prisma.produtoDestaque.create({
        data: {
          produtoId: produtos.find((p) => p.slug === slug)!.id,
          secao: 'mais-vendidos',
          ordem: i,
        },
      })
    ),
  ])
  console.log('\n✅ Concluído.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
