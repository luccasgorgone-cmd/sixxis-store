import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

// Prisma 7: PrismaClient requires a driver adapter — no built-in Rust engine.
// Singleton pattern prevents exhausting connection pools on hot-reload in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definido no ambiente.')
  }

  // connection_limit, pool_timeout e connect_timeout são parâmetros de URL
  // suportados pelo adapter MariaDB para controle do pool de conexões.
  // Configure no Railway: DATABASE_URL=...?connection_limit=20&pool_timeout=30
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
