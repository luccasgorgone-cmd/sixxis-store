import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const asp = await prisma.produto.findFirst({ where: { slug: 'asp-bravo' } })
  if (asp) {
    await prisma.produto.update({ where: { id: asp.id }, data: { categoria: 'aspiradores' } })
    console.log(`✅ ${asp.nome}: outros → aspiradores`)
  } else {
    console.log('⚠️  asp-bravo não encontrado')
  }

  const spin = await prisma.produto.findFirst({ where: { slug: 'spinning-sixxis-life' } })
  if (spin) {
    await prisma.produto.update({ where: { id: spin.id }, data: { categoria: 'spinning' } })
    console.log(`✅ ${spin.nome}: outros → spinning`)
  } else {
    console.log('⚠️  spinning-sixxis-life não encontrado')
  }

  const todos = await prisma.produto.findMany({ select: { nome: true, categoria: true }, orderBy: { categoria: 'asc' } })
  console.log('\nCategorias atualizadas:')
  todos.forEach(p => console.log(`  ${p.categoria.padEnd(15)} ${p.nome}`))

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
