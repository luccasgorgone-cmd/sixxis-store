import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

// Prisma 7: PrismaClient requires a driver adapter — no built-in Rust engine.
// Singleton pattern prevents exhausting connection pools on hot-reload in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrisma(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) {
    throw new Error('DATABASE_URL não está definido no ambiente.')
  }

  // Passamos um PoolConfig (objeto) em vez da string de conexão de propósito:
  // os params ?connection_limit / ?pool_timeout da URL estão em snake_case
  // (convenção do engine Prisma), mas o driver mariadb só entende camelCase —
  // então eram SILENCIOSAMENTE IGNORADOS. Resultado: connectTimeout caía no
  // default de 1000ms, curto demais pro handshake via proxy do Railway (~1.7s).
  // Quando o banco reiniciava, toda tentativa de recriar conexão estourava em
  // 1s, o pool nunca reenchia (active=0 idle=0) e o site ficava fora até um
  // restart manual. Setar os tempos corretos faz o pool se curar sozinho.
  const u = new URL(rawUrl)
  const connectionLimit = Number(u.searchParams.get('connection_limit')) || 10
  const poolTimeoutSec = Number(u.searchParams.get('pool_timeout')) || 20

  const adapter = new PrismaMariaDb({
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    connectionLimit,
    // Handshake via proxy público do Railway leva ~1.5-2s; 1000ms (default) era
    // curto demais e impedia a recriação do pool após restart do banco.
    connectTimeout: 15000,
    // Precisa ser > connectTimeout, senão o mariadb clampa o connectTimeout.
    acquireTimeout: Math.max(20000, poolTimeoutSec * 1000),
    // Em segundos. Default é 1800 (30min): sockets mortos ficavam retidos tempo
    // demais. 120s recicla conexões ociosas/mortas rápido depois de um blip.
    idleTimeout: 120,
    // Valida a conexão ao retirá-la do pool (default) — descarta socket morto.
    minDelayValidation: 500,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
