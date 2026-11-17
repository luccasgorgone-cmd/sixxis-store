import { existsSync, readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import { parseDocument } from 'yaml'
import { describe, expect, it } from 'vitest'
import { createStoreMetricRegistry } from './metricas/registry'
import { buildOpenApi, buildPostmanCollection } from './openapi'
import { parseListQuery } from './query'
import { createStoreResourceRegistry } from './router'

const resources = createStoreResourceRegistry({ prisma: {} as never })
const metrics = createStoreMetricRegistry({ prisma: {} as never })

type ContractParameter = { name: string; required?: boolean; example?: unknown }
type PostmanQuery = { key: string; value: string; disabled: boolean }
type PostmanItem = { name: string; request: { auth?: { type: string }; header: Array<{ key: string }>; url: { query: PostmanQuery[] } } }

describe('OpenAPI 3.1 contract', () => {
  it('describes every resource and metric with detailed schemas, filters, scopes and errors', () => {
    const document = buildOpenApi(resources, metrics)
    expect(document.openapi).toBe('3.1.0')
    expect(resources.size).toBe(49)
    expect(metrics.size).toBe(8)
    for (const resource of resources.list()) {
      const list = document.paths[`/api/v1/${resource.slug}`]
      const detail = document.paths[`/api/v1/${resource.slug}/{id}`]
      expect(list?.get?.security).toEqual([{ bearerAuth: [] }])
      expect(detail?.get?.security).toEqual([{ bearerAuth: [] }])
      expect(list?.get?.['x-required-scope']).toBe(resource.scope)
      const parameters = new Map(list.get.parameters.map((parameter: { name: string }) => [parameter.name, parameter]))
      for (const name of ['limit', 'cursor', 'sort', 'ids', 'fields', 'expand']) expect(parameters.has(name), `${resource.slug}.${name}`).toBe(true)
      for (const name of Object.keys(resource.filters ?? {})) expect(parameters.has(name), `${resource.slug}.${name}`).toBe(true)
      const schema = document.components.schemas[`Resource_${resource.model}`]
      expect(Object.keys(schema.properties)).toEqual(expect.arrayContaining(resource.fields.map(field => field.name)))
      expect(schema.additionalProperties).toBe(false)
      for (const field of resource.fields) {
        expect(schema.properties[field.name].description, `${resource.slug}.${field.name}`).toBeTruthy()
        expect(JSON.stringify(schema.properties[field.name]), `${resource.slug}.${field.name}`).toContain(field.type)
        expect(schema.properties[field.name]['x-required-scope'] ?? null, `${resource.slug}.${field.name}.scope`).toBe(field.scope ?? null)
      }
      for (const [name, filter] of Object.entries(resource.filters ?? {})) expect(parameters.get(name)?.['x-required-scope'] ?? null, `${resource.slug}.${name}.filter-scope`).toBe(filter.scope ?? null)
      const search = parameters.get('q')
      if (search) expect(search['x-required-scope'] ?? null, `${resource.slug}.q.scope`).toBe(resource.searchScope ?? null)
      for (const expand of resource.expands) expect(schema.properties[expand.name], `${resource.slug}.${expand.name}`).toBeTruthy()
      for (const status of ['400', '401', '403', '404', '429', '500', '503']) expect(list.get.responses[status], `${resource.slug}.${status}`).toBeTruthy()
    }
    for (const metric of metrics.list()) {
      const operation = document.paths[`/api/v1/metricas/${metric.slug}`]?.get
      expect(operation?.['x-required-scope']).toBe(metric.scope)
      expect(operation.parameters.map((parameter: { name: string }) => parameter.name)).toEqual(['de', 'ate', 'agrupar'])
      const schema = document.components.schemas[`Metric_${metric.slug}`]
      expect(schema.type).toBe('object')
      expect(Object.keys(schema.properties).length, metric.slug).toBeGreaterThan(4)
      expect(schema.additionalProperties).toBe(false)
    }
  })

  it('Ajv 2020 validates representative list/item envelopes and every metric envelope', () => {
    const document = buildOpenApi(resources, metrics)
    const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false })
    for (const schema of Object.values(document.components.schemas)) ajv.addSchema(schema as object, (schema as { $id: string }).$id)
    const samples = JSON.parse(readFileSync(new URL('../../../docs/api-v1/contract-samples.json', import.meta.url), 'utf8')) as Record<string, unknown>
    for (const name of ['clientes', 'produtos', 'pedidos', 'eventos-tracking']) {
      const validateList = ajv.getSchema(`urn:sixxis:api-v1:list:${name}`)!
      const validateItem = ajv.getSchema(`urn:sixxis:api-v1:item:${name}`)!
      expect(validateList(samples[`list:${name}`]), JSON.stringify(validateList.errors)).toBe(true)
      expect(validateItem(samples[`item:${name}`]), JSON.stringify(validateItem.errors)).toBe(true)
    }
    for (const metric of metrics.list()) {
      const validate = ajv.getSchema(`urn:sixxis:api-v1:metric-envelope:${metric.slug}`)!
      expect(validate(samples[`metric:${metric.slug}`]), `${metric.slug}: ${JSON.stringify(validate.errors)}`).toBe(true)
    }
  })

  it('keeps generated JSON/YAML/Postman deterministic and complete', () => {
    const document = buildOpenApi(resources, metrics)
    const postman = buildPostmanCollection(document)
    expect(postman.variable).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'baseUrl' }), expect.objectContaining({ key: 'token' }),
    ]))
    const serialized = JSON.stringify(postman)
    for (const path of Object.keys(document.paths)) expect(serialized, path).toContain(path)
  })

  it('publishes the literal production origin in OpenAPI, Postman and the generated curl example', () => {
    const document = buildOpenApi(resources, metrics)
    const postman = buildPostmanCollection(document) as { variable: Array<{ key: string; value: string }> }
    const readme = readFileSync(new URL('../../../docs/api-v1/README.md', import.meta.url), 'utf8')

    expect(document.servers).toEqual([{ url: 'https://www.sixxis.com.br', description: 'Produção Sixxis Store.' }])
    expect(postman.variable.find(variable => variable.key === 'baseUrl')?.value).toBe('https://www.sixxis.com.br')
    expect(readme).toContain('"https://www.sixxis.com.br/api/v1/produtos?')
    expect(readme).not.toContain('SEU-DOMINIO.example')
  })

  it('marks only bounded resource windows and every metric query parameter as required', () => {
    const document = buildOpenApi(resources, metrics)

    for (const resource of resources.list()) {
      const parameters = document.paths[`/api/v1/${resource.slug}`].get.parameters as ContractParameter[]
      const required = parameters.filter(parameter => parameter.required).map(parameter => parameter.name).sort()
      expect(required, resource.slug).toEqual(resource.window ? [resource.window.from, resource.window.to].sort() : [])
    }
    for (const metric of metrics.list()) {
      const parameters = document.paths[`/api/v1/metricas/${metric.slug}`].get.parameters as ContractParameter[]
      expect(parameters.filter(parameter => parameter.required).map(parameter => parameter.name).sort(), metric.slug).toEqual(['agrupar', 'ate', 'de'])
    }
  })

  it('provides valid enabled Postman examples for every required query parameter', () => {
    const document = buildOpenApi(resources, metrics)
    const postman = buildPostmanCollection(document) as { item: PostmanItem[] }

    for (const resource of resources.list().filter(resource => resource.window)) {
      const parameters = document.paths[`/api/v1/${resource.slug}`].get.parameters as ContractParameter[]
      const from = parameters.find(parameter => parameter.name === resource.window!.from)!
      const to = parameters.find(parameter => parameter.name === resource.window!.to)!
      const url = new URL(`https://example.test/api/v1/${resource.slug}`)
      url.searchParams.set(from.name, String(from.example))
      url.searchParams.set(to.name, String(to.example))
      expect(() => parseListQuery(url, resource), resource.slug).not.toThrow()

      const item = postman.item.find(candidate => candidate.name === `GET /api/v1/${resource.slug}`)!
      for (const name of [from.name, to.name]) {
        expect(item.request.url.query.find(parameter => parameter.key === name), `${resource.slug}.${name}`).toMatchObject({ disabled: false })
      }
    }
    for (const metric of metrics.list()) {
      const item = postman.item.find(candidate => candidate.name === `GET /api/v1/metricas/${metric.slug}`)!
      for (const name of ['de', 'ate', 'agrupar']) {
        expect(item.request.url.query.find(parameter => parameter.key === name), `${metric.slug}.${name}`).toMatchObject({ disabled: false })
      }
    }
  })

  it('uses one Postman auth mechanism and explicitly keeps public routes unauthenticated', () => {
    const postman = buildPostmanCollection(buildOpenApi(resources, metrics)) as { auth: { type: string }; item: PostmanItem[] }
    expect(postman.auth.type).toBe('bearer')
    for (const item of postman.item) expect(item.request.header.some(header => header.key.toLowerCase() === 'authorization'), item.name).toBe(false)
    for (const path of ['/api/v1', '/api/v1/health', '/api/v1/openapi.json', '/api/v1/docs']) {
      expect(postman.item.find(item => item.name === `GET ${path}`)?.request.auth, path).toEqual({ type: 'noauth' })
    }
    expect(postman.item.find(item => item.name === 'GET /api/v1/meta/recursos')?.request.auth).toBeUndefined()
  })

  it('keeps the generated YAML semantically equivalent to JSON with date examples as strings', () => {
    const json = JSON.parse(readFileSync(new URL('../../../docs/api-v1/openapi.json', import.meta.url), 'utf8'))
    const yaml = parseDocument(readFileSync(new URL('../../../docs/api-v1/openapi.yaml', import.meta.url), 'utf8')).toJS({ maxAliasCount: -1 })
    expect(yaml).toEqual(json)
    for (const metric of metrics.list()) {
      const parameters = yaml.paths[`/api/v1/metricas/${metric.slug}`].get.parameters as ContractParameter[]
      expect(parameters.filter(parameter => parameter.name === 'de' || parameter.name === 'ate').every(parameter => typeof parameter.example === 'string'), metric.slug).toBe(true)
    }
  })

  it('documents literal endpoint paths and ships only the final Postman and sync example names', () => {
    const directory = new URL('../../../docs/api-v1/', import.meta.url)
    const readme = readFileSync(new URL('README.md', directory), 'utf8')
    for (const path of ['/api/v1/health', '/api/v1/openapi.json', '/api/v1/docs', '/api/v1/meta/recursos']) expect(readme, path).toContain(`\`${path}\``)
    expect(readme).toContain('`colecao.postman.json`')
    expect(readme).toContain('`sync-exemplo.ts`')
    expect(existsSync(new URL('colecao.postman.json', directory))).toBe(true)
    expect(existsSync(new URL('sync-exemplo.ts', directory))).toBe(true)
    expect(existsSync(new URL('postman-collection.json', directory))).toBe(false)
    expect(existsSync(new URL('exemplo-sync.ts', directory))).toBe(false)
  })
})
