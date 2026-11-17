import { describe, expect, it, vi } from 'vitest'
import { createMetricRegistry, createStoreMetricRegistry } from './metricas/registry'
import { createResourceRegistry } from './registry'
import type { ResourceDefinition } from './resource'
import { createStoreResourceRegistry, routeApiV1, type RouterDeps } from './router'
import type { ApiIdentity } from './types'
import * as rootRoute from '../../app/api/v1/route'
import * as catchAllRoute from '../../app/api/v1/[...segments]/route'

const identity = (scopes: ApiIdentity['scopes'] = new Set(['read:all'])): ApiIdentity => ({
  id: 'key-id',
  nome: 'Programa externo',
  prefixo: 'sxs_live_safe_pref',
  scopes,
  expiraEm: null,
})

function pipelineDeps(currentIdentity = identity()) {
  return {
    authenticate: vi.fn().mockResolvedValue(currentIdentity),
    audit: vi.fn().mockResolvedValue(undefined),
    lastUsed: vi.fn().mockResolvedValue(undefined),
  }
}

function request(path = '', method = 'GET') {
  return new Request(`https://example.test/api/v1${path}`, { method, headers: { 'x-request-id': 'untrusted' } })
}

function rowResource(overrides: Partial<ResourceDefinition> = {}): ResourceDefinition {
  return {
    slug: 'produtos',
    model: 'Produto',
    scope: 'read:catalogo',
    scalarFields: ['id', 'nome', 'custo', 'updatedAt'],
    publicFields: ['nome'],
    fields: [
      { name: 'id', type: 'string' },
      { name: 'nome', type: 'string', description: 'Nome comercial seguro.' },
      { name: 'custo', type: 'string', format: 'decimal', scope: 'read:financeiro' },
      { name: 'updatedAt', type: 'string', format: 'date-time' },
    ],
    expands: [],
    select: { id: true, nome: true, custo: true, updatedAt: true },
    sorts: ['id', 'updatedAt'],
    defaultSort: 'updatedAt',
    dateFields: { updated: 'updatedAt' },
    adapter: {
      findMany: vi.fn(async () => [{ id: 'product-1', nome: 'Produto público', custo: '10.00', updatedAt: new Date('2026-11-16T12:00:00.000Z') }]),
      findFirst: vi.fn(async args => args.where.id === 'missing' ? null : { id: String(args.where.id), nome: 'Produto público', custo: '10.00', updatedAt: new Date('2026-11-16T12:00:00.000Z') }),
    },
    serialize: row => ({ id: row.id, nome: row.nome, custo: row.custo, updatedAt: (row.updatedAt as Date).toISOString() }),
    countAndLastUpdate: vi.fn().mockResolvedValue({ count: 1, ultimaAtualizacao: '2026-11-16T12:00:00.000Z' }),
    ...overrides,
  }
}

function deps(overrides: Partial<RouterDeps> = {}): RouterDeps {
  return {
    resources: createResourceRegistry([rowResource()]),
    metrics: createMetricRegistry([{
      slug: 'funil', scope: 'read:analytics', schema: { type: 'object' },
      query: vi.fn().mockResolvedValue({ tracked: true, timezone: 'America/Sao_Paulo' }),
    }]),
    pipelineDeps: pipelineDeps(),
    healthCheck: vi.fn().mockResolvedValue(undefined),
    publicRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: Date.parse('2026-11-16T20:01:00.000Z') }),
    env: { RAILWAY_GIT_COMMIT_SHA: 'railway-commit' },
    openApiDocument: vi.fn().mockResolvedValue({ openapi: '3.1.0', paths: {} }),
    metaTimeoutMs: 100,
    ...overrides,
  }
}

async function json<T = Record<string, unknown>>(response: Response): Promise<T> {
  return JSON.parse(await response.text()) as T
}

function expectSafeHeaders(response: Response, cacheControl = 'no-store') {
  expect(response.headers.get('cache-control')).toBe(cacheControl)
  expect(response.headers.get('x-request-id')).toBeTruthy()
  expect(response.headers.get('x-request-id')).not.toBe('untrusted')
  expect([...response.headers.keys()].some(name => name.startsWith('access-control-'))).toBe(false)
}

