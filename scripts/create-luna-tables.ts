import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não definido')
const adapter = new PrismaMariaDb(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter })

async function main() {
  const sql = readFileSync(join(process.cwd(), 'scripts', 'create-luna-tables.sql'), 'utf-8')
  const statements = sql.split(/;\s*$/m).map(s => s.trim()).filter(Boolean)

  for (const stmt of statements) {
    console.log(`→ ${stmt.slice(0, 80).replace(/\s+/g, ' ')}...`)
    await prisma.$executeRawUnsafe(stmt)
  }

  console.log('\n✅ Tabelas LunaConversa e LunaMensagem criadas com sucesso')
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('❌ Erro:', err)
  process.exit(1)
})
