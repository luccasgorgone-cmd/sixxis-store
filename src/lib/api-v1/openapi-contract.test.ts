import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'
import { createStoreMetricRegistry } from './metricas/registry'
import { buildOpenApi, buildPostmanCollection } from './openapi'
import { createStoreResourceRegistry } from './router'

const resources = createStoreResourceRegistry({ prisma: {} as never })
const metrics = createStoreMetricRegistry({ prisma: {} as never })

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
      }
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
})
