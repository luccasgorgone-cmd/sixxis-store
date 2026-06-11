import path from 'path'
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({ path: path.resolve(process.cwd(), '.env.local') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Esta config é usada SÓ pela CLI do Prisma (migrate/generate/introspect) —
    // o runtime NÃO usa este bloco (src/lib/prisma.ts conecta via adapter a
    // partir de process.env.DATABASE_URL). Por isso o migrate pode usar uma
    // credencial dedicada de DDL (MIGRATION_DATABASE_URL) sem tocar no runtime,
    // que segue no usuário least-privilege do DATABASE_URL. Fallback p/ rodar
    // local (onde só existe DATABASE_URL).
    url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
})
