import { z } from 'zod'
import { API_DEFAULT_LIMIT, API_MAX_LIMIT, API_MAX_EXPANDS } from './constants'
import { decodeCursor, filterHash, type CursorOptions } from './cursor'
import { hasScope } from './auth'
import type { FilterDefinition, ResourceDefinition } from './resource'
import type { ApiIdentity, ListQuery } from './types'

type QueryOptions = CursorOptions & { identity?: ApiIdentity | null }

/** Constant safe details; never include raw query input in an HTTP problem. */
export class ApiQueryError extends Error {
  constructor(public readonly status: 400 | 403 | 404 | 503, message = 'Parâmetros de consulta inválidos.') { super(message); this.name = 'ApiQueryError' }
}
const fail = (): never => { throw new ApiQueryError(400) }
const unique = (values: string[]) => [...new Set(values)].sort()
const csv = (value: string, max = 100) => {
  const values = value.split(',').map(part => part.trim())
  if (values.length > max || values.some(part => !part || part.length > 500)) return fail()
  return unique(values)
}
const dates = ['criadoDesde', 'criadoAte', 'atualizadoDesde', 'atualizadoAte'] as const
const standard = new Set(['limit','cursor','sort','ids','q','fields','expand', ...dates])
function validNumericFilter(value: string, filter: FilterDefinition): boolean {
  const number = Number(value)
  return /^-?\d+(\.\d+)?$/.test(value) && Number.isFinite(number) && (!filter.integer || Number.isSafeInteger(number)) && (filter.min === undefined || number >= filter.min) && (filter.max === undefined || number <= filter.max)
}

export function parseExpand(value: string | undefined, definition: Pick<ResourceDefinition, 'expands'>): string[] {
  if (value === undefined) return []
  const names = csv(value, API_MAX_EXPANDS)
  if (names.some(name => name.includes('.') || !definition.expands.some(expand => expand.name === name))) fail()
  return names
}

export function parseListQuery(url: URL | string, definition: ResourceDefinition, options: QueryOptions = {}): ListQuery {
  const params = (typeof url === 'string' ? new URL(url) : url).searchParams
  for (const key of params.keys()) {
    if ((!standard.has(key) && !Object.hasOwn(definition.filters ?? {}, key)) || params.getAll(key).length !== 1) fail()
  }
  const rawLimit = params.get('limit')
  if (rawLimit !== null && !/^[1-9]\d*$/.test(rawLimit)) fail()
  const limit = rawLimit === null ? Math.min(API_DEFAULT_LIMIT, definition.maxLimit ?? API_MAX_LIMIT) : Number(rawLimit)
  if (!Number.isSafeInteger(limit) || limit > Math.min(API_MAX_LIMIT, definition.maxLimit ?? API_MAX_LIMIT)) fail()
  const sort = params.get('sort') ?? definition.defaultSort ?? definition.sorts[0] ?? 'id'
  const field = sort.startsWith('-') ? sort.slice(1) : sort
  if (!definition.sorts.includes(field)) fail()
  const q: ListQuery = { limit, sort, filters: {} }
  if (params.has('cursor')) q.cursor = params.get('cursor')!
  if (params.has('ids')) q.ids = csv(params.get('ids')!)
  if (params.has('q')) {
    q.q = params.get('q')!.trim()
    if (!q.q || q.q.length > 200 || !definition.searchFields?.length) fail()
  }
  if (params.has('fields')) {
    q.fields = unique(['id', ...csv(params.get('fields')!, definition.fields.length)])
    if (q.fields.some(name => !definition.fields.some(field => field.name === name))) fail()
  }
  if (params.has('expand')) q.expand = parseExpand(params.get('expand')!, definition)
  for (const name of dates) {
    if (!params.has(name)) continue
    if (!definition.dateFields?.[name.startsWith('criado') ? 'created' : 'updated']) fail()
    const value = params.get(name)!
    if (!z.iso.datetime({ offset: true }).safeParse(value).success) fail()
    q[name] = new Date(value)
  }
  for (const [key, filter] of Object.entries(definition.filters ?? {})) {
    if (!params.has(key)) continue
    const values = csv(params.get(key)!)
    if (filter.type === 'boolean' && values.some(value => !['true','false'].includes(value))) fail()
    if (filter.type === 'number' && values.some(value => !validNumericFilter(value, filter))) fail()
    if (filter.values && values.some(value => !filter.values!.includes(value))) fail()
    q.filters[key] = values
    if (key === 'status') q.status = values
  }
  validateListQuery(q, definition, options)
  return q
}

/** Re-run at the execution boundary: callers cannot bypass validation by constructing ListQuery. */
export function validateListQuery(q: ListQuery, definition: ResourceDefinition, options: QueryOptions = {}): void {
  if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > Math.min(API_MAX_LIMIT, definition.maxLimit ?? API_MAX_LIMIT)) fail()
  const sortField = q.sort.replace(/^-/, '')
  if (!definition.sorts.includes(sortField)) fail()
  const sortScope = definition.sortScopes?.[sortField]
  if (sortScope && options.identity !== undefined && (!options.identity || !hasScope(options.identity, sortScope))) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
  if (q.ids && (q.ids.length > 100 || q.ids.some(id => !id || id.length > 500))) fail()
  if (q.q !== undefined && (!q.q.trim() || q.q.length > 200 || !definition.searchFields?.length)) fail()
  if (q.q !== undefined && definition.searchScope && options.identity !== undefined && (!options.identity || !hasScope(options.identity, definition.searchScope))) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
  if (q.fields?.some(name => !definition.fields.some(field => field.name === name))) fail()
  if (q.expand?.length) parseExpand(q.expand.join(','), definition)
  for (const [key, values] of Object.entries(q.filters)) {
    const filter = definition.filters?.[key]
    if (!Object.hasOwn(definition.filters ?? {}, key) || !filter || !Array.isArray(values) || !values.length || values.length > 100) fail()
    if (filter.scope && options.identity !== undefined && (!options.identity || !hasScope(options.identity, filter.scope))) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
    if (values.some(value => typeof value !== 'string' || !value || value.length > 500 || (filter.type === 'boolean' && !['true','false'].includes(value)) || (filter.type === 'number' && !validNumericFilter(value, filter)) || (filter.values && !filter.values.includes(value)))) fail()
  }
  for (const name of dates) if (q[name] && (!definition.dateFields?.[name.startsWith('criado') ? 'created' : 'updated'] || !(q[name] instanceof Date) || !Number.isFinite(q[name]!.getTime()))) fail()
  for (const [from,to] of [['criadoDesde','criadoAte'],['atualizadoDesde','atualizadoAte']] as const) if (q[from] && q[to] && q[from]! > q[to]!) fail()
  if (definition.window) {
    const { from, to } = definition.window
    const start = q[from], end = q[to]
    if (!start || !end || end.getTime() < start.getTime()) fail()
  }
  if (q.cursor !== undefined) {
    const cursor = decodeCursor(q.cursor, options.cursorSecret)
    if (cursor.resource !== definition.slug || cursor.sort !== q.sort || cursor.filterHash !== filterHash(q)) fail()
    const cursorSortField = definition.fields.find(field => field.name === sortField)
    if (cursorSortField?.format === 'date-time' && (typeof cursor.value !== 'string' || !z.iso.datetime({ offset:true }).safeParse(cursor.value).success)) fail()
    if (cursorSortField?.type === 'number' && typeof cursor.value !== 'number') fail()
  }
}
