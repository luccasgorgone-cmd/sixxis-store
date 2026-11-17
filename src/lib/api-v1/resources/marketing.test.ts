import { Prisma } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { createMarketingResources } from './marketing'
import { createCommerceResources } from './vendas'
import { createCustomerResources } from './clientes'
import { createCatalogResources } from './catalogo'
import { executeItem, executeList, buildResourceWhere, type ResourceDefinition } from '../resource'
import { parseListQuery } from '../query'
import { assertNullableFields, context, fakeDelegate, fixture, options } from './fixtures.test-support'

const importedDatabase = vi.hoisted(() => vi.fn())
vi.mock('../../prisma', () => { importedDatabase(); throw new Error('Database must not be eagerly imported') })
const models = 'ListaEspera Campanha CampanhaDestinatario WhatsappNumero EnvioLog LunaConversa LunaMensagem SolicitacaoParceiro MensagemContato'.split(' ')
const excluded: Record<string, string[]> = {
  Pedido: ['idempotencyKey', 'pagamentoEmProcessamentoEm'],
  Pagamento: ['rawResponse', 'qrCodeBase64', 'qrCodeCopiaECola', 'idempotencyKey'],
  TentativaMultiMetodo: ['proximaAcao'],
  WhatsappNumero: ['instanceId', 'apiUrl', 'apiKey', 'qrCode'],
}
function row(model: string) {
  const value = fixture(model)
  if (model === 'CarrinhoCliente') value.itens = [{ produtoId: 'p', slug: 'produto', nome: 'Produto Público', variacao: '110V', qtd: 2, preco: 100, token: 'DO-NOT-LEAK' }]
  if (model === 'Campanha') { value.canais = ['email', 'whatsapp']; value.publicoAlvo = { segmento: 'clientes', email: 'alice@example.test', token: 'DO-NOT-LEAK' }; value.filtroSegmento = { totalPedidos: { gte: 1 }, token: 'DO-NOT-LEAK' } }
  if (model === 'GarantiaEstendida') value.acionamentos = [{ data: '2026-01-01T10:00:00-03:00', descricao: 'alice@example.test token=DO-NOT-LEAK', autor: 'Alice Teste' }]
  return value
}
function query(def: ResourceDefinition, extra = '') {
  const dates = def.window ? `${def.window.from}=2026-01-01T00:00:00Z&${def.window.to}=2026-01-31T00:00:00Z&` : ''
  return parseListQuery(`https://test.local/?${dates}${extra}`, def)
}
const definitions = createMarketingResources()
const get = (model: string) => definitions.find(def => def.model === model)!
const resolve = (slug: string): ResourceDefinition => all.find(def => def.slug === slug)!
const all = [...createCommerceResources({ resolve }), ...createMarketingResources({ resolve }), ...createCustomerResources({ resolve }), ...createCatalogResources({ resolve })]

