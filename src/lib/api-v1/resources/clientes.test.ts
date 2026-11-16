import { describe, expect, it, vi } from 'vitest'
import { createCustomerResources } from './clientes'
import { executeItem, executeList, type ResourceDefinition } from '../resource'
import { parseListQuery } from '../query'
import { assertAdapter, assertCoverage, assertExpansions, assertNullableFields, context, fakeDelegate, fixture, options } from './fixtures.test-support'

const importedDatabase = vi.hoisted(() => vi.fn())
vi.mock('../../prisma', () => { importedDatabase(); throw new Error('Database must not be eagerly imported') })

const expected: Record<string, string> = {
  Cliente: 'id nome email cpf cnpj razaoSocial inscricaoEstadual indicadorIE telefone erpClienteId createdAt bloqueado motivoBloqueio bloqueadoEm cashbackSaldo cashbackPendente totalGasto totalPedidos ultimaCompra carrinhoAbandon dataNascimento genero avatar avatarGradiente notifEmail notifWhatsapp updatedAt',
  Endereco: 'id clienteId cep logradouro numero complemento bairro cidade estado principal createdAt updatedAt',
  HistoricoPontos: 'id clienteId pontos tipo descricao pedidoId createdAt',
  PontosCliente: 'id clienteId pontos updatedAt',
  CashbackTransacao: 'id clienteId tipo status valor descricao pedidoId createdAt updatedAt',
  NivelFidelidade: 'id slug nome iconeUrl iconeLucide cor gastoMin gastoMax cashbackPc ordem createdAt updatedAt',
}
const resources = createCustomerResources()
const get = (model: string) => resources.find(def => def.model === model)!
describe('customer resource scalar contracts', () => {
  it('constructs exactly six definitions without opening a database', () => {
    expect(resources.map(def => def.model).sort()).toEqual(Object.keys(expected).sort())
    expect(importedDatabase).not.toHaveBeenCalled()
  })
  it.each(Object.keys(expected))('covers every allowed scalar and excludes forbidden sentinels: %s', model => {
    const money = model === 'Cliente' ? ['cashbackSaldo', 'cashbackPendente', 'totalGasto'] : model === 'CashbackTransacao' ? ['valor'] : model === 'NivelFidelidade' ? ['gastoMin', 'gastoMax'] : []
    assertCoverage(get(model), expected[model].split(' '), money)
    assertNullableFields(get(model))
  })
  it.each(Object.keys(expected))('exercises real list/detail adapters: %s', async model => {
    const key = model[0].toLowerCase() + model.slice(1), delegate = fakeDelegate()
    const defs = createCustomerResources({ prisma: { [key]: delegate } as never })
    await assertAdapter(defs.find(item => item.model === model)!, delegate)
  })
  it('serializes every customer expansion using a child definition at depth one', async () => {
    // The actual Pedido resource belongs to Task 6; this seam proves external resolution.
    const pedido: ResourceDefinition = { slug: 'pedidos', model: 'Pedido', scope: 'read:pedidos', fields: [{ name: 'id', type: 'string' }], scalarFields: ['id'], select: { id: true }, expands: [], sorts: ['id'], adapter: { findMany: async () => [] }, serialize: row => ({ id: row.id }) }
    for (const def of createCustomerResources({ resolve: () => pedido })) await assertExpansions(def)
  })
  it('does not select passwords and masks customer PII without read:pii, including read:all', async () => {
    const def = get('Cliente'), row = { ...fixture('Cliente'), nome: 'Alice Teste', email: 'alice@example.test', telefone: '11912345678', cpf: '12345678901', cnpj: '12345678000199' }
    expect(def.select).not.toHaveProperty('senha')
    for (const scopes of [['read:clientes'], ['read:all']] as const) {
      const output = def.serialize(row, context([...scopes]))
      expect(output.nome).toBe('A***'); expect(output.email).toBe('a***@example.test')
      for (const key of ['telefone', 'cpf', 'cnpj', 'razaoSocial', 'inscricaoEstadual', 'dataNascimento', 'genero', 'avatar']) expect(output[key]).not.toEqual(row[key as keyof typeof row])
      const list = await executeList({ ...def, adapter: { findMany: async () => [row] } }, context([...scopes]), parseListQuery('https://test.local/', def), options)
      expect(list.data[0].nome).toBe('A***'); expect(list.data[0]).not.toHaveProperty('senha')
    }
    expect(def.serialize(row, context()).telefone).toBe('11912345678')
  })
  it('masks all address components, not just street and postal code', () => {
    const def = get('Endereco'), raw = fixture('Endereco'), output = def.serialize(raw, context(['read:clientes']))
    for (const key of ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado']) expect(output[key]).toBe('[REDACTED]')
    expect(output.clienteId).toBe(raw.clienteId)
  })
  it('keeps useful phone/document masks stable through effective list and item responses', async () => {
    const def = get('Cliente'), row = { ...fixture('Cliente'), telefone: '11912345678', cpf: '529.982.247-25', cnpj: '11.222.333/0001-81', motivoBloqueio: 'token=DO-NOT-LEAK cartão 4111111111111111' }
    const adapter = { findMany: async () => [row], findFirst: async () => row }, resource = { ...def, adapter }
    const expected = { telefone: '(11) 9****-5678', cpf: '***.***.***-25', cnpj: '**.***.***/****-81', motivoBloqueio: '[REDACTED] cartão [REDACTED]' }
    for (const scopes of [['read:clientes'], ['read:all']] as const) {
      const ctx = context([...scopes])
      expect(def.serialize(row, ctx)).toMatchObject(expected)
      const list = await executeList(resource, ctx, parseListQuery('https://test.local/', def), options)
      const item = await executeItem(resource, ctx, 'id')
      expect(list.data[0]).toMatchObject(expected)
      expect(item.data).toMatchObject(expected)
      expect(JSON.stringify([list.data, item.data])).not.toMatch(/11912345678|529\.982\.247-25|11\.222\.333\/0001-81|DO-NOT-LEAK|4111111111111111/)
    }
  })
  it('uses real bounded adapter arguments, natural typed filters and child serializers', async () => {
    const cliente = fakeDelegate(), endereco = fakeDelegate()
    const defs = createCustomerResources({ prisma: { cliente, endereco } as never })
    const def = defs.find(item => item.model === 'Cliente')!
    cliente.findMany.mockResolvedValue([{ ...fixture('Cliente'), enderecos: [fixture('Endereco')] }])
    const q = parseListQuery('https://test.local/?email=a@example.test&cpf=123&cnpj=456&bloqueado=true&limit=1&expand=enderecos', def)
    const response = await executeList(def, context(['read:clientes']), q, options)
    expect(cliente.findMany).toHaveBeenCalledWith({ where: { AND: [{ email: 'a@example.test' }, { cpf: '123' }, { cnpj: '456' }, { bloqueado: true }] }, select: { ...def.select, enderecos: { select: defs.find(item => item.model === 'Endereco')!.select, take: 51, orderBy: { id: 'asc' } } }, orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }], take: 2 })
    expect(response.data[0].enderecos).toMatchObject({ data: [{ numero: '[REDACTED]', cidade: '[REDACTED]' }], _meta: { hasMore: false } })
    expect(JSON.stringify(cliente.findMany.mock.calls[0])).not.toContain('include')
    expect(() => parseListQuery('https://test.local/?email[not]=x', def)).toThrow()
    await expect(executeItem(def, context(), 'id', { expand: ['unknown'] })).rejects.toMatchObject({ status: 400 })
    expect(cliente.findFirst).not.toHaveBeenCalled()
  })
  it('documents cashback enums and supports customer foreign key filters', () => {
    const def = get('CashbackTransacao')
    expect(def.fields.find(field => field.name === 'tipo')?.enum).toEqual(['credito', 'debito'])
    expect(def.fields.find(field => field.name === 'status')?.enum).toEqual(['pendente', 'disponivel', 'cancelado'])
    expect(parseListQuery('https://test.local/?clienteId=c&tipo=credito&status=pendente', def).filters).toEqual({ clienteId: ['c'], tipo: ['credito'], status: ['pendente'] })
    expect(() => parseListQuery('https://test.local/?status=unrecognized', def)).toThrow()
  })
})
