/**
 * Aplica garantia estendida (12% para +12m, 20% para +24m) em todos os
 * produtos ativos. Arredonda para múltiplos de R$ 10 — fica visualmente
 * limpo na UI sem perder a proporção.
 *
 * Uso:
 *   npx tsx src/scripts/seed-garantia-estendida.ts
 *
 * Pode ser rodado quantas vezes quiser — sempre recalcula com base no preço
 * atual. Admin pode ajustar manualmente em /adm-a7f9c2b4/produtos/[id] depois,
 * mas será sobrescrito se este script rodar novamente.
 */
import 'dotenv/config'
import { config as dotenvConfig } from 'dotenv'
// Carrega .env.local quando rodando localmente (Next.js só lê isso em runtime).
dotenvConfig({ path: '.env.local' })
dotenvConfig({ path: '.env.seed' })

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function arredondarMultiplo10(reais: number): number {
  return Math.round(reais / 10) * 10
}

async function main() {
  const produtos = await prisma.produto.findMany({
    where:  { ativo: true },
    select: {
      id: true, slug: true, nome: true,
      preco: true, precoPromocional: true,
      garantiaFabricaMeses: true,
    },
    orderBy: { preco: 'asc' },
  })

  console.log(`\nConfigurando garantia em ${produtos.length} produtos…\n`)

  for (const p of produtos) {
    const precoBaseReais = Number(p.precoPromocional ?? p.preco)
    const valor12 = arredondarMultiplo10(precoBaseReais * 0.12)
    const valor24 = arredondarMultiplo10(precoBaseReais * 0.20)

    await prisma.produto.update({
      where: { id: p.id },
      data: {
        garantiaFabricaMeses:     p.garantiaFabricaMeses || 12,
        garantiaEstendida12Preco: valor12,
        garantiaEstendida24Preco: valor24,
      },
    })

    console.log(
      `  ${(p.nome || p.slug).padEnd(40).slice(0, 40)} | ` +
      `preço R$ ${precoBaseReais.toFixed(2).padStart(10)} | ` +
      `+12m R$ ${valor12.toFixed(2).padStart(8)} | ` +
      `+24m R$ ${valor24.toFixed(2).padStart(8)}`,
    )
  }

  console.log('\n✓ Garantia estendida configurada em todos os produtos.')
  console.log('  Admin pode ajustar individualmente em /adm-a7f9c2b4/produtos/[id]/editar')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
