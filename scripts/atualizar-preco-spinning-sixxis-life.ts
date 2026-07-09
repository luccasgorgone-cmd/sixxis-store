// Preço da "Bicicleta Spinning Sixxis Life" (slug spinning-sixxis-life).
//
//   npx tsx scripts/atualizar-preco-spinning-sixxis-life.ts
//
//   preco            = R$ 3.350,00  (preço "de" / cheio, riscado)
//   precoPromocional = R$ 2.950,00  (preço "por" / vigente)
//
// As derivações (10x sem juros, PIX com desconto) NÃO são gravadas: saem das
// funções existentes (src/lib/parcelamento.ts e o desconto PIX) a partir destes
// dois campos. Nada de valor derivado hardcoded.
//
// Idempotente: rodar de novo só reaplica os mesmos valores. Escopo: 1 produto.

import { prisma } from './_db'

const SLUG = 'spinning-sixxis-life'
const PRECO_CHEIO = 3350
const PRECO_PROMOCIONAL = 2950

async function main() {
  const antes = await prisma.produto.findUnique({
    where:  { slug: SLUG },
    select: { id: true, nome: true, sku: true, preco: true, precoPromocional: true },
  })
  if (!antes) throw new Error(`Produto não encontrado pelo slug "${SLUG}"`)

  console.log(`Antes:  preco=${antes.preco}  precoPromocional=${antes.precoPromocional}`)

  const depois = await prisma.produto.update({
    where:  { id: antes.id },
    data:   { preco: PRECO_CHEIO, precoPromocional: PRECO_PROMOCIONAL },
    select: { nome: true, sku: true, preco: true, precoPromocional: true },
  })

  console.log(`Depois: preco=${depois.preco}  precoPromocional=${depois.precoPromocional}`)
  console.log(`✅ ${depois.nome} (${depois.sku}) atualizado.`)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('❌', e)
  await prisma.$disconnect()
  process.exit(1)
})
