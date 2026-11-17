import { describe, expect, it, vi } from 'vitest'
import { createMetricRegistry } from './metricas/registry'
import { createResourceRegistry } from './registry'
import { routeApiV1 } from './router'
import type { ResourceDefinition } from './resource'

describe('read-only invariant across the entire router', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('returns 405 and zero mutations for %s on every route shape', async method => {
    const mutation = vi.fn()
    const resource: ResourceDefinition = {
      slug: 'produtos', model: 'Produto', scope: 'read:catalogo', scalarFields: ['id'], fields: [{ name: 'id', type: 'string', description: 'Identificador.' }], expands: [],
      select: { id: true }, sorts: ['id'], defaultSort: 'id', adapter: { findMany: mutation, findFirst: mutation }, serialize: row => ({ id: row.id }), countAndLastUpdate: mutation,
    }
    const metric = vi.fn()
    const pipelineDeps = { authenticate: mutation, audit: mutation, lastUsed: mutation }
    const cases = [
      ['', []], ['/produtos', ['produtos']], ['/produtos/id', ['produtos', 'id']],
      ['/metricas/vendas', ['metricas', 'vendas']], ['/desconhecida/id', ['desconhecida', 'id']],
    ] as const
    for (const [path, segments] of cases) {
      const response = await routeApiV1(new Request(`https://example.test/api/v1${path}`, { method }), segments, {
        resources: createResourceRegistry([resource]),
        metrics: createMetricRegistry([{ slug: 'vendas', scope: 'read:financeiro', schema: { type: 'object' }, query: metric }]),
        pipelineDeps,
      })
      expect(response.status).toBe(405)
      expect(response.headers.get('allow')).toBe('GET, HEAD, OPTIONS')
    }
    expect(mutation).not.toHaveBeenCalled()
    expect(metric).not.toHaveBeenCalled()
  })
})
