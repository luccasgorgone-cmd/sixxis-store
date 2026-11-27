import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'prisma/migrations/20261127150000_sx200_trend_regras_comerciais/migration.sql'),
  'utf8',
)

describe('migração comercial do SX200 Trend', () => {
  it('atualiza timestamps dos registros alterados para consumidores incrementais', () => {
    expect(migration).toMatch(
      /UPDATE `Produto`[\s\S]*?SET `precoPromocional` = NULL,[\s\S]*?`updatedAt` = CURRENT_TIMESTAMP\(3\)/,
    )
    expect(migration).toMatch(
      /SET c\.`produtoIdsExcluidos` = p\.`id`,[\s\S]*?c\.`updatedAt` = CURRENT_TIMESTAMP\(3\)/,
    )
    expect(migration).toMatch(
      /UPDATE `Cupom`[\s\S]*?SET `ativo` = FALSE,[\s\S]*?`updatedAt` = CURRENT_TIMESTAMP\(3\)/,
    )
  })
})
