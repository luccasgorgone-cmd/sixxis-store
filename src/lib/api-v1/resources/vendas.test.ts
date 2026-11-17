import { Prisma } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { createCommerceResources } from './vendas'
import { createMarketingResources } from './marketing'
import { createCustomerResources } from './clientes'
import { createCatalogResources } from './catalogo'
import { executeItem, executeList, buildResourceWhere, type ResourceDefinition } from '../resource'
import { parseListQuery } from '../query'
import { assertNullableFields, context, fakeDelegate, fixture, options } from './fixtures.test-support'

const importedDatabase = vi.hoisted(() => vi.fn())
vi.mock('../../prisma', () => { importedDatabase(); throw new Error('Database must not be eagerly imported') })
const models = 'Pedido GarantiaEstendida Pagamento TentativaMultiMetodo ItemPedido Carrinho ItemCarrinho Cupom CupomUso CarrinhoCliente'.split(' ')
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
const definitions = createCommerceResources()
const get = (model: string) => definitions.find(def => def.model === model)!
const resolve = (slug: string): ResourceDefinition => all.find(def => def.slug === slug)!
const all = [...createCommerceResources({ resolve }), ...createMarketingResources({ resolve }), ...createCustomerResources({ resolve }), ...createCatalogResources({ resolve })]

