import type { ResourceDefinition } from '../resource'
import type { ApiContext } from '../types'
import { hasScope } from '../auth'
import { iso, money } from '../format'
import { maskIdentifier, redactValue, restorePublicJsonFields, type PublicJsonFields } from '../redact'
import { Prisma } from '@prisma/client'

export type ResourceResolver = (slug: string) => ResourceDefinition
export type ResourceRow = Record<string, unknown>
export function timestamp(value: unknown): string | null {
  return value === null ? null : iso(value as Date)
}
export function amount(value: unknown): string | null {
  if (value === null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') return money(value)
  if (Prisma.Decimal.isDecimal(value)) return money(value as Prisma.Decimal)
  throw new TypeError('Invalid monetary scalar')
}
/** Dimensions retain their stored decimal precision; unlike prices, they are not rounded to cents. */
export function decimal(value: unknown): string | null {
  if (value === null) return null
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Invalid decimal scalar')
  if (typeof value === 'number' || typeof value === 'string' || Prisma.Decimal.isDecimal(value)) return String(value)
  throw new TypeError('Invalid decimal scalar')
}
/** Pure resource sanitization also protects callers that do not use the HTTP engine. */
export function safeRecord(record: ResourceRow, ctx: ApiContext, publicFields: readonly string[] = [], financeFields: readonly string[] = [], extraPii: readonly string[] = [], publicJsonFields: PublicJsonFields = {}): ResourceRow {
  const options = { allowPii: !!ctx.identity && hasScope(ctx.identity, 'read:pii'), allowMessages: !!ctx.identity && hasScope(ctx.identity, 'read:mensagens') }
  // Finance is a domain permission, also granted by read:all; PII/messages remain additive.
  for (const field of financeFields) if (!ctx.identity || !hasScope(ctx.identity, 'read:financeiro')) delete record[field]
  if (!options.allowPii) for (const field of extraPii) record[field] = maskIdentifier(record[field])
  const result = redactValue(record, options) as ResourceRow
  for (const field of publicFields) if (Object.hasOwn(record, field)) {
    if (record[field] !== null && typeof record[field] !== 'string') throw new TypeError('Invalid public scalar value')
    result[field] = redactValue(record[field], { ...options, allowPii: true })
  }
  restorePublicJsonFields(record, result, publicJsonFields, options)
  return result
}