describe('marketing resources', () => {
  it('registers exactly the specified models without opening a database', () => {
    expect(definitions.map(def => def.model)).toEqual(models)
    expect(importedDatabase).not.toHaveBeenCalled()
  })
  it.each(models)('nominally selects and serializes every permitted scalar, never secrets: %s', model => {
    const def = get(model), raw = row(model)
    const schema = Prisma.dmmf.datamodel.models.find(item => item.name === model)!
    const expected = schema.fields.filter(field => field.kind !== 'object' && !(excluded[model] ?? []).includes(field.name)).map(field => field.name).sort()
    expect(Object.keys(def.select).sort()).toEqual(expected)
    expect(def.scalarFields?.slice().sort()).toEqual(expected)
    expect(def.fields.map(field => field.name).sort()).toEqual(expected)
    const result = def.serialize(raw, context())
    expect(Object.keys(result).sort()).toEqual(expected)
    for (const field of schema.fields.filter(field => expected.includes(field.name))) {
      const value = raw[field.name]
      if (field.type === 'Json') { expect(result[field.name]).toBeDefined(); continue }
      const wanted = value instanceof Date ? value.toISOString() : field.type === 'Decimal' || def.fields.find(f => f.name === field.name)?.format === 'decimal' ? new Prisma.Decimal(String(value)).div(model === 'Pagamento' && field.name === 'valor' ? 100 : 1).toFixed(2) : value
      expect(result[field.name], `${model}.${field.name}`).toEqual(wanted)
    }
    expect(JSON.stringify(result)).not.toMatch(/DO-NOT-LEAK|UNKNOWN-DO-NOT-LEAK/)
    assertNullableFields(def)
  })
  it.each(models)('runs bounded list/detail, projection and all expansions through actual engine: %s', async model => {
    const delegate = fakeDelegate(), raw = row(model), key = model[0].toLowerCase() + model.slice(1)
    const def = createMarketingResources({ prisma: { [key]: delegate } as never, resolve }).find(item => item.model === model)!
    delegate.findMany.mockResolvedValue([raw]); delegate.findFirst.mockResolvedValue(raw)
    expect((await executeList(def, context(), query(def, 'limit=2'), options)).data).toEqual([def.serialize(raw, context())])
    expect(delegate.findMany).toHaveBeenCalledWith(expect.objectContaining({ select: def.select, take: 3 }))
    expect((await executeItem(def, context(), 'id', { fields: ['id'] })).data).toEqual({ id: raw.id })
    for (const expand of def.expands) {
      const child = expand.resource(), childRow = row(child.model)
      for (const grandchild of child.expands) childRow[grandchild.relation ?? grandchild.name] = { token: 'DO-NOT-LEAK' }
      const expanded = { ...raw, [expand.relation ?? expand.name]: expand.many ? [childRow] : childRow }
      delegate.findMany.mockResolvedValue([expanded]); delegate.findFirst.mockResolvedValue(expanded)
      for (const response of [await executeList(def, context(), query(def, `expand=${expand.name}`), options), await executeItem(def, context(), 'id', { expand: [expand.name] })]) {
        const output = Array.isArray(response.data) ? response.data[0] : response.data
        expect(expand.many ? (output[expand.name] as { data: unknown[] }).data[0] : output[expand.name]).toEqual(child.serialize(childRow, context()))
      }
      expect(delegate.findFirst).toHaveBeenLastCalledWith({ where: { id: 'id' }, select: { ...def.select, [expand.relation ?? expand.name]: { select: child.select, ...(expand.many ? { take: 51, orderBy: { id: 'asc' } } : {}) } } })
      if (!expand.many) { delegate.findFirst.mockResolvedValue({ ...raw, [expand.relation ?? expand.name]: null }); expect((await executeItem(def, context(), 'id', { expand: [expand.name] })).data[expand.name]).toBeNull() }
    }
    delegate.findFirst.mockResolvedValue(null)
    await expect(executeItem(def, context(), 'missing')).rejects.toMatchObject({ status: 404 })
    if (def.window) {
      expect(() => parseListQuery('https://test.local/', def)).toThrow()
      const tooWide = `https://test.local/?${def.window.from}=2026-01-01T00:00:00Z&${def.window.to}=2026-03-01T00:00:00Z`
      expect(() => parseListQuery(tooWide, def)).toThrow()
    }
  })
  it.each(models)('validates every nominal filter before querying and uses typed Prisma conditions: %s', model => {
    const def = get(model)
    for (const [name, filter] of Object.entries(def.filters ?? {})) {
      const value = filter.values?.[0] ?? (filter.type === 'boolean' ? 'true' : filter.type === 'number' ? '2' : 'safe')
      expect(buildResourceWhere(def, query(def, `${name}=${value}`)).AND).toBeDefined()
      expect(() => query(def, `${name}[not]=x`)).toThrow()
      if (filter.values || filter.type !== 'string') expect(() => query(def, `${name}=bad-value`)).toThrow()
    }
    for (const field of def.fields.filter(f => f.enum)) {
      expect(field.description).toContain('desconhecidos')
      expect(def.serialize({ ...row(model), [field.name]: 'FUTURE_UNKNOWN' }, context())[field.name]).toBe('FUTURE_UNKNOWN')
    }
  })
})

