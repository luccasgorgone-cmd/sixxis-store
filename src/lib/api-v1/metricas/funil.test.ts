import { describe, expect, it, vi } from 'vitest'
import type { ApiContext } from '../types'
import { createFunilMetric } from './funil'
import { parseMetricParams } from './tempo'

const context = { requestId: 'req-funil', identity: null, ip: '127.0.0.1', startedAt: 0, rateLimit: { success: true, limit: 600, remaining: 599, reset: 0 } } satisfies ApiContext
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
      prisma: { sessaoVisitante: { findMany: sessaoFindMany }, eventoTracking: { findMany: eventoFindMany } } as never,
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
    expect(eventoFindMany).toHaveBeenCalledTimes(1)
  })

  it('treats exactly one hour of inactivity as commercial abandonment and technical outcome as dominant', async () => {
    const definition = createFunilMetric({
      prisma: {
        sessaoVisitante: { findMany: vi.fn().mockResolvedValue([{ sessaoId: 'boundary', createdAt: at('10:00') }, { sessaoId: 'technical', createdAt: at('10:00') }]) },
        eventoTracking: { findMany: vi.fn().mockResolvedValue([
          { sessaoId: 'boundary', tipo: 'begin_checkout', dados: null, createdAt: at('17:00') },
          { sessaoId: 'technical', tipo: 'begin_checkout', dados: null, createdAt: at('16:00') },
          { sessaoId: 'technical', tipo: 'checkout_payment_outcome', dados: { outcome: 'api_error' }, createdAt: at('17:30') },
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
        eventoTracking: { findMany: vi.fn().mockResolvedValue([{ sessaoId: 'carried-session', tipo: 'view_item', dados: null, createdAt: at('12:00') }]) },
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
        eventoTracking: { findMany: vi.fn().mockResolvedValue([{ sessaoId: 'orphan-purchase', tipo: 'purchase', dados: { transaction_id: 'p1' }, createdAt: at('12:00') }]) },
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
      .mockResolvedValueOnce([{ sessaoId: 'late-conversion', tipo: 'purchase', dados: { transaction_id: 'p-late' }, createdAt: new Date('2026-11-16T10:00:00Z') }])
    const definition = createFunilMetric({
      prisma: {
        sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
        eventoTracking: { findMany: eventoFindMany },
      } as never,
      now: () => new Date('2026-11-16T18:00:00Z'),
    })

    const result = await definition.query(context, historical)

    expect(result.abandonoCheckout).toEqual({ comercial: 0, tecnico: 0, emAndamento: 0 })
    expect(eventoFindMany).toHaveBeenCalledTimes(2)
    expect(eventoFindMany.mock.calls[1][0].where).toMatchObject({
      sessaoId: { in: ['late-conversion'] },
    })
    expect(eventoFindMany.mock.calls[1][0].where).not.toHaveProperty('tipo')
  })

  it('counts an old session active through page_view and uses later search as its activity clock only', async () => {
    const eventoFindMany = vi.fn().mockResolvedValue([
        { sessaoId: 'old-active', tipo: 'page_view', dados: null, createdAt: at('12:00') },
        { sessaoId: 'checkout-active', tipo: 'begin_checkout', dados: null, createdAt: at('15:00') },
        { sessaoId: 'checkout-active', tipo: 'search', dados: null, createdAt: at('17:30') },
      ])
    const definition = createFunilMetric({ prisma: {
      sessaoVisitante: { findMany: vi.fn().mockResolvedValue([]) },
      eventoTracking: { findMany: eventoFindMany },
    } as never, now: () => at('18:00') })

    const result = await definition.query(context, params)

    expect(result.etapas.map(stage => stage.sessoes)).toEqual([2, 0, 0, 0, 0, 0])
    expect(result.abandonoCheckout).toEqual({ comercial: 0, tecnico: 0, emAndamento: 1 })
    expect(eventoFindMany.mock.calls[0][0].where).not.toHaveProperty('tipo')
  })
})