describe('public API v1 routes', () => {
  it('checks the database and returns exact health metadata with Railway commit precedence', async () => {
    const healthCheck = vi.fn().mockResolvedValue(undefined)
    const response = await routeApiV1(request('/health'), ['health'], deps({
      healthCheck,
      env: { RAILWAY_GIT_COMMIT_SHA: 'railway-sha', VERCEL_GIT_COMMIT_SHA: 'vercel-sha' },
      now: () => new Date('2026-11-16T20:00:00.000Z'),
    }))
    expect(response.status).toBe(200)
    expect(await json(response)).toEqual({ status: 'ok', version: '1.0.0', commit: 'railway-sha', time: '2026-11-16T20:00:00.000Z' })
    expect(healthCheck).toHaveBeenCalledOnce()
    expectSafeHeaders(response)
  })

  it('returns an RFC problem 503 without leaking a database failure', async () => {
    const response = await routeApiV1(request('/health'), ['health'], deps({ healthCheck: vi.fn().mockRejectedValue(new Error('private database hostname')) }))
    expect(response.status).toBe(503)
    expect(response.headers.get('content-type')).toContain('application/problem+json')
    expect((await response.text()).includes('private database hostname')).toBe(false)
    expectSafeHeaders(response)
  })

  it('collapses repeated health probes into one short-lived database check', async () => {
    const healthCheck = vi.fn().mockResolvedValue(undefined)
    const current = deps({ healthCheck, now: () => new Date('2026-11-16T20:00:00.000Z') })
    const [first, second] = await Promise.all([
      routeApiV1(request('/health'), ['health'], current),
      routeApiV1(request('/health'), ['health'], current),
    ])
    expect([first.status, second.status]).toEqual([200, 200])
    expect(healthCheck).toHaveBeenCalledOnce()
  })

  it('keeps only root links, health, OpenAPI and docs public', async () => {
    const pipeline = pipelineDeps()
    const current = deps({ pipelineDeps: pipeline })
    for (const [segments, path] of [[[], ''], [['health'], '/health'], [['openapi.json'], '/openapi.json'], [['docs'], '/docs']] as const) {
      const response = await routeApiV1(request(path), [...segments], current)
      expect(response.status).toBe(200)
      expectSafeHeaders(response, path === '/openapi.json' || path === '/docs' ? 'public, max-age=3600, stale-while-revalidate=86400' : 'no-store')
    }
    expect(pipeline.authenticate).not.toHaveBeenCalled()
    expect(await json(await routeApiV1(request(), [], current))).toMatchObject({ data: { links: { health: '/api/v1/health', openapi: '/api/v1/openapi.json', docs: '/api/v1/docs' } } })
    expect((await routeApiV1(request('/docs'), ['docs'], current)).headers.get('content-type')).toContain('text/html')
  })

  it('serves static docs without third-party scripts or an interactive bearer field', async () => {
    const response = await routeApiV1(request('/docs'), ['docs'], deps())
    const body = await response.text()
    expect(body).toContain('/api/v1/openapi.json')
    expect(body).not.toMatch(/<script|cdn\.jsdelivr|api-reference/i)
    expect(response.headers.get('content-security-policy')).toBe("default-src 'none'; base-uri 'none'; frame-ancestors 'none'")
  })

  it('rate-limits public endpoints before database or OpenAPI work', async () => {
    const publicRateLimit = vi.fn().mockResolvedValue({ success: false, limit: 60, remaining: 0, reset: Date.now() + 60_000 })
    const healthCheck = vi.fn()
    const openApiDocument = vi.fn()
    const current = deps({ publicRateLimit, healthCheck, openApiDocument })

    for (const [segments, path] of [[['health'], '/health'], [['openapi.json'], '/openapi.json'], [['docs'], '/docs']] as const) {
      const response = await routeApiV1(request(path), [...segments], current)
      expect(response.status).toBe(429)
    }
    expect(publicRateLimit).toHaveBeenCalledTimes(3)
    expect(healthCheck).not.toHaveBeenCalled()
    expect(openApiDocument).not.toHaveBeenCalled()
  })

  it('rejects unknown or duplicate query parameters on root and health before database work', async () => {
    const healthCheck = vi.fn().mockResolvedValue(undefined)
    expect((await routeApiV1(request('?extra=1'), [], deps({ healthCheck }))).status).toBe(400)
    expect((await routeApiV1(request('/health?probe=1'), ['health'], deps({ healthCheck }))).status).toBe(400)
    expect((await routeApiV1(request('/health?probe=1&probe=2'), ['health'], deps({ healthCheck }))).status).toBe(400)
    expect(healthCheck).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid OpenAPI query parameters before generating the document', async () => {
    const openApiDocument = vi.fn()
    const response = await routeApiV1(request('/openapi.json?extra=1'), ['openapi.json'], deps({ openApiDocument }))
    expect(response.status).toBe(400)
    expect(openApiDocument).not.toHaveBeenCalled()
  })
})

