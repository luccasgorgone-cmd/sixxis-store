import { Prisma } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { createAnalyticsResources } from './analytics'
import { createCustomerResources } from './clientes'
import { createCatalogResources } from './catalogo'
import { createResourceRegistry } from '../registry'
import { hasScope } from '../auth'
import { buildResourceWhere, executeItem, executeList, type ResourceDefinition } from '../resource'
import { parseListQuery } from '../query'
import { assertNullableFields, context, fakeDelegate, fixture, options } from './fixtures.test-support'

const databaseImport = vi.hoisted(() => vi.fn())
vi.mock('../../prisma', () => { databaseImport(); throw new Error('Database must remain lazy') })
const models = 'CookieConsent EventoAnalitico ClienteInsight SessaoVisitante EventoTracking RelatorioVendaHora TentativaLogin BloqueioIp AuditLog Presenca TrafegoBruto BloqueioFraude'.split(' ')
const auditModels = ['TentativaLogin', 'BloqueioIp', 'AuditLog', 'BloqueioFraude']
const dates: Record<string, string> = { ClienteInsight: 'ultimaVisita', SessaoVisitante: 'updatedAt', RelatorioVendaHora: 'updatedAt', BloqueioIp: 'updatedAt', Presenca: 'ultimoPing', TrafegoBruto: 'dia' }
const money: Record<string, string[]> = { ClienteInsight: ['totalGasto'], EventoTracking: ['valor'], RelatorioVendaHora: ['totalReceita'] }
const prismaSchema = readFileSync(new URL('../../../../prisma/schema.prisma', import.meta.url), 'utf8')
const all: ResourceDefinition[] = [...createAnalyticsResources({ resolve: slug => all.find(def => def.slug === slug)! }), ...createCustomerResources()]
const definitions = createAnalyticsResources()
const get = (model: string) => definitions.find(def => def.model === model)!
function row(model: string): Record<string, unknown> { return { ...fixture(model), ...(model === 'TrafegoBruto' ? { dia: '2026-01-01' } : {}) } }
function query(def: ResourceDefinition, extra = '') {
  return parseListQuery(`https://test.local/?${def.window!.from}=2026-01-01T00:00:00Z&${def.window!.to}=2026-01-02T00:00:00Z&${extra}`, def)
}
function setup(model: string) {
  const delegate = { ...fakeDelegate(), count: vi.fn(async () => 17) }
  const key = model[0].toLowerCase() + model.slice(1)
  const def = createAnalyticsResources({ prisma: { [key]: delegate } as never, resolve: slug => all.find(item => item.slug === slug)! }).find(item => item.model === model)!
  return { def, delegate }
}

