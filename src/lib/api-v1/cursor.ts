import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { ApiQueryError } from './query'
import type { ResourceDefinition } from './resource'
import type { ListQuery } from './types'

export type CursorOptions = { cursorSecret?: string }
const devSecret = randomBytes(32).toString('base64url')
export function resolveCursorSecret(provided?: string): string {
  const secret = provided ?? process.env.API_V1_CURSOR_SECRET
  if (secret && secret.length >= 32) return secret
  if (provided !== undefined || process.env.NODE_ENV === 'production') throw new ApiQueryError(503, 'Paginação temporariamente indisponível.')
  return devSecret
}
const cursorSchema = z.object({
  v:z.literal(1), resource:z.string().min(1).max(100), sort:z.string().min(1).max(100),
  value:z.union([z.string().max(2000),z.number().finite(),z.boolean()]), id:z.string().min(1).max(500), filterHash:z.string().regex(/^[a-f0-9]{64}$/),
}).strict()
export type Cursor = z.infer<typeof cursorSchema>
const bad = (): never => { throw new ApiQueryError(400, 'Cursor inválido ou incompatível com a consulta.') }

export function encodeCursor(cursor: Cursor, secret?: string): string {
  const parsed=cursorSchema.safeParse(cursor)
  if (!parsed.success) return bad()
  const payload=Buffer.from(JSON.stringify(parsed.data)).toString('base64url')
  const signature=createHmac('sha256',resolveCursorSecret(secret)).update(payload).digest('base64url')
  return `${payload}.${signature}`
}
export function decodeCursor(encoded: string, secret?: string): Cursor {
  const key=resolveCursorSecret(secret)
  if (encoded.length > 8192 || !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]{43}$/.test(encoded)) return bad()
  const [payload, signature] = encoded.split('.')
  const actual=Buffer.from(signature,'base64url')
  const expected=createHmac('sha256',key).update(payload).digest()
  if (actual.length !== expected.length || !timingSafeEqual(actual,expected) || actual.toString('base64url') !== signature) return bad()
  try {
    const decoded=Buffer.from(payload,'base64url')
    if (decoded.toString('base64url') !== payload) return bad()
    const parsed=cursorSchema.safeParse(JSON.parse(decoded.toString('utf8')))
    if (!parsed.success) return bad()
    return parsed.data
  } catch { return bad() }
}
export function filterHash(q: ListQuery): string {
  const sorted=(values?: string[])=>values ? [...new Set(values)].sort() : []
  const filters=Object.fromEntries(Object.entries(q.filters).sort(([a],[b])=>a.localeCompare(b)).map(([key,values])=>[key,sorted(values)]))
  return createHash('sha256').update(JSON.stringify({sort:q.sort,ids:sorted(q.ids),fields:sorted(q.fields),expand:sorted(q.expand),q:q.q??null,criadoDesde:q.criadoDesde?.toISOString()??null,criadoAte:q.criadoAte?.toISOString()??null,atualizadoDesde:q.atualizadoDesde?.toISOString()??null,atualizadoAte:q.atualizadoAte?.toISOString()??null,filters})).digest('hex')
}
export function buildSeekWhere(cursor: Cursor, definition?: Pick<ResourceDefinition,'fields'>): Record<string, unknown> {
  const desc=cursor.sort.startsWith('-'), field=cursor.sort.replace(/^-/,'')
  const op=desc?'lt':'gt'
  const metadata=definition?.fields.find(item=>item.name===field)
  const value=metadata?.format==='date-time'?new Date(String(cursor.value)):cursor.value
  if (field==='id') return { id:{[op]:cursor.id} }
  return {OR:[{[field]:{[op]:value}},{AND:[{[field]:{equals:value}},{id:{[op]:cursor.id}}]}]}
}
