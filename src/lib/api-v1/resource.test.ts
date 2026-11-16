import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseListQuery, parseExpand, ApiQueryError } from './query'
import { buildSeekWhere, decodeCursor, encodeCursor, filterHash } from './cursor'
import { executeList, projectFields, type ResourceDefinition, type ResourceQueryArgs } from './resource'
import { createResourceRegistry } from './registry'
import type { ApiContext } from './types'

const secret = 'test-only-cursor-secret-at-least-32-characters'
const options = { cursorSecret: secret }
const ctx: ApiContext = { requestId: 'req-1', identity: { id: 'key', nome: 'test', prefixo: 'test', scopes: new Set(['read:all']), expiraEm: null }, ip: '', startedAt: 0, rateLimit: { success: true, limit: 600, remaining: 599, reset: 1 } }
const at = new Date('2026-01-01T00:00:00Z')
const rows = ['a', 'b', 'c', 'd'].map(id => ({ id, nome: id, updatedAt: at, secret: 'must-not-leak' }))
type Row = typeof rows[number] & { children?: unknown[] }
const adapter = vi.fn(async (args: ResourceQueryArgs): Promise<Row[]> => { void args; return rows })
const def: ResourceDefinition<Row> = {
  slug: 'things', model: 'Thing', scope: 'read:catalogo', fields: [{ name: 'id', type: 'string' }, { name: 'nome', type: 'string' }, { name: 'updatedAt', type: 'string', format: 'date-time' }],
  expands: [], select: { id: true, nome: true, updatedAt: true }, sorts: ['updatedAt', 'nome', 'id'], defaultSort: 'updatedAt',
  dateFields: { updated: 'updatedAt' }, searchFields: ['nome'], filters: { categoria: { field: 'categoria', type: 'string' } },
  adapter: { findMany: adapter }, serialize: row => ({ id: row.id, nome: row.nome, updatedAt: row.updatedAt.toISOString() }),
}
const query = (search = '', definition = def) => parseListQuery(new URL(`https://example.test/api/v1/things?${search}`), definition, options)
beforeEach(() => { adapter.mockResolvedValue(rows) })
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); vi.clearAllMocks() })

describe('list validation before adapter', () => {
  it('uses 100 default, allows 500 and rejects invalid limits', () => {
    expect(query()).toMatchObject({ limit: 100, sort: 'updatedAt', filters: {} })
    expect(query('limit=500').limit).toBe(500)
    for (const limit of ['0', '-1', '501', '2.1', 'no', '']) expect(() => query(`limit=${limit}`)).toThrow(ApiQueryError)
  })
  it.each(['cursor=', 'wat=1', 'incluirExcluidos=true', 'fields=secret', 'fields=__proto__', 'expand=wat', 'sort=secret', 'sort=updatedAt,nome', 'limit=1&limit=2', 'q=', 'q=' + 'a'.repeat(201), 'ids=' + Array.from({length:101}, (_,i)=>String(i)).join(',')])('rejects %s as 400', value => {
    try { query(value); expect.fail('must reject') } catch(error) { expect(error).toMatchObject({ status: 400 }) }
  })
  it('honors stricter resource limits', () => {
    expect(query('', {...def,maxLimit:50}).limit).toBe(50)
    expect(()=>query('limit=201', {...def,maxLimit:200})).toThrow(ApiQueryError)
  })
  it('rejects unconfigured dates, malformed dates, reversed optional windows', () => {
    for (const value of ['criadoDesde=2026-01-01T00:00:00Z', 'atualizadoDesde=2026-02-30T00:00:00Z', 'atualizadoDesde=2026-02-01T00:00:00Z&atualizadoAte=2026-01-01T00:00:00Z']) expect(() => query(value)).toThrow(ApiQueryError)
  })
  it('bounds ids/q and only reduces fields with id always', () => {
    expect(query('ids=b,a,a&q=hello&fields=nome').ids).toEqual(['a','b'])
    expect(query('fields=nome').fields).toEqual(['id', 'nome'])
    expect(projectFields({ id:'1', nome:'ok', secret:'no' }, ['nome'], def.fields)).toEqual({id:'1',nome:'ok'})
    expect(projectFields({ id:'1', nome:'ok', secret:'no' }, undefined, def.fields)).toEqual({id:'1',nome:'ok'})
    expect(() => projectFields({id:'1'}, ['secret'], def.fields)).toThrow(ApiQueryError)
  })
  it('requires complete finite windows before any adapter call', async () => {
    const bounded = { ...def, window: { from: 'atualizadoDesde', to: 'atualizadoAte', maxDays:31 } } as ResourceDefinition<Row>
    for (const search of ['', 'atualizadoDesde=2026-01-01T00:00:00Z', 'atualizadoDesde=2026-02-01T00:00:00Z&atualizadoAte=2026-01-01T00:00:00Z', 'atualizadoDesde=2026-01-01T00:00:00Z&atualizadoAte=2026-02-02T00:00:00Z']) {
      const params = new URLSearchParams(search)
      const unsafe = { ...query(), ...(params.has('atualizadoDesde') ? { atualizadoDesde: new Date(params.get('atualizadoDesde')!) } : {}), ...(params.has('atualizadoAte') ? { atualizadoAte: new Date(params.get('atualizadoAte')!) } : {}) }
      await expect(executeList(bounded, ctx, unsafe, options)).rejects.toMatchObject({status:400})
    }
    expect(adapter).not.toHaveBeenCalled()
    expect(query('atualizadoDesde=2026-01-01T00:00:00Z&atualizadoAte=2026-02-01T00:00:00Z', bounded).limit).toBe(100)
  })
})