describe('message scopes, PII and JSON filters', () => {
  it('never grants message content with read:all or domain-only access', async () => {
    for (const model of ['Campanha', 'SolicitacaoParceiro']) {
      const def = get(model), raw = row(model), fields = def.fields.filter(f => f.scope === 'read:mensagens')
      expect(fields.length).toBeGreaterThan(0)
      for (const scopes of [['read:marketing'], ['read:all']] as const) {
        const fake = { ...def, adapter: { findMany: async () => [raw], findFirst: async () => raw } }
        const outputs = [def.serialize(raw, context([...scopes])), (await executeItem(fake, context([...scopes]), 'id')).data, (await executeList(fake, context([...scopes]), query(def), options)).data[0]]
        for (const output of outputs) for (const field of fields) expect(output).not.toHaveProperty(field.name)
      }
      for (const field of fields) expect(def.serialize(raw, context())).toHaveProperty(field.name)
    }
    for (const model of ['LunaConversa', 'LunaMensagem', 'MensagemContato']) await expect(executeItem(get(model), context(['read:all']), 'id')).rejects.toMatchObject({ status: 403 })
    const def = all.find(item => item.model === 'LunaConversa')!
    await expect(executeItem(def, context(['read:all']), 'id', { expand: ['mensagens'] })).rejects.toMatchObject({ status: 403 })
  })
  it('keeps operational campaign names public while masking contacts/WhatsApp and recursively stripping secrets', async () => {
    const campanha = get('Campanha'), raw = { ...row('Campanha'), nome: 'Campanha Verão token=DO-NOT-LEAK', mensagem: 'Contato alice@example.test; token=DO-NOT-LEAK; cartão 4111111111111111' }
    expect(campanha.serialize(raw, context(['read:marketing', 'read:mensagens']))).toMatchObject({ nome: 'Campanha Verão [REDACTED]', mensagem: 'Contato a***@example.test; [REDACTED]; cartão [REDACTED]' })
    const def = get('WhatsappNumero'), value = { ...row('WhatsappNumero'), numero: '11912345678' }
    const fake = { ...def, adapter: { findFirst: async () => value, findMany: async () => [value] } }
    expect((await executeItem(fake, context(['read:all']), 'id')).data.numero).toBe('(11) 9****-5678')
    expect(def.serialize(value, context()).numero).toBe('11912345678')
    for (const recipient of ['alice@example.test', '11912345678']) {
      const log = get('EnvioLog'), output = log.serialize({ ...row('EnvioLog'), destinatario: recipient }, context(['read:marketing']))
      expect(output.destinatario).toBe(recipient.includes('@') ? 'a***@example.test' : '(11) 9****-5678')
      const fakeLog = { ...log, adapter: { findFirst: async () => ({ ...row('EnvioLog'), destinatario: recipient }), findMany: async () => [] } }
      expect((await executeItem(fakeLog, context(['read:marketing']), 'id')).data).not.toHaveProperty('destinatario')
      expect((await executeItem(fakeLog, context(['read:marketing', 'read:pii']), 'id')).data.destinatario).toBe(recipient)
    }
  })
  it('builds a bounded JSON channel filter, never client-provided paths/operators', () => {
    const def = get('Campanha')
    expect(buildResourceWhere(def, query(def, 'canal=email,whatsapp'))).toEqual({ AND: [{ OR: [{ canais: { array_contains: 'email' } }, { canais: { array_contains: 'whatsapp' } }] }] })
    for (const key of ['__proto__', '$', 'OR', 'canais.array_contains', 'where']) expect(() => query(def, `${key}=x`)).toThrow()
  })
  it('requires additive PII scope for recipient output and exact recipient filters', async () => {
    const def = get('EnvioLog')
    expect(def.fields.find(field => field.name === 'destinatario')?.scope).toBe('read:pii')
    expect(def.filters?.destinatario?.scope).toBe('read:pii')
    const restricted = context(['read:marketing'])
    await expect(executeList(def, restricted, query(def, 'destinatario=victim@example.test'), options)).rejects.toMatchObject({ status: 403 })
    const raw = { ...row('EnvioLog'), destinatario: 'victim@example.test' }
    const output = await executeItem({ ...def, adapter: { ...def.adapter, findFirst: async () => raw } }, restricted, 'id')
    expect(output.data).not.toHaveProperty('destinatario')
  })
})

it('documents the Luna transfer state displayed by the administration UI', () => {
  expect(get('LunaConversa').fields.find(field => field.name === 'status')!.enum).toContain('transferida')
})

it('gates cross-domain WhatsApp expansions and masks nested JSON without hiding usage metadata', async () => {
  const def = all.find(item => item.model === 'Campanha')!, findFirst = vi.fn()
  await expect(executeItem({ ...def, adapter: { ...def.adapter, findFirst } }, context(['read:marketing']), 'id', { expand: ['whatsappNumero'] })).rejects.toMatchObject({ status: 403 })
  expect(findFirst).not.toHaveBeenCalled()
  expect(def.serialize(row('Campanha'), context(['read:all'])).publicoAlvo).toEqual({ segmento: 'clientes', email: 'a***@example.test' })
  const luna = get('LunaMensagem')
  expect(luna.serialize({ ...row('LunaMensagem'), tokens: 128, conteudo: 'alice@example.test token=DO-NOT-LEAK' }, context(['read:mensagens']))).toMatchObject({ tokens: 128, conteudo: 'a***@example.test [REDACTED]' })
})