describe('bounded analytics and audit resources', () => {
  it('registers the exact twelve models lazily and marks the two deprecated models', () => {
    expect(definitions.map(def => def.model)).toEqual(models)
    expect(databaseImport).not.toHaveBeenCalled()
    expect(createResourceRegistry(definitions).list(context(['read:analytics']).identity!).map(def => def.model)).toEqual(models.filter(model => !auditModels.includes(model)))
    expect(definitions.filter(def => def.deprecated).map(def => def.model)).toEqual(['EventoAnalitico', 'ClienteInsight'])
    for (const def of definitions) {
      expect(def.scope).toBe(auditModels.includes(def.model) ? 'read:auditoria' : 'read:analytics')
      expect(def.maxLimit).toBe(200)
      expect(def.window).toEqual({ from: def.window!.from, to: def.window!.to })
      expect(def.defaultSort).toBe(dates[def.model] ?? 'createdAt')
    }
  })
  it.each(models)('selects and serializes every nominal field, excluding secrets: %s', model => {
    const def = get(model), raw = row(model)
    const expected = Prisma.dmmf.datamodel.models.find(item => item.name === model)!.fields.filter(field => field.kind !== 'object' && field.name !== 'visitorHash').map(field => field.name).sort()
    expect(Object.keys(def.select).sort()).toEqual(expected)
    expect(def.scalarFields?.slice().sort()).toEqual(expected)
    expect(def.fields.map(field => field.name).sort()).toEqual(expected)
    const output = def.serialize(raw, context())
    expect(Object.keys(output).sort()).toEqual(expected)
    for (const key of expected) {
      const value = raw[key]
      const wanted = value instanceof Date ? value.toISOString() : money[model]?.includes(key) ? new Prisma.Decimal(String(value)).toFixed(2) : value
      expect(output[key], `${model}.${key}`).toEqual(wanted && typeof wanted === 'object' ? { sentinel: `${model}.${key}`, nested: { email: 'alice@example.test' } } : wanted)
    }
    expect(JSON.stringify(output)).not.toMatch(/DO-NOT-LEAK|visitorHash|PASSWORD|UNKNOWN/)
    assertNullableFields(def)
  })
  it.each(models)('blocks missing, incomplete and invalid windows but accepts long chronological windows before adapter: %s', async model => {
    const { def, delegate } = setup(model)
    const base = { limit: 1, sort: def.defaultSort!, filters: {} }
    const start = new Date('2024-01-01T00:00:00Z'), end = new Date('2026-01-02T00:00:00Z')
    const from = def.window!.from, to = def.window!.to
    for (const bad of [base, { ...base, [from]: start }, { ...base, [to]: end }, { ...base, [from]: end, [to]: start }, { ...base, [from]: new Date('bad'), [to]: end }, { ...base, [from]: start, [to]: end, limit: 201 }, { ...base, q: 'token=PRIVATE' }, { ...base, [from]: start, [to]: end, filters: { arbitrary: ['x'] } }]) {
      await expect(executeList(def, context(), bad, options)).rejects.toMatchObject({ status: 400 })
    }
    expect(() => parseListQuery('https://test.local/', def)).toThrow()
    expect(() => query(def, 'limit=201')).toThrow()
    expect(delegate.findMany).not.toHaveBeenCalled()
    expect(delegate.findFirst).not.toHaveBeenCalled()
    await executeList(def, context(), { ...base, [from]: start, [to]: end }, options)
    expect(delegate.findMany).toHaveBeenCalledTimes(1)
  })
  it.each(models)('runs list/detail/projection and authorization through actual engine: %s', async model => {
    const { def, delegate } = setup(model), raw = row(model)
    delegate.findMany.mockResolvedValue([raw]); delegate.findFirst.mockResolvedValue(raw)
    expect((await executeList(def, context(), query(def, 'limit=2'), options)).data).toEqual([def.serialize(raw, context())])
    expect(delegate.findMany).toHaveBeenCalledWith(expect.objectContaining({ select: def.select, take: 3, orderBy: [{ [def.defaultSort!]: 'asc' }, { id: 'asc' }] }))
    expect((await executeItem(def, context(), 'id', { fields: ['id'] })).data).toEqual({ id: raw.id })
    await expect(executeItem(def, context([auditModels.includes(model) ? 'read:analytics' : 'read:auditoria']), 'id')).rejects.toMatchObject({ status: 403 })
    const output = (await executeItem(def, context(['read:all']), 'id')).data
    expect(JSON.stringify(output)).not.toMatch(/DO-NOT-LEAK|visitorHash/)
    delegate.findFirst.mockResolvedValue(null)
    await expect(executeItem(def, context(), 'absent')).rejects.toMatchObject({ status: 404 })
    expect(() => query(def, 'fields=visitorHash')).toThrow()
  })
  it.each(models)('uses nominal typed filters and rejects client-controlled paths: %s', model => {
    const def = get(model)
    for (const [name, filter] of Object.entries(def.filters ?? {})) {
      const value = filter.values?.[0] ?? (filter.type === 'boolean' ? 'true' : filter.type === 'number' ? '2' : 'safe')
      const expected = (filter.field ?? name).split('.').reduceRight<unknown>((nested, key) => ({ [key]: nested }), filter.type === 'boolean' ? true : filter.type === 'number' ? 2 : value)
      expect(buildResourceWhere(def, query(def, `${name}=${value}`)).AND).toContainEqual(expected)
      expect(() => query(def, `${name}[not]=x`)).toThrow()
      if (filter.values || filter.type !== 'string') expect(() => query(def, `${name}=INVALID`)).toThrow()
    }
    for (const field of def.fields.filter(field => field.enum)) {
      expect(field.description).toContain('desconhecidos')
      expect(def.serialize({ ...row(model), [field.name]: 'FUTURE_UNKNOWN' }, context())[field.name]).toBe('FUTURE_UNKNOWN')
    }
  })
  it.each(models)('provides indexed count and latest reference without loading records: %s', async model => {
    const { def, delegate } = setup(model), field = dates[model] ?? 'createdAt'
    const block = new RegExp(`^model ${model} \\{([\\s\\S]*?)^}`, 'm').exec(prismaSchema)![1]
    expect(block).toMatch(new RegExp(`@@(?:index|unique)\\(\\[${field}(?:,|\\])`))
    delegate.findFirst.mockResolvedValue({ [field]: model === 'TrafegoBruto' ? '2026-01-31' : new Date('2026-01-31T12:34:56Z') })
    expect(await def.countAndLastUpdate!(context())).toEqual({ count: 17, ultimaAtualizacao: model === 'TrafegoBruto' ? '2026-01-31T03:00:00.000Z' : '2026-01-31T12:34:56.000Z' })
    expect(delegate.count).toHaveBeenCalledWith()
    expect(delegate.findFirst).toHaveBeenCalledWith({ orderBy: { [field]: 'desc' }, select: { [field]: true } })
    expect(delegate.findMany).not.toHaveBeenCalled()
    delegate.findFirst.mockResolvedValue(null)
    expect(await def.countAndLastUpdate!(context())).toEqual({ count: 17, ultimaAtualizacao: null })
    delegate.count.mockClear(); delegate.findFirst.mockClear()
    await expect(def.countAndLastUpdate!(context([]))).rejects.toMatchObject({ status: 403 })
    expect(delegate.count).not.toHaveBeenCalled(); expect(delegate.findFirst).not.toHaveBeenCalled()
  })
  it('defines required filter families on their exact model', () => {
    for (const [model, required] of Object.entries({ CookieConsent: ['sessionId', 'aceitou'], EventoAnalitico: ['tipo', 'sessionId'], ClienteInsight: ['sessionId', 'dispositivo'], SessaoVisitante: ['sessaoId', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm', 'dispositivo', 'browser', 'os'], EventoTracking: ['tipo', 'sessaoId', 'produtoId', 'produtoSlug'], TentativaLogin: ['sucesso'], AuditLog: ['action'], TrafegoBruto: ['dispositivo', 'browser', 'os'], BloqueioFraude: ['acao', 'clienteId'] })) {
      for (const field of required) expect(get(model).filters).toHaveProperty(field)
    }
  })
  it('hides and forbids searching free-form fraud reasons without read:pii', async () => {
    for (const model of ['BloqueioIp', 'BloqueioFraude']) {
      const { def, delegate } = setup(model)
      const raw = { ...row(model), motivo: 'Fraude de Maria da Silva' }
      delegate.findMany.mockResolvedValue([raw])
      expect(def.fields.find(field => field.name === 'motivo')?.scope).toBe('read:pii')
      expect(def.searchScope).toBe('read:pii')
      delegate.findFirst.mockResolvedValue(raw)
      expect((await executeItem(def, context([def.scope]), 'id')).data).not.toHaveProperty('motivo')
      await expect(executeList(def, context([def.scope]), query(def, 'q=Maria'), options)).rejects.toMatchObject({ status: 403 })
      expect(delegate.findMany).not.toHaveBeenCalled()
    }
  })
})

describe('analytics redaction and relations', () => {
  it.each(['conteúdo=PRIVATE-MESSAGE', 'debug {"conteúdo":"PRIVATE-MESSAGE", malformed', String.raw`debug {"\u006densagem":"PRIVATE-MESSAGE", malformed`, String.raw`debug {"conte\u00fado":"PRIVATE-MESSAGE", malformed`, 'debug {"con teúdo":"PRIVATE-MESSAGE", malformed'])('round 2: normalizes malformed Unicode keys in serialize/list/detail with four scope combinations: %s', async details => {
    const { def, delegate } = setup('AuditLog')
    const raw = { ...row('AuditLog'), metadata: { details: `${details}; token=DO-NOT-LEAK; 4111111111111111`, actorDetails: 'actor=Maria da Silva; status=ok; token=DO-NOT-LEAK', sibling: 'public-operation', count: 7 } }
    delegate.findMany.mockResolvedValue([raw]); delegate.findFirst.mockResolvedValue(raw)
    for (const scopes of [['read:all'], ['read:all', 'read:pii'], ['read:all', 'read:mensagens'], ['read:all', 'read:pii', 'read:mensagens']] as const) {
      const ctx = context([...scopes])
      const outputs = [
        { output: def.serialize(raw, ctx), projected: false },
        { output: (await executeItem(def, ctx, 'id')).data, projected: true },
        { output: (await executeList(def, ctx, query(def), options)).data[0], projected: true },
      ]
      for (const { output, projected } of outputs) {
        const metadata = output.metadata as Record<string, unknown>
        if (projected && !scopes.includes('read:pii' as never)) {
          expect(metadata).toBeUndefined()
          continue
        }
        expect(metadata).toMatchObject({ sibling: 'public-operation', count: 7 })
        expect(JSON.stringify(metadata)).not.toMatch(/DO-NOT-LEAK|4111111111111111/)
        expect(String(metadata.details).includes('PRIVATE-MESSAGE')).toBe(scopes.includes('read:mensagens' as never))
        if (scopes.includes('read:pii' as never)) expect(metadata.actorDetails).toContain('Maria da Silva')
        else expect(metadata.actorDetails).not.toMatch(/Maria|Silva/)
      }
    }
  })
  it('round 1: preserves only an explicitly declared opaque structural join at the root', async () => {
    const address = createCustomerResources().find(def => def.model === 'Endereco')!
    const ctx = context(['read:all']), customerId = 'cmr1abc123def456ghi789jkl'
    for (const value of [customerId, 'alice@example.test', '11912345678', '529.982.247-25', 'session=private', 'session-private-id', 'abc::1']) {
      const raw = { ...fixture('Endereco'), clienteId: value }
      const resource = { ...address, adapter: { findMany: async () => [raw], findFirst: async () => raw } }
      for (const output of [address.serialize(raw, ctx), (await executeItem(resource, ctx, 'id')).data, (await executeList(resource, ctx, parseListQuery('https://test.local/', resource), options)).data[0]]) expect(output.clienteId).toBe(value === customerId ? value : '[REDACTED]')
    }
    const { def, delegate } = setup('EventoTracking'), raw = { ...row('EventoTracking'), dados: { clienteId: customerId, sibling: 'safe' } }
    delegate.findMany.mockResolvedValue([raw])
    expect((await executeList(def, ctx, query(def), options)).data[0].dados).toEqual({ clienteId: '[REDACTED]', sibling: 'safe' })
  })
  it.each(['sessionId', 'email', 'userId', 'clienteId'])('round 1: rejects undeclared/non-relational structural ID policy: %s', field => {
    const { def, delegate } = setup('EventoTracking')
    return expect(executeList({ ...def, structuralIdFields: [field] }, context(), query(def), options)).rejects.toThrow(TypeError).then(() => expect(delegate.findMany).not.toHaveBeenCalled())
  })
  it.each(['scalar', 'JSON'] as const)('round 1: public-value policy cannot bypass private identities: %s', kind => {
    const { def, delegate } = setup('EventoTracking')
    const malicious = kind === 'scalar' ? { ...def, publicFields: ['sessaoId'] } : { ...def, fields: [...def.fields.filter(field => field.name !== 'dados'), { name: 'dados', type: 'array' as const, items: { type: 'object' as const, properties: { clienteId: { type: 'string' as const } } } }], publicJsonFields: { dados: ['clienteId'] } }
    return expect(executeList(malicious, context(), query(def), options)).rejects.toThrow(TypeError).then(() => expect(delegate.findMany).not.toHaveBeenCalled())
  })
  it('round 1: keeps nominally public photo URLs and product copy usable without PII', async () => {
    const definitions = createCatalogResources(), ctx = context(['read:all'])
    for (const [model, field, value, expected] of [
      ['AvaliacaoFoto', 'url', 'https://media.example.test/public.webp?token=DO-NOT-LEAK', 'https://media.example.test/public.webp?[REDACTED]'],
      ['Produto', 'descricao', 'Copy comercial Sixxis token=DO-NOT-LEAK', 'Copy comercial Sixxis [REDACTED]'],
      ['Produto', 'videoUrl', 'https://media.example.test/video?token=DO-NOT-LEAK', 'https://media.example.test/video?[REDACTED]'],
      ['FormaPagamento', 'iconeUrl', 'https://media.example.test/icon.svg', 'https://media.example.test/icon.svg'],
      ['Banner', 'link', '/produtos/public-product', '/produtos/public-product'],
      ['PopupInicial', 'linkDestino', '/produtos/public-product', '/produtos/public-product'],
    ]) {
      const definition = definitions.find(def => def.model === model)!, raw = { ...fixture(model), [field]: value }
      const resource = { ...definition, adapter: { findMany: async () => [raw], findFirst: async () => raw } }
      for (const output of [resource.serialize(raw, ctx), (await executeItem(resource, ctx, 'id')).data, (await executeList(resource, ctx, parseListQuery('https://test.local/', resource), options)).data[0]]) expect(output[field]).toBe(expected)
    }
  })
  it.each(['EventoTracking', 'EventoAnalitico', 'AuditLog'])('round 1: protects free JSON identities, URLs and textual messages through every path: %s', async model => {
    const { def, delegate } = setup(model), field = model === 'AuditLog' ? 'metadata' : 'dados'
    const payload = { sibling: 'public-operation', nested: [{ actor: 'PRIVATE-ACTOR', clienteId: 'PRIVATE-CLIENT', identity: { userId: 'PRIVATE-USER' }, landingPage: '/pedidos/PRIVATE-ID?token=DO-NOT-LEAK', url: '/conta/PRIVATE-ID', produtoId: 'public-product', count: 2, details: 'mensagem=PRIVATE-MESSAGE; status=ok; token=DO-NOT-LEAK; 4111111111111111' }] }
    const raw = { ...row(model), [field]: model === 'EventoAnalitico' ? JSON.stringify(payload) : payload }
    delegate.findMany.mockResolvedValue([raw]); delegate.findFirst.mockResolvedValue(raw)
    for (const scopes of [['read:all'], ['read:all', 'read:pii'], ['read:all', 'read:mensagens'], ['read:all', 'read:pii', 'read:mensagens']] as const) {
      const ctx = context([...scopes])
      const outputs = [
        { output: def.serialize(raw, ctx), projected: false },
        { output: (await executeItem(def, ctx, 'id')).data, projected: true },
        { output: (await executeList(def, ctx, query(def), options)).data[0], projected: true },
      ]
      for (const { output, projected } of outputs) {
        const result = typeof output[field] === 'string' ? JSON.parse(output[field] as string) : output[field]
        const text = JSON.stringify(result)
        if (projected && model === 'AuditLog' && !scopes.includes('read:pii' as never)) {
          expect(result).toBeUndefined()
          expect(text).toBeUndefined()
          continue
        }
        expect(result).toMatchObject({ sibling: 'public-operation', nested: [{ produtoId: 'public-product', count: 2 }] })
        expect(text).not.toMatch(/DO-NOT-LEAK|4111111111111111/)
        if (!scopes.includes('read:pii' as never)) expect(text).not.toMatch(/PRIVATE-ACTOR|PRIVATE-CLIENT|PRIVATE-USER|PRIVATE-ID/)
        else expect(text).toMatch(/PRIVATE-ACTOR/)
        if (!scopes.includes('read:mensagens' as never)) expect(text).not.toContain('PRIVATE-MESSAGE')
        else expect(text).toContain('PRIVATE-MESSAGE')
      }
    }
  })
  it.each([['RelatorioVendaHora', 'hora', 23], ['RelatorioVendaHora', 'diaSemana', 6], ['TrafegoBruto', 'hora', 23]] as const)('round 1: validates integer range before adapter for %s.%s', async (model, field, max) => {
    const { def, delegate } = setup(model)
    const base = query(def)
    for (const value of ['-1', String(max + 1), '1.5', '9007199254740993', `0,${max + 1}`]) {
      expect(() => query(def, `${field}=${value}`)).toThrow()
      await expect(executeList(def, context(), { ...base, filters: { [field]: [value] } }, options)).rejects.toMatchObject({ status: 400 })
    }
    expect(delegate.findMany).not.toHaveBeenCalled()
    for (const value of [0, 1, max]) {
      const parsed = query(def, `${field}=${value}`)
      expect(buildResourceWhere(def, parsed).AND).toContainEqual({ [field]: value })
      await executeList(def, context(), parsed, options)
    }
    expect(buildResourceWhere(def, query(def, `${field}=0,${max}`)).AND).toContainEqual({ [field]: { in: [0, max] } })
  })
  it('retains only the nominal consent preference key while sanitizing its value', async () => {
    const { def, delegate } = setup('ClienteInsight')
    const raw = { ...row(def.model), cookieCategs: JSON.stringify({ analytics: true, token: 'DO-NOT-LEAK', email: 'alice@example.test', mensagem: 'PRIVATE-MESSAGE', nested: { cookieCategs: 'DO-NOT-LEAK' } }) }
    delegate.findMany.mockResolvedValue([raw]); delegate.findFirst.mockResolvedValue(raw)
    for (const output of [def.serialize(raw, context(['read:all'])), (await executeList(def, context(['read:all']), query(def), options)).data[0], (await executeItem(def, context(['read:all']), 'id')).data]) {
      expect(JSON.parse(output.cookieCategs as string)).toEqual({ analytics: true, email: 'a***@example.test', nested: {} })
      expect(JSON.stringify(output)).not.toMatch(/DO-NOT-LEAK|PRIVATE-MESSAGE/)
    }
  })
  it.each(['password', 'token', 'secret', 'apiKey', 'visitorHash', 'cookie', 'unknown', 'constructor'])('rejects a malicious safe-key override before adapter: %s', name => {
    const { def, delegate } = setup('ClienteInsight')
    const malicious = { ...def, safeKeyFields: [name] }
    return expect(executeList(malicious, context(), query(def), options)).rejects.toThrow(TypeError).then(() => expect(delegate.findMany).not.toHaveBeenCalled())
  })
  it('cannot apply the consent-key exception to another resource', async () => {
    const { def, delegate } = setup('EventoAnalitico')
    await expect(executeList({ ...def, safeKeyFields: ['cookieCategs'] }, context(), query(def), options)).rejects.toThrow(TypeError)
    expect(delegate.findMany).not.toHaveBeenCalled()
  })
  it.each(['unselected', 'scoped', 'non-string', 'relation', 'wrong-slug', 'wrong-model'])('rejects malformed consent-key definition metadata: %s', async kind => {
    const { def, delegate } = setup('ClienteInsight')
    const malformed: ResourceDefinition = { ...def, fields: def.fields.map(field => field.name === 'cookieCategs' ? { ...field, ...(kind === 'scoped' ? { scope: 'read:pii' as const } : kind === 'non-string' ? { type: 'object' as const } : {}) } : field), select: { ...def.select } }
    if (kind === 'unselected') delete malformed.select.cookieCategs
    if (kind === 'relation') malformed.expands = [{ name: 'cookieCategs', many: false, resource: () => def }]
    if (kind === 'wrong-slug') malformed.slug = 'other'
    if (kind === 'wrong-model') malformed.model = 'Other'
    await expect(executeList(malformed, context(), query(def), options)).rejects.toThrow(TypeError)
    expect(delegate.findMany).not.toHaveBeenCalled()
  })
  it.each(models)('recursively strips secrets and messages in every JSON/text field: %s', async model => {
    const { def, delegate } = setup(model), raw = row(model)
    const text = 'alice@example.test; token=DO-NOT-LEAK; 4111111111111111'
    for (const field of Prisma.dmmf.datamodel.models.find(item => item.name === model)!.fields.filter(field => field.kind !== 'object' && field.name !== 'id' && field.type === 'String' && !['dia'].includes(field.name))) raw[field.name] = text
    for (const field of def.fields.filter(field => field.type === 'object')) raw[field.name] = { token: 'DO-NOT-LEAK', email: 'alice@example.test', mensagem: 'PRIVATE-MESSAGE', nested: [{ visitorHash: 'DO-NOT-LEAK', safe: text }] }
    // Real JSON stored as text must be parsed/sanitized recursively while preserving string wire type.
    for (const name of ['dados', 'categorias', 'produtosVistos', 'buscas', 'cookieCategs']) if (typeof raw[name] === 'string') raw[name] = JSON.stringify({ token: 'DO-NOT-LEAK', email: 'alice@example.test', mensagem: 'PRIVATE-MESSAGE' })
    delegate.findMany.mockResolvedValue([raw]); delegate.findFirst.mockResolvedValue(raw)
    for (const scopes of [[def.scope], ['read:all'], ['read:all', 'read:pii'], ['read:all', 'read:pii', 'read:mensagens']] as const) {
      const ctx = context([...scopes])
      const outputs = [def.serialize(raw, ctx), (await executeItem(def, ctx, 'id')).data, (await executeList(def, ctx, query(def), options)).data[0]]
      for (const output of outputs) {
        const serialized = JSON.stringify(output)
        expect(serialized).not.toMatch(/DO-NOT-LEAK|4111111111111111|visitorHash/)
        if (!scopes.includes('read:mensagens' as never)) expect(serialized).not.toContain('PRIVATE-MESSAGE')
        if (!scopes.includes('read:pii' as never)) expect(serialized).not.toContain('alice@example.test')
      }
    }
  })
  it.each(models)('masks every declared PII scalar without additive PII scope: %s', model => {
    const def = get(model), raw = row(model)
    const pii = ['sessionId', 'sessaoId', 'userId', 'ip', 'userAgent', 'gclid', 'gbraid', 'wbraid', 'cidade', 'clienteId', 'actor', 'target', 'pagina', 'referer', 'landingPage', 'path', 'criadoPor']
    for (const key of pii) if (Object.hasOwn(raw, key)) raw[key] = key === 'criadoPor' ? 'Alice Admin' : `${key}-PRIVATE`
    const restricted = def.serialize(raw, context(['read:all'])), full = def.serialize(raw, context())
    for (const key of pii.filter(key => Object.hasOwn(def.select, key))) { expect(restricted[key], key).not.toBe(raw[key]); expect(full[key], key).toBe(raw[key]) }
  })
  it.each(['SessaoVisitante', 'EventoTracking', 'BloqueioFraude'])('selects only bounded, scoped one-level expansions: %s', async model => {
    const { def, delegate } = setup(model)
    expect(def.expands.length).toBeGreaterThan(0)
    for (const expansion of def.expands) {
      const child = expansion.resource(), childRow = row(child.model)
      for (const grandchild of child.expands) childRow[grandchild.relation ?? grandchild.name] = { token: 'DO-NOT-LEAK' }
      const raw = { ...row(model), [expansion.relation ?? expansion.name]: expansion.many ? [childRow] : childRow }
      delegate.findMany.mockResolvedValue([raw]); delegate.findFirst.mockResolvedValue(raw)
      const childContext = context(['read:all'])
      const output = (await executeList(def, childContext, query(def, `expand=${expansion.name}`), options)).data[0]
      const expectedChild = child.serialize(childRow, childContext)
      for (const field of child.fields) if (field.scope && !hasScope(childContext.identity!, field.scope)) delete expectedChild[field.name]
      expect(expansion.many ? (output[expansion.name] as { data: unknown[] }).data[0] : output[expansion.name]).toEqual(expectedChild)
      expect(delegate.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ select: { ...def.select, [expansion.relation ?? expansion.name]: { select: child.select, ...(expansion.many ? { take: 51, orderBy: { id: 'asc' } } : {}) } } }))
      if (child.scope !== def.scope) await expect(executeItem(def, context([def.scope]), 'id', { expand: [expansion.name] })).rejects.toMatchObject({ status: 403 })
    }
  })
  it('queries TrafegoBruto by literal inclusive calendar days, never by createdAt or visitorHash', async () => {
    const { def, delegate } = setup('TrafegoBruto')
    await executeList(def, context(), query(def, 'dispositivo=mobile'), options)
    expect(delegate.findMany).toHaveBeenCalledWith({ where: { AND: [{ dia: { gte: '2026-01-01', lte: '2026-01-02' } }, { dispositivo: 'mobile' }] }, select: def.select, orderBy: [{ dia: 'asc' }, { id: 'asc' }], take: 101 })
    expect(def.fields.find(field => field.name === 'dia')).toMatchObject({ type: 'string', format: 'date' })
    expect(def.description).toMatch(/granularidade diária/i)
    expect(def.description).toContain('America/Sao_Paulo')
    expect(def.description).toMatch(/inclusiv/i)
    for (const extra of ['visitorHash=secret', 'sort=visitorHash', 'fields=visitorHash', 'sort=createdAt']) expect(() => query(def, extra)).toThrow()
  })
  it.each([['2026-01-31', '2026-01-31T03:00:00.000Z'], ['2018-01-31', '2018-01-31T02:00:00.000Z'], ['2018-11-04', '2018-11-04T03:00:00.000Z']])('normalizes daily freshness in the business timezone: %s', async (day, expected) => {
    const { def, delegate } = setup('TrafegoBruto')
    delegate.findFirst.mockResolvedValue({ dia: day })
    expect((await def.countAndLastUpdate!(context())).ultimaAtualizacao).toBe(expected)
  })
  it('allows bounded q only on explicitly designated text fields', () => {
    for (const def of definitions) {
      expect(() => parseListQuery('https://test.local/?q=hello', def)).toThrow()
      if (def.searchFields?.length) expect(buildResourceWhere(def, query(def, 'q=hello')).AND).toContainEqual({ OR: def.searchFields.map(field => ({ [field]: { contains: 'hello' } })) })
    }
  })
})