describe('confidential, authenticated, bound stable cursors', () => {
  it('binds canonical filters, sort, fields and expand independent of ordering', () => {
    expect(filterHash(query('ids=b,a&fields=nome,id&categoria=x,y'))).toBe(filterHash(query('categoria=y,x&fields=id,nome&ids=a,b')))
    expect(filterHash(query('categoria=x'))).not.toBe(filterHash(query('categoria=y')))
  })
  it('rejects malformed, tampered, cross-resource, cross-filter and cross-sort cursor', async () => {
    const first = await executeList(def, ctx, query('limit=1'), options)
    const cursor = first.meta.nextCursor!
    expect(decodeCursor(cursor, secret)).toMatchObject({v:1,resource:'things',sort:'updatedAt',id:'a'})
    for (const value of ['bad', cursor.slice(0,-3)+'xxx', Buffer.from(JSON.stringify({...decodeCursor(cursor,secret),id:'c'})).toString('base64url')]) expect(() => query(`cursor=${value}`)).toThrow(ApiQueryError)
    expect(() => parseListQuery(new URL(`https://example.test/?cursor=${cursor}`), {...def,slug:'other'}, options)).toThrow(ApiQueryError)
    for (const suffix of ['&categoria=x','&sort=-updatedAt','&fields=nome']) expect(() => query(`cursor=${cursor}${suffix}`)).toThrow(ApiQueryError)
  })
  it.each(['updatedAt', '-updatedAt'])('paginates equal timestamps with id tie-break without duplicate or gap: %s', async sort => {
    adapter.mockImplementation(async args => {
      const direction = sort.startsWith('-') ? -1 : 1
      const sorted = [...rows].sort((a,b)=>a.id.localeCompare(b.id)*direction)
      const seek = args.where.AND as Record<string, unknown>[]
      const clause = seek.find(part => part.OR) as { OR: Array<{AND?: Array<{id?: {gt?:string;lt?:string}}>}> } | undefined
      const id = clause?.OR[1]?.AND?.[1]?.id
      return sorted.filter(row => !id || (direction === 1 ? row.id > id.gt! : row.id < id.lt!)).slice(0,args.take)
    })
    const found:string[] = []; let cursor:string|null = null
    do {
      const page = await executeList(def, ctx, query(`limit=2&sort=${sort}${cursor ? '&cursor='+cursor : ''}`), options)
      found.push(...page.data.map(row=>row.id as string)); cursor=page.meta.nextCursor
      expect(adapter.mock.lastCall![0].orderBy).toEqual([{updatedAt:sort.startsWith('-')?'desc':'asc'},{id:sort.startsWith('-')?'desc':'asc'}])
      expect(adapter.mock.lastCall![0].take).toBe(3)
    } while(cursor)
    expect(found).toEqual(sort.startsWith('-')?['d','c','b','a']:['a','b','c','d'])
  })
  it('keeps masked nome sort values confidential while paginating with the opaque cursor', async () => {
    const privateName = 'SentinelaConfidencialPessoaUm'
    const privateRows = [{...rows[0],nome:privateName},{...rows[1],nome:'SentinelaConfidencialPessoaZ'}]
    adapter.mockImplementation(async args => {
      const seek = args.where.AND as Record<string, unknown>[]
      return (seek.some(part=>part.OR) ? privateRows.slice(1) : privateRows).slice(0,args.take)
    })
    const first=await executeList(def,ctx,query('sort=nome&limit=1'),options)
    expect(first.data[0].nome).toBe('S***')
    const cursor=first.meta.nextCursor!
    expect(cursor.includes(privateName)).toBe(false)
    for (const segment of cursor.split('.')) expect(Buffer.from(segment,'base64url').toString('utf8').includes('SentinelaConfidencial')).toBe(false)
    expect(Buffer.from(cursor,'base64url').toString('utf8').includes('SentinelaConfidencial')).toBe(false)
    const second=await executeList(def,ctx,query('sort=nome&limit=1&cursor='+cursor),options)
    expect(second.data.map(item=>item.id)).toEqual(['b'])
    expect(second.meta.hasMore).toBe(false)
    expect(decodeCursor(cursor,secret).value).toBe(privateName)
  })
  it('randomizes encrypted cursors and rejects wrong secret, tampered IV/ciphertext/tag and plaintext envelope', () => {
    const payload={v:1 as const,resource:'things',sort:'id',value:'a',id:'a',filterHash:filterHash(query('sort=id'))}
    const first=encodeCursor(payload,secret), second=encodeCursor(payload,secret)
    expect(first).not.toBe(second)
    expect(()=>decodeCursor(first,'different-test-secret-at-least-32-characters')).toThrow(ApiQueryError)
    const packed=Buffer.from(first,'base64url')
    for (const offset of [0,1,13,packed.length-1]) {
      const mutated=Buffer.from(packed); mutated[offset]^=1
      expect(()=>decodeCursor(mutated.toString('base64url'),secret)).toThrow(ApiQueryError)
    }
    expect(()=>decodeCursor(Buffer.from(JSON.stringify(payload)).toString('base64url'),secret)).toThrow(ApiQueryError)
  })
  it('uses inclusive updatedSince together with seek; cursor stays valid when limit changes', async () => {
    adapter.mockResolvedValue(rows)
    const search='atualizadoDesde=2026-01-01T00:00:00Z'
    const first=await executeList(def,ctx,query(search+'&limit=1'),options)
    await executeList(def,ctx,query(search+'&limit=2&cursor='+first.meta.nextCursor),options)
    expect(adapter.mock.lastCall![0].where).toEqual({AND:[{updatedAt:{gte:at}},buildSeekWhere(decodeCursor(first.meta.nextCursor!,secret),def)]})
  })
  it('requires production secret before any query', async () => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('API_V1_CURSOR_SECRET','')
    await expect(executeList(def,ctx,query())).rejects.toMatchObject({status:503})
    expect(adapter).not.toHaveBeenCalled()
  })
  it('seeks by id directly and rejects field type mismatch in authenticated cursor', () => {
    const payload={v:1 as const,resource:'things',sort:'id',value:'a',id:'a',filterHash:filterHash(query('sort=id'))}
    expect(buildSeekWhere(payload,def)).toEqual({id:{gt:'a'}})
    const invalid=encodeCursor({...payload,sort:'updatedAt',value:123,filterHash:filterHash(query())},secret)
    expect(()=>query('cursor='+invalid)).toThrow(ApiQueryError)
  })
  it('validates cursor payload version and rejects unbounded/invalid scalar values', () => {
    expect(()=>encodeCursor({v:2,resource:'things',sort:'id',value:'x',id:'x',filterHash:'0'.repeat(64)} as never,secret)).toThrow(ApiQueryError)
  })
})

