import { describe, expect, it, vi } from 'vitest'
import { redactValue } from './redact'
import { executeItem, executeList, type ResourceDefinition, type ResourceQueryArgs } from './resource'
import { fixture, context, options } from './resources/fixtures.test-support'
import { createStoreMetricRegistry } from './metricas/registry'
import { createStoreResourceRegistry, routeApiV1 } from './router'
import type { ListQuery } from './types'

const forbiddenKey = /^(?:senha|password|hash|token|secret|accessToken|refreshToken|apiKey|webhookSecret|rawResponse|qrCode|idempotencyKey)$/i
const forbiddenValue = /(?:DO-NOT-LEAK|PASSWORD-|RAW-|UNKNOWN-|Bearer\s+[A-Za-z0-9._~-]{12,}|\b4\d{15}\b)/i

function assertLeakFree(value: unknown): void {
  const visit = (current: unknown): void => {
    if (typeof current === 'string') expect(current).not.toMatch(forbiddenValue)
    if (Array.isArray(current)) return current.forEach(visit)
    if (!current || typeof current !== 'object') return
    for (const [key, child] of Object.entries(current)) {
      expect(key).not.toMatch(forbiddenKey)
      visit(child)
    }
  }
  visit(value)
}

function selectedRow(definition: ResourceDefinition, select: Record<string, unknown>): Record<string, unknown> {
  const row = fixture(definition.model)
  for (const expand of definition.expands) {
    const relation = expand.relation ?? expand.name
    if (!Object.hasOwn(select, relation)) continue
    const child = expand.resource()
    const childRow = fixture(child.model)
    row[relation] = expand.many ? [childRow] : childRow
  }
  return row
}

function completeQuery(definition: ResourceDefinition): ListQuery {
  const query: ListQuery = {
    limit: 1,
    sort: definition.defaultSort ?? definition.sorts[0] ?? 'id',
    filters: {},
    expand: [],
  }
  if (definition.window) {
    query[definition.window.from] = new Date('2026-01-01T00:00:00.000Z')
    query[definition.window.to] = new Date('2026-01-02T00:00:00.000Z')
  }
  return query
}

describe('complete anti-leak sweep', () => {
  it('requires read:pii for private session and user identity fields and filters', () => {
    const privateIdentity = /^(?:sessionId|sessaoId|userId)$/
    const registry = createStoreResourceRegistry({ prisma: {} as never })
    for (const definition of registry.list()) {
      for (const field of definition.fields.filter(item => privateIdentity.test(item.name))) {
        expect(field.scope, `${definition.slug}.${field.name} field`).toBe('read:pii')
      }
      for (const [name, filter] of Object.entries(definition.filters ?? {}).filter(([name]) => privateIdentity.test(name))) {
        expect(filter.scope, `${definition.slug}.${name} filter`).toBe('read:pii')
      }
    }
  })

  it('traverses list, detail and every expand of all 49 resources with total scopes', async () => {
    const registry = createStoreResourceRegistry({ prisma: {} as never })
    expect(registry.size).toBe(49)
    for (const definition of registry.list()) {
      const adapter = {
        findMany: vi.fn(async (args: ResourceQueryArgs) => [selectedRow(definition, args.select)]),
        findFirst: vi.fn(async (args: Pick<ResourceQueryArgs, 'where'|'select'>) => selectedRow(definition, args.select)),
      }
      const testDefinition = { ...definition, adapter }
      const query = completeQuery(definition)
      assertLeakFree(await executeList(testDefinition, context(), query, options))
      assertLeakFree(await executeItem(testDefinition, context(), 'fixture'))
      for (const expand of definition.expands) {
        assertLeakFree(await executeList(testDefinition, context(), { ...query, expand: [expand.name] }, options))
        assertLeakFree(await executeItem(testDefinition, context(), 'fixture', { expand: [expand.name] }))
      }
    }
  })

  it('sweeps eight metric fixtures plus meta/me and rejects secret/PAN patterns', async () => {
    const metrics = createStoreMetricRegistry({ prisma: {} as never })
    expect(metrics.size).toBe(8)
    for (const metric of metrics.list()) {
      const fixture = redactValue({ slug: metric.slug, timezone: 'America/Sao_Paulo', periodo: { de: '2026-01-01', ate: '2026-01-31', agrupar: 'dia' }, definicoes: { formula: 'Fixture sintética sem dados reais.' }, sample: { secret: 'DO-NOT-LEAK', card: '4111111111111111' } }, { allowPii: true, allowMessages: true })
      assertLeakFree(fixture)
    }
    const resource = createStoreResourceRegistry({ prisma: {} as never }).list()[0]
    const pipelineDeps = {
      authenticate: vi.fn(async () => context().identity!),
      audit: vi.fn(async () => undefined), lastUsed: vi.fn(async () => undefined),
    }
    const safe = { ...resource, countAndLastUpdate: vi.fn(async () => ({ count: 0, ultimaAtualizacao: null })) }
    const resources = { get: (slug: string) => slug === safe.slug ? safe : undefined, list: () => [safe], size: 1 }
    for (const [path, segments] of [['/me', ['me']], ['/meta/recursos', ['meta', 'recursos']]] as const) {
      const response = await routeApiV1(new Request(`https://example.test/api/v1${path}`), segments, { resources, pipelineDeps })
      expect(response.status).toBe(200)
      assertLeakFree(JSON.parse(await response.text()))
    }
  })
})