describe('vendas resources', () => {
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
    const def = createCommerceResources({ prisma: { [key]: delegate } as never, resolve }).find(item => item.model === model)!
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
      const longWindow = `https://test.local/?${def.window.from}=2024-01-01T00:00:00Z&${def.window.to}=2026-03-01T00:00:00Z`
      expect(() => parseListQuery(longWindow, def)).not.toThrow()
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

describe('commerce authorization, monetary units and relational filters', () => {
  it('requires additive PII scope for customer email and paid-click identifier filters', async () => {
    const cases = [
      [get('CupomUso'), 'emailCliente', 'victim@example.test'],
      [get('Pedido'), 'gbraid', 'private-gbraid'],
      [get('Pedido'), 'wbraid', 'private-wbraid'],
      [get('Pedido'), 'fbc', 'private-fbc'],
    ] as const
    for (const [def, name, value] of cases) {
      expect(def.filters?.[name]?.scope, `${def.slug}.${name}`).toBe('read:pii')
      await expect(executeList(def, context([def.scope]), query(def, `${name}=${value}`), options)).rejects.toMatchObject({ status: 403 })
    }
  })
  it('preserves useful PII masks; effective finance scope includes read:all but not read:pedidos', async () => {
    const def = get('Pagamento'), raw = { ...row('Pagamento'), payerNome: 'Alice Teste', payerCpf: '529.982.247-25', payerEmail: 'alice@example.test', valor: 12345 }
    expect(def.serialize(raw, context()).valor).toBe('123.45')
    const fake = { ...def, adapter: { findMany: async () => [raw], findFirst: async () => raw } }
    for (const response of [await executeItem(fake, context(['read:all']), 'id'), await executeList(fake, context(['read:all']), query(def), options)]) {
      const output = Array.isArray(response.data) ? response.data[0] : response.data
      expect(output).toMatchObject({ payerNome: 'A***', payerCpf: '***.***.***-25', payerEmail: 'a***@example.test', valor: '123.45' })
      expect(JSON.stringify(output)).not.toMatch(/qrCode|rawResponse|idempotencyKey/)
    }
    for (const model of ['Pedido', 'ItemPedido']) {
      const current = get(model), raw = row(model)
      const costs = model === 'Pedido' ? ['custoFreteReal', 'mpTaxaReal'] : ['custoUnitario']
      for (const key of costs) {
        expect(current.serialize(raw, context(['read:pedidos']))).not.toHaveProperty(key)
        expect(current.serialize(raw, context(['read:all']))).toHaveProperty(key)
        expect(current.serialize(raw, context(['read:pedidos', 'read:financeiro']))).toHaveProperty(key)
      }
    }
  })
  it('builds literal nested conditions from hardcoded definitions only', () => {
    const def = get('Pedido')
    expect(buildResourceWhere(def, query(def, 'uf=SP&cidade=Teste&produtoId=p&variacaoId=v&pagamentoStatus=approved&metodo=pix'))).toEqual({ AND: [
      { endereco: { estado: 'SP' } }, { endereco: { cidade: 'Teste' } }, { itens: { some: { produtoId: 'p' } } }, { itens: { some: { variacaoId: 'v' } } }, { pagamentos: { some: { mpStatus: 'approved' } } }, { pagamentos: { some: { metodo: 'pix' } } },
    ] })
    for (const key of ['__proto__', '$', 'OR', 'endereco.estado', 'itens.some.produtoId', 'where', 'select']) expect(() => query(def, `${key}=x`)).toThrow()
    for (const field of ['__proto__.x', 'OR.x', 'itens.$.produtoId', 'itens..produtoId']) {
      const invalid = { ...def, filters: { evil: { type: 'string' as const, field } } }
      expect(() => buildResourceWhere(invalid, { limit: 1, sort: 'id', filters: { evil: ['x'] } })).toThrow()
    }
  })
})

it('documents every canonical and legacy order status used by the storefront', async () => {
  const { STATUS_PAGO_TODOS, STATUS_PENDENTE_TODOS, STATUS_CANCELADO_TODOS } = await import('../../pedido-status')
  const status = get('Pedido').fields.find(field => field.name === 'status')!.enum!
  expect(status).toEqual(expect.arrayContaining([...STATUS_PAGO_TODOS, ...STATUS_PENDENTE_TODOS, ...STATUS_CANCELADO_TODOS]))
  const methods = get('Pedido').fields.find(field => field.name === 'formaPagamento')!.enum!
  expect(methods).toEqual(expect.arrayContaining(['cartao', 'credito', 'debito', 'mercado_pago']))
})

it('rejects foreign-domain expansions before adapter access and validates nominal paths on registration', async () => {
  const { createResourceRegistry } = await import('../registry')
  expect(createResourceRegistry(all).size).toBe(37)
  const def = all.find(item => item.model === 'Pedido')!, findFirst = vi.fn()
  await expect(executeItem({ ...def, adapter: { ...def.adapter, findFirst } }, context(['read:pedidos']), 'id', { expand: ['cliente'] })).rejects.toMatchObject({ status: 403 })
  expect(findFirst).not.toHaveBeenCalled()
  expect(() => createResourceRegistry([{ ...def, filters: { unsafe: { type: 'string', field: '__proto__.x' } } }])).toThrow()
})

it('does not treat internal coupon descriptions as public copy', () => {
  const def = get('Cupom'), raw = { ...row('Cupom'), descricao: 'Cupom para alice@example.test token=DO-NOT-LEAK' }
  expect(def.serialize(raw, context(['read:all'])).descricao).toBe('Cupom para a***@example.test [REDACTED]')
})

describe('fix round 1: nominal warranty and persisted-cart JSON', () => {
  it('masks warranty authors, normalizes dates and drops unknown fields through list/detail without additive scopes', async () => {
    const def = get('GarantiaEstendida'), raw = { ...row('GarantiaEstendida'), acionamentos: [
      { data: '2026-01-01T10:00:00-03:00', autor: 'Alice Teste', descricao: 'Contato alice@example.test token=DO-NOT-LEAK cartão 4111111111111111', internal: 'UNKNOWN-MUST-NOT-LEAK' },
      { data: 'invalid-date', descricao: 'Registro sem autor', internal: 'UNKNOWN-MUST-NOT-LEAK' },
    ] }
    const fake = { ...def, adapter: { findMany: async () => [raw], findFirst: async () => raw } }
    for (const response of [await executeList(fake, context(['read:all']), query(def), options), await executeItem(fake, context(['read:all']), 'id')]) {
      const output = Array.isArray(response.data) ? response.data[0] : response.data
      expect(output.acionamentos).toEqual([
        { data: '2026-01-01T13:00:00.000Z', autor: 'A***', descricao: 'Contato a***@example.test [REDACTED] cartão [REDACTED]' },
        { data: null, descricao: 'Registro sem autor' },
      ])
      expect(JSON.stringify(output)).not.toMatch(/Alice Teste|DO-NOT-LEAK|4111111111111111|UNKNOWN-MUST-NOT-LEAK/)
    }
    expect((def.serialize(raw, context()).acionamentos as Record<string, unknown>[])[0].autor).toBe('Alice Teste')
  })
  it('masks persisted cart ownership, formats item BRL and preserves only nominal commercial item fields in list/detail', async () => {
    const def = get('CarrinhoCliente'), raw = { ...row('CarrinhoCliente'), clienteId: 'client-private', itens: [
      { produtoId: 'p1', slug: 'produto', nome: 'Climatizador Sixxis token=DO-NOT-LEAK cartão 4111111111111111', variacao: '110V', qtd: 2, preco: 123.456, unknown: 'UNKNOWN-MUST-NOT-LEAK' },
      { produtoId: 'p2', nome: 'Produto sem slug', qtd: 1, preco: 0, variacao: null },
    ] }
    const fake = { ...def, adapter: { findMany: async () => [raw], findFirst: async () => raw } }
    for (const response of [await executeList(fake, context(['read:all']), query(def), options), await executeItem(fake, context(['read:all']), 'id')]) {
      const output = Array.isArray(response.data) ? response.data[0] : response.data
      expect(output.clienteId).toBe('[REDACTED]')
      expect(output.itens).toEqual([
        { produtoId: 'p1', slug: 'produto', nome: 'Climatizador Sixxis [REDACTED] cartão [REDACTED]', variacao: '110V', qtd: 2, preco: '123.46' },
        { produtoId: 'p2', nome: 'Produto sem slug', variacao: null, qtd: 1, preco: '0.00' },
      ])
      expect(JSON.stringify(output)).not.toMatch(/client-private|DO-NOT-LEAK|4111111111111111|UNKNOWN-MUST-NOT-LEAK/)
    }
    expect(def.serialize(raw, context(['read:all', 'read:pii'])).clienteId).toBe('client-private')
  })
})

it('rejects malformed cart/warranty shapes instead of forwarding arbitrary JSON', () => {
  const cart = get('CarrinhoCliente'), warranty = get('GarantiaEstendida')
  for (const itens of [{ nome: 'not an array' }, [{ produtoId: 'p', nome: 'x', qtd: 'two', preco: 100 }], [{ produtoId: 'p', nome: { email: 'alice@example.test' }, qtd: 1, preco: 100 }]]) {
    expect(() => cart.serialize({ ...row('CarrinhoCliente'), itens }, context())).toThrow('Invalid persisted cart items JSON')
  }
  expect(() => warranty.serialize({ ...row('GarantiaEstendida'), acionamentos: [{ data: '2026-01-01', descricao: 'note', autor: { nome: 'Alice Teste' } }] }, context())).toThrow('Invalid warranty claims JSON')
})
