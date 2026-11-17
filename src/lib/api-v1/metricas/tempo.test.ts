import { describe, expect, it } from 'vitest'
import { ApiQueryError } from '../query'
import { bucketForInstant, listMetricBuckets, parseMetricParams } from './tempo'

describe('metric time contract', () => {
  it('turns inclusive BRT civil dates into exact UTC query boundaries', () => {
    const params = parseMetricParams(new URLSearchParams({ de: '2026-11-16', ate: '2026-11-17', agrupar: 'dia' }))

    expect(params.from.toISOString()).toBe('2026-11-16T03:00:00.000Z')
    expect(params.toExclusive.toISOString()).toBe('2026-11-18T03:00:00.000Z')
    expect(params.periodo).toEqual({ de: '2026-11-16', ate: '2026-11-17', agrupar: 'dia' })
  })

  it('uses the first valid instant when historical DST skipped local midnight', () => {
    const params = parseMetricParams(new URLSearchParams({ de: '2018-11-04', ate: '2018-11-04', agrupar: 'dia' }))

    expect(params.from.toISOString()).toBe('2018-11-04T03:00:00.000Z')
    expect(params.toExclusive.toISOString()).toBe('2018-11-05T02:00:00.000Z')
  })

  it('starts weekly buckets on Monday in America/Sao_Paulo', () => {
    const monday = bucketForInstant(new Date('2026-11-16T12:00:00.000Z'), 'semana')
    const sunday = bucketForInstant(new Date('2026-11-22T23:00:00.000Z'), 'semana')

    expect(monday).toBe('2026-11-16')
    expect(sunday).toBe('2026-11-16')
  })

  it('accepts chronological metric windows longer than 366 civil days', () => {
    const long = parseMetricParams(new URLSearchParams({ de: '2024-01-01', ate: '2025-01-01', agrupar: 'mes' }))

    expect(long.periodo).toEqual({ de: '2024-01-01', ate: '2025-01-01', agrupar: 'mes' })
    expect(listMetricBuckets(long)).toHaveLength(13)
  })

  it.each([
    {},
    { de: '2026-11-16', ate: '2026-11-16' },
    { de: '2026-11-17', ate: '2026-11-16', agrupar: 'dia' },
    { de: '2026-02-30', ate: '2026-03-01', agrupar: 'dia' },
    { de: '2026-11-16', ate: '2026-11-16', agrupar: 'hora' },
  ])('rejects missing or invalid metric parameters: %o', query => {
    expect(() => parseMetricParams(new URLSearchParams(query))).toThrow(ApiQueryError)
  })
})
