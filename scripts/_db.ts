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

// Conexão SÓ para scripts de ops/seed (este arquivo NÃO é importado pelo app em
// runtime — o app usa src/lib/prisma.ts). Logo, nada aqui afeta produção.
//
// O proxy público do Railway (crossover.proxy.rlwy.net) usa MySQL com
// caching_sha2_password. Sobre conexão NÃO criptografada, esse plugin exige a
// RSA public key do servidor — daí o erro "RSA public key is not available
// client side" e o pool timeout ao rodar localmente.
//
// Solução SEGURA: habilitar TLS/SSL. Com o canal criptografado, o caching_sha2
// autentica sem precisar da troca de chave RSA em claro. Passamos um PoolConfig
// (em vez da string) para conseguir setar `ssl`. Parseamos a própria
// DATABASE_URL — nenhum segredo é hardcoded.
//
// rejectUnauthorized:false porque o MySQL do Railway usa certificado
// self-signed (o proxy é TCP passthrough; o TLS é com o servidor real). O canal
// continua CRIPTOGRAFADO — só não verificamos a cadeia da CA. NÃO usamos
// allowPublicKeyRetrieval (esse seria o último recurso, sem criptografia).
const u = new URL(url)
const adapter = new PrismaMariaDb({
  host: u.hostname,
  port: u.port ? Number(u.port) : 3306,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: false },
  // O handshake TLS via proxy remoto leva mais que o connectTimeout padrão
  // (~1s) do driver — daí "failed to create socket". Folga generosa p/ local.
  connectTimeout: 30_000,
})
export const prisma = new PrismaClient({ adapter })
