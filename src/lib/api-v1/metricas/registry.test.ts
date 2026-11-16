import { describe, expect, it, vi } from 'vitest'
import { ApiQueryError } from '../query'
import type { ApiContext, ApiIdentity } from '../types'
import { createMetricRegistry, createStoreMetricRegistry, type MetricDefinition } from './registry'

function context(scopes: ApiIdentity['scopes']): ApiContext {
  return {
    requestId: 'req-registry',
    identity: { id: 'key-1', nome: 'test', prefixo: 'sxs_live_test', scopes, expiraEm: null },
    ip: '127.0.0.1', startedAt: 0, rateLimit: { success: true, limit: 600, remaining: 599, reset: 0 },
  }
}

const query = new URLSearchParams({ de: '2026-11-16', ate: '2026-11-16', agrupar: 'dia' })

describe('metric registry', () => {
  it('registers all eight endpoint families with explicit scopes', () => {
    const registry = createStoreMetricRegistry({ prisma: {} as never })

    expect(registry.list().map(metric => [metric.slug, metric.scope])).toEqual([
      ['vendas', 'read:financeiro'],
      ['funil', 'read:analytics'],
      ['carrinhos', 'read:analytics'],
      ['cupons-cashback-fidelidade', 'read:financeiro'],
      ['frete', 'read:financeiro'],
      ['avaliacoes', 'read:analytics'],
      ['estoque-catalogo', 'read:analytics'],
      ['clientes', 'read:financeiro'],
    ])
  })

  it('enforces metric scope while read:all satisfies domain scopes', async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true })
    const definition = { slug: 'teste', scope: 'read:financeiro', schema: { type: 'object' }, query: handler } satisfies MetricDefinition
    const registry = createMetricRegistry([definition])

    await expect(registry.execute('teste', context(new Set(['read:analytics'])), query)).rejects.toMatchObject({ status: 403 })
    await expect(registry.execute('teste', context(new Set(['read:all'])), query)).resolves.toEqual({ ok: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid dates before invoking a metric query', async () => {
    const handler = vi.fn()
    const registry = createMetricRegistry([{ slug: 'teste', scope: 'read:analytics', schema: { type: 'object' }, query: handler }])

    await expect(registry.execute('teste', context(new Set(['read:analytics'])), new URLSearchParams({ de: '2026-11-16', ate: '2026-11-16' }))).rejects.toBeInstanceOf(ApiQueryError)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects duplicate or malformed metric slugs', () => {
    const base = { scope: 'read:analytics', schema: { type: 'object' }, query: vi.fn() } as const
    expect(() => createMetricRegistry([{ slug: 'x', ...base }, { slug: 'x', ...base }])).toThrow(TypeError)
    expect(() => createMetricRegistry([{ slug: '../x', ...base }])).toThrow(TypeError)
  })
})