describe('allowlisted one-level expansions and deadlines', () => {
  const child: ResourceDefinition<Row> = { ...def, slug:'children', scope:'read:auditoria' }
  const expanded = { ...def, expands:[{name:'children',relation:'children',many:true,resource:()=>child}] }
  it('rejects nested / >3 expansions', () => {
    expect(()=>parseExpand('children.nome',expanded)).toThrow(ApiQueryError)
    expect(()=>parseExpand('children,a,b,c',expanded)).toThrow(ApiQueryError)
  })
  it('selects take:51, serializes children independently and returns max50 + hasMore', async () => {
    adapter.mockResolvedValue([{...rows[0],children:Array.from({length:51},()=>rows[0])}] as Row[])
    const result=await executeList(expanded,ctx,query('expand=children',expanded),options)
    expect(adapter.mock.lastCall![0].select.children).toEqual({ select:child.select, take:51, orderBy:{id:'asc'} })
    expect(result.data[0].children).toMatchObject({_meta:{hasMore:true}})
    expect((result.data[0].children as {data:unknown[]}).data).toHaveLength(50)
    expect(JSON.stringify(result)).not.toContain('secret')
  })
  it('enforces relation scopes separately (read:all does not imply read:mensagens)', async () => {
    const privateExpand={...def,expands:[{name:'children',many:true,resource:()=>({...child,scope:'read:mensagens' as const})}]}
    await expect(executeList(privateExpand,ctx,query('expand=children',privateExpand),options)).rejects.toMatchObject({status:403})
    expect(adapter).not.toHaveBeenCalled()
  })
  it.each([false,true])('rejects a registered message relation in base select even when its field is declared: %s', async declared => {
    const malformed={...def,select:{...def.select,children:true},fields:[...def.fields,...(declared?[{name:'children',type:'array' as const}]:[])],expands:[{name:'messages',relation:'children',many:true,resource:()=>({...child,scope:'read:mensagens' as const})}]}
    await expect(executeList(malformed,ctx,query('',malformed),options)).rejects.toThrow(TypeError)
    expect(adapter).not.toHaveBeenCalled()
  })
  it('rejects registered relations even when an explicit scalarFields allowlist erroneously contains them', async () => {
    const malformed={...def,scalarFields:['id','nome','updatedAt','children'],select:{...def.select,children:true},expands:[{name:'messages',relation:'children',many:true,resource:()=>({...child,scope:'read:mensagens' as const})}]}
    await expect(executeList(malformed,ctx,query('',malformed),options)).rejects.toThrow(TypeError)
    expect(adapter).not.toHaveBeenCalled()
  })
  it('keeps unrequested registered message relations out of the adapter select', async () => {
    const guarded={...def,expands:[{name:'messages',relation:'children',many:true,resource:()=>({...child,scope:'read:mensagens' as const})}]}
    await executeList(guarded,ctx,query('',guarded),options)
    expect(adapter.mock.lastCall![0].select).toEqual(def.select)
    expect(adapter.mock.lastCall![0].select.children).toBeUndefined()
  })
  it('rejects unknown scalar select keys before query', async () => {
    const malformed={...def,select:{...def.select,unregisteredRelation:true}}
    await expect(executeList(malformed,ctx,query('',malformed),options)).rejects.toThrow(TypeError)
    expect(adapter).not.toHaveBeenCalled()
  })
  it('validates child scalar selectors and rejects nested base relations before parent query', async () => {
    const malformedChild={...child,select:{...child.select,privateMessages:true},expands:[{name:'messages',relation:'privateMessages',many:true,resource:()=>({...child,scope:'read:mensagens' as const})}]}
    const malformed={...def,expands:[{name:'children',many:true,resource:()=>malformedChild}]}
    await expect(executeList(malformed,ctx,query('expand=children',malformed),options)).rejects.toThrow(TypeError)
    expect(adapter).not.toHaveBeenCalled()
  })
  it('times out to 503 after 10 seconds and clears its timer', async () => {
    vi.useFakeTimers(); adapter.mockImplementation(()=>new Promise(()=>{}))
    const pending=executeList(def,ctx,query(),options)
    const assertion=expect(pending).rejects.toMatchObject({status:503})
    await vi.advanceTimersByTimeAsync(10_000); await assertion
    expect(vi.getTimerCount()).toBe(0)
  })
  it('clears deadline on adapter rejection', async () => {
    vi.useFakeTimers(); adapter.mockRejectedValue(new Error('database failure'))
    await expect(executeList(def,ctx,query(),options)).rejects.toThrow('database failure')
    expect(vi.getTimerCount()).toBe(0)
  })
  it('uses only explicit registry entries and rejects duplicates', () => {
    const registry=createResourceRegistry([def])
    expect(registry.get('things')).toBe(def)
    expect(registry.get('__proto__')).toBeUndefined()
    expect(registry.list(ctx.identity!)).toEqual([def])
    expect(()=>createResourceRegistry([def,def])).toThrow()
  })
})

