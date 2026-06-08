import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

// Faixas alinhadas a NIVEIS_CONFIG (src/lib/avatares.ts) — degraus de R$5k. O
// limite superior pertence ao nível inferior (ex.: 5.000 = Cristal; 5.000,01 = Topázio).
const NIVEIS = [
  { slug: 'cristal',    nome: 'Cristal',    cor: '#9ca3af', gastoMin: 0,      gastoMax: 5000,   cashbackPc: 2, iconeLucide: 'Sparkles', ordem: 1 },
  { slug: 'topazio',    nome: 'Topázio',    cor: '#f59e0b', gastoMin: 5000,   gastoMax: 10000,  cashbackPc: 3, iconeLucide: 'Award',    ordem: 2 },
  { slug: 'safira',     nome: 'Safira',     cor: '#2563eb', gastoMin: 10000,  gastoMax: 15000,  cashbackPc: 4, iconeLucide: 'Gem',      ordem: 3 },
  { slug: 'diamante',   nome: 'Diamante',   cor: '#06b6d4', gastoMin: 15000,  gastoMax: 20000,  cashbackPc: 5, iconeLucide: 'Diamond',  ordem: 4 },
  { slug: 'esmeralda',  nome: 'Esmeralda',  cor: '#10b981', gastoMin: 20000,  gastoMax: null,   cashbackPc: 6, iconeLucide: 'Crown',    ordem: 5 },
]

async function main() {
  for (const n of NIVEIS) {
    await prisma.nivelFidelidade.upsert({
      where: { slug: n.slug },
      update: n,
      create: n,
    })
    console.log(`[ok] nível ${n.slug} seed/update`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