describe('authenticated dispatcher', () => {
  it('returns /me with a non-expiring contract and no quota balance', async () => {
    const response = await routeApiV1(request('/me'), ['me'], deps())
    expect(response.status).toBe(200)
    const body = await json<{ data: Record<string, unknown> }>(response)
    expect(body.data).toEqual({
      nome: 'Programa externo', prefixo: 'sxs_live_safe_pref', escopos: ['read:all'], expiraEm: null, semLimite: true,
    })
    expect(JSON.stringify(body)).not.toMatch(/hash|ultimoIp|\"ip\"|key-id/i)
    expectSafeHeaders(response)
  })

  it('lists only authorized metadata, hides unauthorized fields/expands and caps hook concurrency at two', async () => {
    let active = 0
    let peak = 0
    const catalogIdentity = identity(new Set(['read:catalogo']))
    const analyticsChild = rowResource({ slug: 'eventos', model: 'Evento', scope: 'read:analytics' })
    const definitions = Array.from({ length: 9 }, (_, index) => rowResource({
      slug: `produto-${index}`,
      model: `Produto${index}`,
      expands: index === 0 ? [{ name: 'eventos', many: true, resource: () => analyticsChild, scope: 'read:analytics' }] : [],
      countAndLastUpdate: vi.fn(async () => {
        active += 1
        peak = Math.max(peak, active)
        await new Promise(resolve => setTimeout(resolve, 5))
        active -= 1
        return { count: index, ultimaAtualizacao: '2026-11-16T12:00:00.000Z' }
      }),
    }))
    const response = await routeApiV1(request('/meta/recursos'), ['meta', 'recursos'], deps({
      resources: createResourceRegistry([...definitions, analyticsChild]),
      pipelineDeps: pipelineDeps(catalogIdentity),
    }))
    expect(response.status).toBe(200)
    const body = await json<{ data: Array<{ fields: Array<{ name: string }>; expands: unknown[] } & Record<string, unknown>> }>(response)
    expect(peak).toBe(2)
    expect(body.data).toHaveLength(9)
    expect(body.data[0]).toMatchObject({ slug: 'produto-0', model: 'Produto0', scope: 'read:catalogo', count: 0, ultimaAtualizacao: '2026-11-16T12:00:00.000Z' })
    expect(body.data[0].sync).toEqual({ sort: 'updatedAt', watermarkField: 'updatedAt', from: 'atualizadoDesde', to: 'atualizadoAte', maxDays: null, maxLimit: 500 })
    expect(body.data[0].fields.map((field: { name: string }) => field.name)).toEqual(['id', 'nome', 'updatedAt'])
    expect(body.data[0].expands).toEqual([])
    expect(JSON.stringify(body)).not.toContain('read:financeiro')
    expect(JSON.stringify(body)).not.toContain('read:analytics')
  })

  it('collapses concurrent metadata requests with the same registry and scopes', async () => {
    const countAndLastUpdate = vi.fn().mockResolvedValue({ count: 1, ultimaAtualizacao: null })
    const registry = createResourceRegistry([rowResource({ countAndLastUpdate })])
    const current = deps({ resources: registry })
    const [first, second] = await Promise.all([
      routeApiV1(request('/meta/recursos'), ['meta', 'recursos'], current),
      routeApiV1(request('/meta/recursos'), ['meta', 'recursos'], current),
    ])
    expect([first.status, second.status]).toEqual([200, 200])
    expect(countAndLastUpdate).toHaveBeenCalledOnce()
  })

  it('drains active metadata operations after the deadline and starts no later hooks', async () => {
    let activeOps = 0
    let peakOps = 0
    let startedHooks = 0
    const operation = async () => {
      activeOps += 1
      peakOps = Math.max(peakOps, activeOps)
      await new Promise(resolve => setTimeout(resolve, 30))
      activeOps -= 1
    }
    const definitions = Array.from({ length: 8 }, (_, index) => rowResource({
      slug: `produto-timeout-${index}`,
      countAndLastUpdate: async () => {
        startedHooks += 1
        await Promise.all([operation(), operation()])
        return { count: 1, ultimaAtualizacao: null }
      },
    }))
    const response = await routeApiV1(request('/meta/recursos'), ['meta', 'recursos'], deps({ resources: createResourceRegistry(definitions), metaTimeoutMs: 5 }))
    expect(response.status).toBe(503)
    expect(peakOps).toBeLessThanOrEqual(4)
    expect(activeOps).toBe(0)
    expect(startedHooks).toBe(2)
    expect(response.headers.get('content-type')).toContain('application/problem+json')
  })

  it('rejects unknown or duplicate query parameters on me, metadata and metrics', async () => {
    expect((await routeApiV1(request('/me?extra=1'), ['me'], deps())).status).toBe(400)
    expect((await routeApiV1(request('/meta/recursos?extra=1'), ['meta', 'recursos'], deps())).status).toBe(400)

    const metricQuery = vi.fn().mockResolvedValue({ tracked: true })
    const current = deps({
      metrics: createMetricRegistry([{ slug: 'funil', scope: 'read:analytics', schema: { type: 'object' }, query: metricQuery }]),
    })
    expect((await routeApiV1(request('/metricas/funil?de=2026-11-16&ate=2026-11-16&agrupar=dia&extra=1'), ['metricas', 'funil'], current)).status).toBe(400)
    expect((await routeApiV1(request('/metricas/funil?de=2026-11-16&de=2026-11-17&ate=2026-11-17&agrupar=dia'), ['metricas', 'funil'], current)).status).toBe(400)
    expect(metricQuery).not.toHaveBeenCalled()
  })

  it('dispatches list, item and metrics only through explicit registries', async () => {
    const resource = rowResource()
    const metricQuery = vi.fn().mockResolvedValue({ tracked: true })
    const current = deps({
      resources: createResourceRegistry([resource]),
      metrics: createMetricRegistry([{ slug: 'funil', scope: 'read:analytics', schema: { type: 'object' }, query: metricQuery }]),
    })
    const list = await routeApiV1(request('/produtos?fields=nome'), ['produtos'], current)
    expect(list.status).toBe(200)
    expect((await json<{ data: unknown[] }>(list)).data).toEqual([{ id: 'product-1', nome: 'Produto público' }])
    const item = await routeApiV1(request('/produtos/product-1?fields=nome'), ['produtos', 'product-1'], current)
    expect(item.status).toBe(200)
    expect((await json<{ data: Record<string, unknown> }>(item)).data).toEqual({ id: 'product-1', nome: 'Produto público' })
    const metric = await routeApiV1(request('/metricas/funil?de=2026-11-16&ate=2026-11-16&agrupar=dia'), ['metricas', 'funil'], current)
    expect(metric.status).toBe(200)
    expect((await json<{ data: Record<string, unknown> }>(metric)).data).toEqual({ tracked: true })
    expect(metricQuery).toHaveBeenCalledOnce()
    expect(resource.adapter.findMany).toHaveBeenCalledOnce()
    expect(resource.adapter.findFirst).toHaveBeenCalledOnce()
  })

  it('never rate-limits a valid key after more than 10 metric requests', async () => {
    const metricQuery = vi.fn().mockResolvedValue({ tracked: true })
    let attempts = 0
    const metricRateLimit = vi.fn().mockImplementation(async () => ({ success: ++attempts <= 10, limit: 10, remaining: Math.max(0, 10 - attempts), reset: Date.now() + 60_000 }))
    const current = deps({
      metrics: createMetricRegistry([{ slug: 'funil', scope: 'read:analytics', schema: { type: 'object' }, query: metricQuery }]),
      metricRateLimit,
    } as never)
    const statuses: number[] = []
    for (let index = 0; index < 11; index += 1) statuses.push((await routeApiV1(request('/metricas/funil?de=2026-11-16&ate=2026-11-16&agrupar=dia'), ['metricas', 'funil'], current)).status)

    expect(statuses).toEqual(Array(11).fill(200))
    expect(metricRateLimit).not.toHaveBeenCalled()
    expect(metricQuery).toHaveBeenCalledTimes(11)
  })

  it('returns RFC 404 for a missing item and 400 for unsupported item query parameters', async () => {
    const resource = rowResource()
    const current = deps({ resources: createResourceRegistry([resource]) })
    const missing = await routeApiV1(request('/produtos/missing'), ['produtos', 'missing'], current)
    expect(missing.status).toBe(404)
    expect(missing.headers.get('content-type')).toContain('application/problem+json')
    const invalid = await routeApiV1(request('/produtos/product-1?q=private'), ['produtos', 'product-1'], current)
    expect(invalid.status).toBe(400)
    expect(resource.adapter.findFirst).toHaveBeenCalledTimes(1)
  })

  it('authenticates every other GET, including unknown paths, without resolving a Prisma model from the URL', async () => {
    const pipeline = pipelineDeps()
    const resource = rowResource()
    const response = await routeApiV1(request('/constructor/private-id'), ['constructor', 'private-id'], deps({ resources: createResourceRegistry([resource]), pipelineDeps: pipeline }))
    expect(response.status).toBe(404)
    expect(pipeline.authenticate).toHaveBeenCalledOnce()
    expect(resource.adapter.findMany).not.toHaveBeenCalled()
    expect(resource.adapter.findFirst).not.toHaveBeenCalled()
  })
})

describe('HTTP method policy', () => {
  it('implements HEAD with GET status/headers and an empty body', async () => {
    const healthCheck = vi.fn().mockResolvedValue(undefined)
    const response = await routeApiV1(request('/health', 'HEAD'), ['health'], deps({ healthCheck }))
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('')
    expect(healthCheck).toHaveBeenCalledOnce()
    expectSafeHeaders(response)
  })

  it('returns OPTIONS 204 with exact Allow and no auth, database or CORS', async () => {
    const pipeline = pipelineDeps()
    const healthCheck = vi.fn()
    const response = await routeApiV1(request('/produtos', 'OPTIONS'), ['produtos'], deps({ pipelineDeps: pipeline, healthCheck }))
    expect(response.status).toBe(204)
    expect(response.headers.get('allow')).toBe('GET, HEAD, OPTIONS')
    expect(await response.text()).toBe('')
    expect(pipeline.authenticate).not.toHaveBeenCalled()
    expect(healthCheck).not.toHaveBeenCalled()
    expectSafeHeaders(response)
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('returns RFC 405 for %s before all Prisma-backed auth/audit/resource calls', async method => {
    const pipeline = pipelineDeps()
    const healthCheck = vi.fn()
    const resource = rowResource()
    const response = await routeApiV1(request('/produtos/product-1', method), ['produtos', 'product-1'], deps({ resources: createResourceRegistry([resource]), pipelineDeps: pipeline, healthCheck }))
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, HEAD, OPTIONS')
    expect(response.headers.get('content-type')).toContain('application/problem+json')
    expect(pipeline.authenticate).not.toHaveBeenCalled()
    expect(pipeline.audit).not.toHaveBeenCalled()
    expect(pipeline.lastUsed).not.toHaveBeenCalled()
    expect(healthCheck).not.toHaveBeenCalled()
    expect(resource.adapter.findMany).not.toHaveBeenCalled()
    expect(resource.adapter.findFirst).not.toHaveBeenCalled()
    expectSafeHeaders(response)
  })
})

describe('store registry and Next route integration', () => {
  it('keeps actual Prisma metadata operations at four across six registered resources', async () => {
    let activeOps = 0
    let peakOps = 0
    const operation = async <T,>(value: T): Promise<T> => {
      activeOps += 1
      peakOps = Math.max(peakOps, activeOps)
      await new Promise(resolve => setTimeout(resolve, 5))
      activeOps -= 1
      return value
    }
    const delegate = (field: 'createdAt' | 'updatedAt') => ({
      count: () => operation(1),
      findFirst: () => operation({ [field]: new Date('2026-11-16T12:00:00.000Z') }),
    })
    const prisma = {
      cliente: delegate('updatedAt'), endereco: delegate('updatedAt'), historicoPontos: delegate('createdAt'),
      pontosCliente: delegate('updatedAt'), cashbackTransacao: delegate('updatedAt'), nivelFidelidade: delegate('updatedAt'),
    }
    const response = await routeApiV1(request('/meta/recursos'), ['meta', 'recursos'], deps({
      resources: createStoreResourceRegistry({ prisma: prisma as never }),
      pipelineDeps: pipelineDeps(identity(new Set(['read:clientes']))),
    }))
    expect(response.status).toBe(200)
    expect((await json<{ data: unknown[] }>(response)).data).toHaveLength(6)
    expect(peakOps).toBeLessThanOrEqual(4)
    expect(activeOps).toBe(0)
  })

  it('integrates exactly all 49 business resources and eight metrics without broadening scopes', () => {
    const resources = createStoreResourceRegistry({ prisma: {} as never })
    const metrics = createStoreMetricRegistry({ prisma: {} as never })
    expect(resources.size).toBe(49)
    expect(metrics.size).toBe(8)
    const grouped = Object.fromEntries(['read:clientes', 'read:catalogo', 'read:configuracoes', 'read:pedidos', 'read:marketing', 'read:mensagens', 'read:analytics', 'read:auditoria'].map(scope => [scope, resources.list().filter(resource => resource.scope === scope).map(resource => resource.slug).sort()]))
    expect(grouped).toEqual({
      'read:clientes': ['cashback-transacoes', 'clientes', 'enderecos', 'historico-pontos', 'niveis-fidelidade', 'pontos-clientes'],
      'read:catalogo': ['avaliacoes', 'avaliacoes-fotos', 'avaliacoes-parceiros', 'banners', 'formas-pagamento', 'frete-regras', 'popup-inicial', 'produtos', 'produtos-destaques', 'variacoes-produto'],
      'read:configuracoes': ['configuracoes', 'email-templates', 'whatsapp-numeros'],
      'read:pedidos': ['carrinhos', 'carrinhos-clientes', 'cupons', 'cupons-usos', 'garantias-estendidas', 'itens-carrinho', 'itens-pedido', 'pagamentos', 'pedidos', 'tentativas-multimetodo'],
      'read:marketing': ['campanhas', 'campanhas-destinatarios', 'envios-logs', 'lista-espera', 'solicitacoes-parceiros'],
      'read:mensagens': ['luna-conversas', 'luna-mensagens', 'mensagens-contato'],
      'read:analytics': ['clientes-insights', 'cookies-consentimentos', 'eventos-analiticos', 'eventos-tracking', 'presencas', 'relatorios-venda-hora', 'sessoes-visitantes', 'trafego-bruto'],
      'read:auditoria': ['auditoria', 'bloqueios-fraude', 'bloqueios-ip', 'tentativas-login'],
    })
    expect(metrics.list().map(metric => [metric.slug, metric.scope])).toEqual([
      ['vendas', 'read:financeiro'], ['funil', 'read:analytics'], ['carrinhos', 'read:analytics'],
      ['cupons-cashback-fidelidade', 'read:financeiro'], ['frete', 'read:financeiro'],
      ['avaliacoes', 'read:analytics'], ['estoque-catalogo', 'read:analytics'], ['clientes', 'read:financeiro'],
    ])
    expect(resources.list().every(resource => typeof resource.countAndLastUpdate === 'function')).toBe(true)
    for (const resource of resources.list()) for (const expand of resource.expands) expect(expand.resource()).toBe(resources.get(expand.resource().slug))
  })

  it('counts only allowlisted public configuration rows in metadata', async () => {
    const count = vi.fn().mockResolvedValue(2)
    const findFirst = vi.fn().mockResolvedValue({ updatedAt: new Date('2026-11-16T12:00:00.000Z') })
    const resources = createStoreResourceRegistry({ prisma: { configuracao: { count, findFirst } } as never })
    const definition = resources.get('configuracoes')!
    const result = await definition.countAndLastUpdate!({
      requestId: 'request-id', identity: identity(new Set(['read:configuracoes'])), ip: 'unknown', startedAt: 0,
    })
    expect(result).toEqual({ count: 2, ultimaAtualizacao: '2026-11-16T12:00:00.000Z' })
    expect(count.mock.calls[0][0].where.chave.in).toContain('loja_nome')
    expect(findFirst.mock.calls[0][0].where).toEqual(count.mock.calls[0][0].where)
  })

  it('exports every explicit method from root and catch-all route handlers', async () => {
    for (const route of [rootRoute, catchAllRoute]) for (const method of ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']) expect(typeof route[method as keyof typeof route]).toBe('function')
    expect((await rootRoute.OPTIONS(request('', 'OPTIONS'))).status).toBe(204)
    expect((await rootRoute.POST(request('', 'POST'))).status).toBe(405)
    const context = { params: Promise.resolve({ segments: ['produtos'] }) }
    expect((await catchAllRoute.OPTIONS(request('/produtos', 'OPTIONS'), context)).status).toBe(204)
    expect((await catchAllRoute.DELETE(request('/produtos', 'DELETE'), context)).status).toBe(405)
  })
})
