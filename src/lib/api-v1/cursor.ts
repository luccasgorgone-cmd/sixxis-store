import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto'
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

// Independent envelope version and AAD bind the wire format/algorithm to this purpose.
const envelopeVersion = 1
const cursorAad = Buffer.from('sixxis-api-v1:cursor:aes-256-gcm:v1')
const deriveCursorKey = (secret: string) => Buffer.from(hkdfSync('sha256', secret, 'sixxis-api-v1', 'cursor-aes-256-gcm-v1', 32))

/** AEAD protects seek values too: base64url alone must never reveal masked PII. */
export function encodeCursor(cursor: Cursor, secret?: string): string {
  const parsed=cursorSchema.safeParse(cursor)
  if (!parsed.success) return bad()
  const key=deriveCursorKey(resolveCursorSecret(secret))
  const iv=randomBytes(12)
  const cipher=createCipheriv('aes-256-gcm',key,iv,{authTagLength:16})
  cipher.setAAD(cursorAad)
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(parsed.data),'utf8'),cipher.final()])
  const encoded=Buffer.concat([Buffer.from([envelopeVersion]),iv,ciphertext,cipher.getAuthTag()]).toString('base64url')
  if(encoded.length>8192)return bad()
  return encoded
}
export function decodeCursor(encoded: string, secret?: string): Cursor {
  const key=deriveCursorKey(resolveCursorSecret(secret))
  if (encoded.length>8192 || !/^[a-zA-Z0-9_-]+$/.test(encoded)) return bad()
  try {
    const packed=Buffer.from(encoded,'base64url')
    if(packed.toString('base64url')!==encoded || packed.length<30 || packed[0]!==envelopeVersion)return bad()
    const decipher=createDecipheriv('aes-256-gcm',key,packed.subarray(1,13),{authTagLength:16})
    decipher.setAAD(cursorAad)
    decipher.setAuthTag(packed.subarray(-16))
    const plaintext=Buffer.concat([decipher.update(packed.subarray(13,-16)),decipher.final()])
    const parsed=cursorSchema.safeParse(JSON.parse(plaintext.toString('utf8')))
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
