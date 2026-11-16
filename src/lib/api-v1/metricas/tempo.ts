import { Prisma } from '@prisma/client'
import { API_TIMEZONE } from '../constants'
import { money } from '../format'
import { ApiQueryError } from '../query'
import { redactValue } from '../redact'

export const METRIC_GROUPINGS = ['dia', 'semana', 'mes'] as const
export type MetricGrouping = typeof METRIC_GROUPINGS[number]
export type MetricPeriod = { de: string; ate: string; agrupar: MetricGrouping }
export type MetricParams = MetricPeriod & {
  from: Date
  toExclusive: Date
  periodo: MetricPeriod
}

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: API_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dayAt(instant: number): string {
  const parts = dayFormatter.formatToParts(instant)
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value ?? '').join('-')
}

function assertCivilDay(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiQueryError(400, 'Parâmetros de período inválidos.')
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new ApiQueryError(400, 'Parâmetros de período inválidos.')
  return value
}

export function addCivilDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

/** Finds the first real instant of a BRT civil day, including historical DST gaps. */
export function businessDayStart(day: string): Date {
  assertCivilDay(day)
  const midnightUtc = Date.parse(`${day}T00:00:00.000Z`)
  let low = midnightUtc - 86_400_000
  let high = midnightUtc + 86_400_000
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (dayAt(middle) < day) low = middle + 1
    else high = middle
  }
  return new Date(low)
}

export function parseMetricParams(search: URLSearchParams): MetricParams {
  const de = assertCivilDay(search.get('de'))
  const ate = assertCivilDay(search.get('ate'))
  const grouping = search.get('agrupar')
  if (!METRIC_GROUPINGS.includes(grouping as MetricGrouping) || de > ate) throw new ApiQueryError(400, 'Parâmetros de período inválidos.')
  const inclusiveDays = Math.floor((Date.parse(`${ate}T00:00:00.000Z`) - Date.parse(`${de}T00:00:00.000Z`)) / 86_400_000) + 1
  if (inclusiveDays < 1 || inclusiveDays > 366) throw new ApiQueryError(400, 'O período máximo para métricas é de 366 dias.')
  const agrupar = grouping as MetricGrouping
  return {
    de,
    ate,
    agrupar,
    from: businessDayStart(de),
    toExclusive: businessDayStart(addCivilDays(ate, 1)),
    periodo: { de, ate, agrupar },
  }
}

function mondayOf(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  const offset = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - offset)
  return date.toISOString().slice(0, 10)
}

export function bucketForDay(day: string, grouping: MetricGrouping): string {
  if (grouping === 'mes') return day.slice(0, 7)
  if (grouping === 'semana') return mondayOf(day)
  return day
}

export function bucketForInstant(instant: Date, grouping: MetricGrouping): string {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) throw new TypeError('Invalid metric instant')
  return bucketForDay(dayAt(instant.getTime()), grouping)
}

export function listMetricBuckets(params: MetricParams): string[] {
  const buckets: string[] = []
  let cursor = params.de
  while (cursor <= params.ate) {
    const bucket = bucketForDay(cursor, params.agrupar)
    if (buckets.at(-1) !== bucket) buckets.push(bucket)
    cursor = addCivilDays(cursor, 1)
  }
  return buckets
}

export function metricBase<T extends Record<string, string>>(params: MetricParams, definicoes: T) {
  return { timezone: API_TIMEZONE, periodo: params.periodo, definicoes }
}

export function decimalValue(value: unknown): Prisma.Decimal {
  if (Prisma.Decimal.isDecimal(value)) return value as Prisma.Decimal
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') return new Prisma.Decimal(String(value))
  throw new TypeError('Invalid decimal metric value')
}

export function decimalOrNull(value: unknown): Prisma.Decimal | null {
  return value === null || value === undefined ? null : decimalValue(value)
}

export function metricMoney(value: Prisma.Decimal): string {
  return money(value)!
}

export function averageMoney(total: Prisma.Decimal, count: number): string {
  return count === 0 ? '0.00' : metricMoney(total.div(count))
}

/** Aggregate labels never expose raw secrets/high-entropy identifiers from free dimensions. */
export function aggregateLabel(value: unknown, fallback: string, publicLabel = false): string {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const redacted = redactValue(value.trim().slice(0, 200), { allowPii: publicLabel, allowMessages: false })
  return typeof redacted === 'string' && redacted.trim() ? redacted : fallback
}
