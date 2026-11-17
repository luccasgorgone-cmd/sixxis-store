import { describe, expect, it, vi } from 'vitest'
import type { ApiContext } from '../types'
import { createFunilMetric } from './funil'
import { parseMetricParams } from './tempo'

const context = { requestId: 'req-funil', identity: null, ip: '127.0.0.1', startedAt: 0 } satisfies ApiContext
const params = parseMetricParams(new URLSearchParams({ de: '2026-11-16', ate: '2026-11-16', agrupar: 'dia' }))
const at = (hour: string) => new Date(`2026-11-16T${hour}:00.000Z`)

function events() {
  return [
    ...['s1', 's2', 's3', 's4'].flatMap((sessaoId, index) => [
      { sessaoId, tipo: 'view_item', dados: null, createdAt: at(`1${index}:00`) },
      { sessaoId, tipo: 'add_to_cart', dados: null, createdAt: at(`1${index}:10`) },
      { sessaoId, tipo: 'begin_checkout', dados: null, createdAt: at(`1${index}:20`) },
    ]),
    { sessaoId: 's1', tipo: 'checkout_payment_outcome', dados: { outcome: 'submit' }, createdAt: at('14:00') },
    { sessaoId: 's1', tipo: 'purchase', dados: { transaction_id: 'p1' }, createdAt: at('14:10') },
    { sessaoId: 's2', tipo: 'page_view', dados: null, createdAt: at('16:59') },
    { sessaoId: 's3', tipo: 'checkout_payment_outcome', dados: { outcome: 'brick_error' }, createdAt: at('17:30') },
    { sessaoId: 's4', tipo: 'page_view', dados: null, createdAt: new Date('2026-11-16T17:00:00.001Z') },
  ]
}

