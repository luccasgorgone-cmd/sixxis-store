// Helper compartilhado para os scripts de manutenção (limpar-secrets,
// seed-cupons, seed-reviews, etc.). Converte DATABASE_URL de mysql:// para
// mariadb:// quando necessário (Prisma 7 + adapter-mariadb exige o prefixo
// mariadb://).
//
// Uso:
//   import { prisma } from './_db'
//
// O .env.local é lido automaticamente.

import path from 'path'
import { config as dotenvConfig } from 'dotenv'

// Carrega .env.local (preferido) ou .env como fallback.
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') })
dotenvConfig({ path: path.resolve(process.cwd(), '.env') })

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const raw = process.env.DATABASE_URL || ''
if (!raw) {
  throw new Error('DATABASE_URL ausente. Configure em .env.local ou via Railway run.')
}

// O adapter mariadb aceita ambos os prefixos? Não: ele exige mariadb://.
// Então aqui forçamos a conversão se vier como mysql://.
const url = raw.replace(/^mysql:\/\//, 'mariadb://')
if (!url.startsWith('mariadb://')) {
  throw new Error(
    `DATABASE_URL precisa começar com mariadb:// ou mysql:// (atual: "${raw.slice(0, 16)}...").`,
  )
}

const adapter = new PrismaMariaDb(url)
export const prisma = new PrismaClient({ adapter })
