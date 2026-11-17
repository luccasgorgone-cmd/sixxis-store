import { afterAll, describe, expect, it, vi } from 'vitest'

const databaseUrl = vi.hoisted(() => {
  const value = 'mysql://user:password@db.example.test:3306/store?connection_limit=7&pool_timeout=25'
  process.env.DATABASE_URL = value
  return value
})

import { buildPrismaPoolConfig } from './prisma'

afterAll(() => { delete process.env.DATABASE_URL })

describe('Prisma MariaDB pool safety', () => {
  it('enforces a server-side deadline for every database statement', () => {
    expect(buildPrismaPoolConfig(databaseUrl)).toMatchObject({
      connectionLimit: 7,
      acquireTimeout: 25_000,
      sessionVariables: { max_execution_time: 10_000 },
    })
    expect(buildPrismaPoolConfig(databaseUrl)).not.toHaveProperty('queryTimeout')
  })
})