describe('metricas/funil', () => {
  it('counts distinct tracked sessions through the exact funnel stages', async () => {
    const sessaoFindMany = vi.fn().mockResolvedValue(['s1', 's2', 's3', 's4'].map((sessaoId, index) => ({ sessaoId, createdAt: at(`${index + 8}`.padStart(2, '0') + ':00') })))
    const eventoFindMany = vi.fn().mockResolvedValue(events())
    const definition = createFunilMetric({
      prisma: { sessaoVisitante: { findMany: sessaoFindMany }, eventoTracking: { findMany: eventoFindMany, groupBy: vi.fn().mockResolvedValue([
        { sessaoId: 's1', _max: { createdAt: at('14:10') } },
        { sessaoId: 's2', _max: { createdAt: at('16:59') } },
        { sessaoId: 's3', _max: { createdAt: at('17:30') } },
        { sessaoId: 's4', _max: { createdAt: new Date('2026-11-16T17:00:00.001Z') } },
      ]) } } as never,
      now: () => new Date('2026-11-16T18:00:00.000Z'),
    })

    const result = await definition.query(context, params)

    expect(result.tracked).toBe(true)
    expect(result.etapas.map(stage => [stage.etapa, stage.sessoes])).toEqual([
      ['sessoes', 4],
      ['view_item', 4],
      ['add_to_cart', 4],
      ['begin_checkout', 4],
      ['pagamento_submit', 1],
      ['purchase', 1],
    ])
    expect(result.abandonoCheckout).toEqual({ comercial: 1, tecnico: 1, emAndamento: 1 })
    expect(result.definicoes.abandonoComercial).toContain('>= 1h')
    expect(result.definicoes.abandonoTecnico).toContain('rejected|api_error|brick_error')
    expect(result.definicoes.cobertura).toContain('consentimento')
    expect(sessaoFindMany).toHaveBeenCalledTimes(1)
    expect(eventoFindMany).toHaveBeenCalledTimes(2)
  })

  it('treats exactly one hour of inactivity as commercial abandonment and technical outcome as dominant', async () => {
    const definition = createFunilMetric({
      prisma: {
        sessaoVisitante: { findMany: vi.fn().mockResolvedValue([{ sessaoId: 'boundary', createdAt: at('10:00') }, { sessaoId: 'technical', createdAt: at('10:00') }]) },
        eventoTracking: { findMany: vi.fn().mockResolvedValue([
          { sessaoId: 'boundary', tipo: 'begin_checkout', dados: null, createdAt: at('17:00') },
          { sessaoId: 'technical', tipo: 'begin_checkout', dados: null, createdAt: at('16:00') },
          { sessaoId: 'technical', tipo: 'checkout_payment_outcome', dados: { outcome: 'api_error' }, createdAt: at('17:30') },
        ]), groupBy: vi.fn().mockResolvedValue([
          { sessaoId: 'boundary', _max: { createdAt: at('17:00') } },
          { sessaoId: 'technical', _max: { createdAt: at('17:30') } },
        ]) },
      } as never,
      now: () => at('18:00'),
    })

    const result = await definition.query(context, params)

    expect(result.abandonoCheckout).toEqual({ comercial: 1, tecnico: 1, emAndamento: 0 })
  })

  it('counts a session active in the period even when its session row was created earlier', async () => {
    const definition = createFunilMetric({
      prisma: {
        sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
        eventoTracking: { findMany: vi.fn().mockResolvedValue([{ sessaoId: 'carried-session', tipo: 'view_item', dados: null, createdAt: at('12:00') }]), groupBy: vi.fn().mockResolvedValue([{ sessaoId: 'carried-session', _max: { createdAt: at('12:00') } }]) },
      } as never,
      now: () => at('18:00'),
    })

    const result = await definition.query(context, params)

    expect(result.etapas.slice(0, 2).map(stage => [stage.etapa, stage.sessoes])).toEqual([['sessoes', 1], ['view_item', 1]])
    expect(result.serie[0]).toMatchObject({ sessoes: 1, viewItem: 1 })
  })

  it('keeps funnel stages cumulative when a later event has no preceding tracked stages', async () => {
    const definition = createFunilMetric({
      prisma: {
        sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
        eventoTracking: { findMany: vi.fn().mockResolvedValue([{ sessaoId: 'orphan-purchase', tipo: 'purchase', dados: { transaction_id: 'p1' }, createdAt: at('12:00') }]), groupBy: vi.fn().mockResolvedValue([{ sessaoId: 'orphan-purchase', _max: { createdAt: at('12:00') } }]) },
      } as never,
      now: () => at('18:00'),
    })

    const result = await definition.query(context, params)

    expect(result.etapas.map(stage => stage.sessoes)).toEqual([1, 0, 0, 0, 0, 0])
    expect(result.serie[0]).toMatchObject({ sessoes: 1, viewItem: 0, addToCart: 0, beginCheckout: 0, pagamentoSubmit: 0, purchase: 0 })
  })

  it('uses later purchase outcomes to avoid false historical abandonment', async () => {
    const historical = parseMetricParams(new URLSearchParams({ de: '2026-11-15', ate: '2026-11-15', agrupar: 'dia' }))
    const eventoFindMany = vi.fn()
      .mockResolvedValueOnce([{ sessaoId: 'late-conversion', tipo: 'begin_checkout', dados: null, createdAt: new Date('2026-11-15T20:00:00Z') }])
      .mockResolvedValueOnce([{ id: 'activity-late', sessaoId: 'late-conversion', createdAt: new Date('2026-11-15T20:00:00Z') }])
      .mockResolvedValueOnce([{ sessaoId: 'late-conversion', tipo: 'purchase', dados: { transaction_id: 'p-late' }, createdAt: new Date('2026-11-16T10:00:00Z') }])
    const definition = createFunilMetric({
      prisma: {
        sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
        eventoTracking: { findMany: eventoFindMany, groupBy: vi.fn()
          .mockResolvedValueOnce([{ sessaoId: 'late-conversion', _max: { createdAt: new Date('2026-11-16T10:00:00Z') } }]) },
      } as never,
      now: () => new Date('2026-11-16T18:00:00Z'),
    })

    const result = await definition.query(context, historical)

    expect(result.abandonoCheckout).toEqual({ comercial: 0, tecnico: 0, emAndamento: 0 })
    expect(eventoFindMany).toHaveBeenCalledTimes(3)
    expect(eventoFindMany.mock.calls[2][0].where).toMatchObject({
      sessaoId: { in: ['late-conversion'] },
    })
    expect(eventoFindMany.mock.calls[2][0].where.tipo.in).toEqual(['checkout_payment_outcome', 'purchase'])
  })

  it('counts an old session active through page_view and uses later search as its activity clock only', async () => {
    const eventoFindMany = vi.fn(async (args: { where: { tipo?: unknown }; select?: Record<string, boolean> }) => args.where.tipo
      ? [{ sessaoId: 'checkout-active', tipo: 'begin_checkout', dados: null, createdAt: at('15:00') }]
      : [
          { id: 'a-1', sessaoId: 'old-active', createdAt: at('12:00') },
          { id: 'a-2', sessaoId: 'checkout-active', createdAt: at('17:30') },
        ])
    const groupBy = vi.fn().mockResolvedValue([])
    const definition = createFunilMetric({ prisma: {
      sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
      eventoTracking: { findMany: eventoFindMany, groupBy },
    } as never, now: () => at('18:00') })

    const result = await definition.query(context, params)

    expect(result.etapas.map(stage => stage.sessoes)).toEqual([2, 0, 0, 0, 0, 0])
    expect(result.abandonoCheckout).toEqual({ comercial: 0, tecnico: 0, emAndamento: 1 })
    expect(eventoFindMany.mock.calls[0][0].where.tipo).toBeDefined()
    expect(eventoFindMany.mock.calls[0][0].select.dados).toBe(true)
    expect(eventoFindMany.mock.calls[1][0].select).toEqual({ id: true, sessaoId: true, createdAt: true })
    expect(eventoFindMany.mock.calls[1][0].select).not.toHaveProperty('dados')
    expect(groupBy).not.toHaveBeenCalled()
  })

  it('batches follow-up session ids by 200 with bounded concurrency and a seven-day horizon', async () => {
    const historical = parseMetricParams(new URLSearchParams({ de: '2026-11-15', ate: '2026-11-15', agrupar: 'dia' }))
    const begins = Array.from({ length: 401 }, (_, index) => ({ sessaoId: `s-${index}`, tipo: 'begin_checkout', dados: null, createdAt: new Date('2026-11-15T12:00:00Z') }))
    let active = 0
    let peak = 0
    let findCall = 0
    let groupCall = 0
    const measured = async <T>(value: T) => {
      active += 1
      peak = Math.max(peak, active)
      await Promise.resolve()
      active -= 1
      return value
    }
    const findMany = vi.fn(async (args: unknown) => {
      void args
      return measured(findCall++ === 0 ? begins : [])
    })
    const groupBy = vi.fn(async (args: unknown) => {
      void args
      return measured(groupCall++ === 0
        ? begins.map(event => ({ sessaoId: event.sessaoId, _max: { createdAt: event.createdAt } }))
        : [])
    })
    const definition = createFunilMetric({ prisma: {
      sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
      eventoTracking: { findMany, groupBy },
    } as never, now: () => new Date('2026-12-01T00:00:00Z') })

    await definition.query(context, historical)

    expect(findMany).toHaveBeenCalledTimes(5)
    expect(groupBy).toHaveBeenCalledTimes(3)
    const followupFindArgs = findMany.mock.calls.slice(2).map(call => call[0] as { where: { sessaoId: { in: string[] }; createdAt: { lt: Date } } })
    const followupGroupArgs = groupBy.mock.calls.map(call => call[0] as { where: { sessaoId: { in: string[] } } })
    expect(followupFindArgs.map(arg => arg.where.sessaoId.in.length)).toEqual([200, 200, 1])
    expect(followupGroupArgs.map(arg => arg.where.sessaoId.in.length)).toEqual([200, 200, 1])
    expect(followupFindArgs[0].where.createdAt.lt).toEqual(new Date('2026-11-23T03:00:00.000Z'))
    expect(peak).toBeLessThanOrEqual(2)
  })

  it('counts the same active session in every daily bucket where it had activity', async () => {
    const multiDay = parseMetricParams(new URLSearchParams({ de: '2026-11-15', ate: '2026-11-16', agrupar: 'dia' }))
    const activity = [
      { id: 'e-1', sessaoId: 'repeat', createdAt: new Date('2026-11-15T12:00:00Z') },
      { id: 'e-2', sessaoId: 'repeat', createdAt: new Date('2026-11-16T12:00:00Z') },
    ]
    const findMany = vi.fn(async (args: { where: { tipo?: unknown } }) => args.where.tipo ? [] : activity)
    const definition = createFunilMetric({ prisma: {
      sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
      eventoTracking: { findMany, groupBy: vi.fn().mockResolvedValue([{ sessaoId: 'repeat', _max: { createdAt: activity[1].createdAt } }]) },
    } as never, now: () => at('18:00') })

    const result = await definition.query(context, multiDay)

    expect(result.serie.map(bucket => [bucket.bucket, bucket.sessoes])).toEqual([
      ['2026-11-15', 1],
      ['2026-11-16', 1],
    ])
  })

  it('paginates large activity scans serially with fixed pages and no JSON selection', async () => {
    const rows = Array.from({ length: 1001 }, (_, index) => ({ id: `e-${String(index).padStart(4, '0')}`, sessaoId: `s-${index % 10}`, createdAt: at('12:00') }))
    let active = 0
    let peak = 0
    const activityArgs: Array<Record<string, unknown>> = []
    const findMany = vi.fn(async (args: Record<string, unknown>) => {
      active += 1
      peak = Math.max(peak, active)
      await Promise.resolve()
      active -= 1
      const where = args.where as { tipo?: unknown }
      if (where.tipo) return []
      activityArgs.push(args)
      const cursor = args.cursor as { id: string } | undefined
      if (!cursor) return rows.slice(0, 500)
      const start = rows.findIndex(row => row.id === cursor.id) + 1
      return rows.slice(start, start + 500)
    })
    const definition = createFunilMetric({ prisma: {
      sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
      eventoTracking: { findMany, groupBy: vi.fn().mockResolvedValue([]) },
    } as never, now: () => at('18:00') })

    await definition.query(context, params)

    expect(activityArgs).toHaveLength(3)
    expect(activityArgs.every(args => args.take === 500)).toBe(true)
    expect(activityArgs.every(args => JSON.stringify(args.select) === JSON.stringify({ id: true, sessaoId: true, createdAt: true }))).toBe(true)
    expect(activityArgs.map(args => args.cursor ?? null)).toEqual([null, { id: 'e-0499' }, { id: 'e-0999' }])
    expect(activityArgs.every(args => JSON.stringify(args.orderBy) === JSON.stringify([{ createdAt: 'asc' }, { id: 'asc' }]))).toBe(true)
    expect(peak).toBeLessThanOrEqual(2)
  })
})
