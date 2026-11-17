import { Prisma } from '@prisma/client'
import { API_VERSION } from './constants'
import type { ItemEnvelope, ListEnvelope, PageInfo } from './types'

type MoneyInput = Prisma.Decimal | string | number | bigint | null | undefined

/** Decimal rounding is half-away-from-zero; no binary floating point arithmetic. */
export function money(value: MoneyInput, fromCents = false): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Invalid money')
  if (!['string', 'number', 'bigint'].includes(typeof value) && !Prisma.Decimal.isDecimal(value)) {
    throw new TypeError('Money must be a decimal value')
  }
  const source = String(value)
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(source)
  if (!match || source.length > 2000) throw new TypeError('Invalid money')
  const exponent = Number(match[4] ?? 0)
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 1000) throw new TypeError('Invalid money exponent')
  const digits = match[2] + (match[3] ?? '')
  // Position after the last cent digit, before any rounding.
  const cut = match[2].length + exponent + 2 - (fromCents ? 2 : 0)
  let cents = BigInt(cut <= 0 ? '0' : digits.slice(0, cut).padEnd(cut, '0'))
  if (cut >= 0 && Number(digits[cut] ?? '0') >= 5) cents += BigInt(1)
  const sign = match[1] === '-' && cents !== BigInt(0) ? '-' : ''
  const rendered = cents.toString().padStart(3, '0')
  return `${sign}${rendered.slice(0, -2)}.${rendered.slice(-2)}`
}

export function iso(value: Date): string {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new TypeError('Invalid date')
  return value.toISOString()
}

/** Reject implicit toJSON conversion: resource serializers must format Prisma types explicitly. */
export function assertJsonValue(value: unknown, ancestors = new WeakSet<object>(), depth = 0): void {
  if (depth > 64) throw new TypeError('JSON nesting is too deep')
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number' && Number.isFinite(value)) return
  if (typeof value !== 'object') throw new TypeError('Payload contains an unformatted JSON value')
  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('Payload contains an unformatted object')
  }
  if (ancestors.has(value)) throw new TypeError('Payload contains a cycle')
  ancestors.add(value)
  for (const child of Object.values(value)) assertJsonValue(child, ancestors, depth + 1)
  ancestors.delete(value)
}

export function listEnvelope<T>(data: T[], page: PageInfo, requestId: string): ListEnvelope<T> {
  assertJsonValue(data)
  return {
    data,
    meta: {
      requestId, count: data.length, hasMore: page.hasMore, nextCursor: page.nextCursor,
      generatedAt: iso(new Date()), apiVersion: API_VERSION,
    },
  }
}

export function itemEnvelope<T>(data: T, requestId: string): ItemEnvelope<T> {
  assertJsonValue(data)
  return { data, meta: { requestId, generatedAt: iso(new Date()) } }
}
