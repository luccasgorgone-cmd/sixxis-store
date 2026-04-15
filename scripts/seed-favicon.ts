import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

async function main() {
  await prisma.configuracao.upsert({
    where:  { chave: 'favicon_url' },
    update: {},
    create: { chave: 'favicon_url', valor: '' },
  })
  console.log('✅ favicon_url criado')
  await prisma.$disconnect()
}
main()
