import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

async function main() {
  await prisma.cupom.upsert({
    where: { codigo: 'SIXXIS10' },
    update: {},
    create: {
      codigo:         'SIXXIS10',
      tipo:           'PERCENTUAL',
      valor:          10,
      descricao:      'Cupom padrão — 10% OFF na 1ª compra',
      primeiraCompra: true,
      ativo:          true,
    },
  })
  console.log('✅ Cupom SIXXIS10 criado')
  await prisma.$disconnect()
}
main()
