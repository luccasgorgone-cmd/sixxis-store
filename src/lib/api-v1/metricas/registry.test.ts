import { describe, expect, it, vi } from 'vitest'
import { ApiQueryError } from '../query'
import type { ApiContext, ApiIdentity } from '../types'
import { createMetricRegistry, createStoreMetricRegistry, type MetricDefinition } from './registry'

function context(scopes: ApiIdentity['scopes'], id = 'key-1'): ApiContext {
  return {
    requestId: 'req-registry',
    identity: { id, nome: 'test', prefixo: 'sxs_live_test', scopes, expiraEm: null },
    ip: '127.0.0.1', startedAt: 0,
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

  it('drains an already-started metric query before returning timeout', async () => {
    vi.useFakeTimers()
    let resolveQuery!: (value: { ok: true }) => void
    const pending = new Promise<{ ok: true }>(resolve => { resolveQuery = resolve })
    const registry = createMetricRegistry([{ slug: 'teste', scope: 'read:analytics', schema: { type: 'object' }, query: () => pending }])
    const result = registry.execute('teste', context(new Set(['read:analytics'])), query)
    let settled = false
    const observed = result.then(value => { settled = true; return value }, error => { settled = true; throw error })
    const assertion = expect(observed).rejects.toMatchObject({ status: 503 })
    await vi.advanceTimersByTimeAsync(10_001)
    await Promise.resolve()
    expect(settled).toBe(false)
    resolveQuery({ ok: true })
    await assertion
    vi.useRealTimers()
  })

  it('rejects excess in-process metric concurrency before starting database work', async () => {
    const resolvers: Array<(value: { ok: true }) => void> = []
    const handler = vi.fn(() => new Promise<{ ok: true }>(resolve => { resolvers.push(resolve) }))
    const registry = createMetricRegistry([{ slug: 'teste', scope: 'read:analytics', schema: { type: 'object' }, query: handler }])

    const first = registry.execute('teste', context(new Set(['read:analytics']), 'key-1'), query)
    const second = registry.execute('teste', context(new Set(['read:analytics']), 'key-2'), query)
    await expect(registry.execute('teste', context(new Set(['read:analytics']), 'key-3'), query)).rejects.toMatchObject({ status: 503 })
    expect(handler).toHaveBeenCalledTimes(2)

    resolvers.forEach(resolve => resolve({ ok: true }))
    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }])
  })

  it('prevents one API key from occupying every in-process metric slot', async () => {
    const resolvers: Array<(value: { ok: true }) => void> = []
    const handler = vi.fn(() => new Promise<{ ok: true }>(resolve => { resolvers.push(resolve) }))
    const registry = createMetricRegistry([{ slug: 'teste', scope: 'read:analytics', schema: { type: 'object' }, query: handler }])

    const first = registry.execute('teste', context(new Set(['read:analytics']), 'key-a'), query)
    let sameKeySettled = false
    const sameKey = registry.execute('teste', context(new Set(['read:analytics']), 'key-a'), query).then(
      () => ({ status: 200 }),
      (error: ApiQueryError) => ({ status: error.status }),
    ).finally(() => { sameKeySettled = true })
    const otherKey = registry.execute('teste', context(new Set(['read:analytics']), 'key-b'), query)
    await new Promise(resolve => setTimeout(resolve, 0))

    try {
      expect(sameKeySettled).toBe(true)
      await expect(sameKey).resolves.toEqual({ status: 503 })
      expect(handler).toHaveBeenCalledTimes(2)
    } finally {
      resolvers.forEach(resolve => resolve({ ok: true }))
      await Promise.allSettled([first, sameKey, otherKey])
    }
  })
})