describe('nominal public scalar fields', () => {
  it('preserves explicitly public name/description without bypassing secret or PAN redaction', async () => {
    const publicDef = { ...def, publicFields: ['nome'], adapter: { findMany: async () => [{ ...rows[0], nome: 'Climatizador Sixxis token=do-not-leak 4111111111111111' }] } }
    const result = await executeList(publicDef, ctx, query('', publicDef), options)
    expect(result.data[0].nome).toBe('Climatizador Sixxis [REDACTED] [REDACTED]')
    const normal = await executeList(def, ctx, query(), options)
    expect(normal.data[0].nome).toBe('a***')
  })
  it('rejects public policy names outside scalar fields, additive-scope fields or relations before querying', async () => {
    for (const invalid of [
      { ...def, publicFields: ['notAField'] },
      { ...def, publicFields: ['nome'], fields: def.fields.map(field => field.name === 'nome' ? { ...field, scope: 'read:pii' as const } : field) },
      { ...def, publicFields: ['nome'], expands: [{ name: 'nome', many: true, resource: () => def }] },
    ]) await expect(executeList(invalid, ctx, query('', invalid), options)).rejects.toThrow(TypeError)
    expect(adapter).not.toHaveBeenCalled()
  })
})

describe('nominal public JSON array leaves', () => {
  const jsonResource = (): ResourceDefinition => ({
    slug: 'public-json', model: 'PublicJson', scope: 'read:pedidos',
    scalarFields: ['id', 'itens'], select: { id: true, itens: true }, sorts: ['id'], defaultSort: 'id', expands: [],
    fields: [{ name: 'id', type: 'string' }, { name: 'itens', type: 'array', items: { type: 'object', properties: { nome: { type: 'string' }, privateName: { type: 'string' }, preco: { type: 'string' } } } }],
    publicJsonFields: { itens: ['nome'] },
    adapter: { findMany: vi.fn(async () => [{ id: '1', itens: [{ nome: 'Produto Público token=DO-NOT-LEAK 4111111111111111', privateName: 'Contato alice@example.test', preco: '1.00' }] }]) },
    serialize: row => ({ id: row.id, itens: row.itens }),
  })
  it('restores only declared public string leaves after the secret/PAN sanitizer', async () => {
    const current = jsonResource()
    const output = await executeList(current, ctx, parseListQuery('https://test.local/', current), options)
    expect(output.data[0].itens).toEqual([{ nome: 'Produto Público [REDACTED] [REDACTED]', privateName: 'Contato a***@example.test', preco: '1.00' }])
    expect(() => parseListQuery('https://test.local/?publicJsonFields=itens.nome', current)).toThrow()
  })
  it.each(['__proto__', 'constructor', 'nome.extra', 'token', 'unknown', 'preco.x'])('rejects invalid or malicious leaf %s before the adapter', async leaf => {
    const current = { ...jsonResource(), publicJsonFields: { itens: [leaf] } }
    await expect(executeList(current, ctx, parseListQuery('https://test.local/', current), options)).rejects.toThrow('Invalid public JSON policy')
    expect(current.adapter.findMany).not.toHaveBeenCalled()
  })
  it('rejects unknown roots, non-array/non-object fields, scoped parents and non-string leaves', async () => {
    const original = jsonResource()
    for (const current of [
      { ...original, publicJsonFields: { unknown: ['nome'] } },
      { ...original, publicJsonFields: { id: ['nome'] } },
      { ...original, fields: original.fields.map(field => field.name === 'itens' ? { ...field, scope: 'read:pii' as const } : field) },
      { ...original, fields: original.fields.map(field => field.name === 'itens' ? { ...field, items: { type: 'object' as const, properties: { nome: { type: 'object' as const } } } } : field) },
      { ...original, fields: original.fields.map(field => field.name === 'itens' ? { ...field, items: { type: 'string' as const } } : field) },
    ]) {
      await expect(executeList(current, ctx, parseListQuery('https://test.local/', current), options)).rejects.toThrow('Invalid public JSON policy')
      expect(current.adapter.findMany).not.toHaveBeenCalled()
    }
  })
})

it('public JSON leaves do not grant the independent message scope to encoded JSON strings', async () => {
  const current: ResourceDefinition = {
    slug: 'json-leaf', model: 'JsonLeaf', scope: 'read:pedidos', scalarFields: ['id', 'itens'], select: { id: true, itens: true }, sorts: ['id'], expands: [],
    fields: [{ name: 'id', type: 'string' }, { name: 'itens', type: 'array', items: { type: 'object', properties: { nome: { type: 'string' } } } }],
    publicJsonFields: { itens: ['nome'] },
    adapter: { findMany: async () => [{ id: '1', itens: [{ nome: '{"nome":"Produto Público","mensagem":"PRIVATE-MESSAGE","token":"DO-NOT-LEAK"}' }] }] },
    serialize: row => ({ id: row.id, itens: row.itens }),
  }
  const output = await executeList(current, ctx, parseListQuery('https://test.local/', current), options)
  expect(output.data[0].itens).toEqual([{ nome: '{"nome":"Produto Público"}' }])
})
