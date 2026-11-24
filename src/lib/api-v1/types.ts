import type { API_SCOPES, API_VERSION } from './constants'

export type ApiScope = typeof API_SCOPES[number]
export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type ApiIdentity = {
  id: string
  nome: string
  prefixo: string
  scopes: ReadonlySet<ApiScope>
  expiraEm: Date | null
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  /** Unix timestamp in milliseconds (Upstash convention). */
  reset: number
}

export type ApiContext = {
  requestId: string
  identity: ApiIdentity | null
  ip: string
  startedAt: number
}

export type ListQuery = {
  limit: number
  cursor?: string
  sort: string
  ids?: string[]
  fields?: string[]
  expand?: string[]
  criadoDesde?: Date
  criadoAte?: Date
  atualizadoDesde?: Date
  atualizadoAte?: Date
  status?: string[]
  q?: string
  filters: Record<string, string[]>
}

export type PageInfo = { hasMore: boolean; nextCursor: string | null }
export type ItemMeta = { requestId: string; generatedAt: string }
export type ListMeta = ItemMeta & PageInfo & { count: number; apiVersion: typeof API_VERSION }
export type ItemEnvelope<T> = { data: T; meta: ItemMeta }
export type ListEnvelope<T> = { data: T[]; meta: ListMeta }
export type ProblemDetails = {
  type: string
  title: string
  status: number
  detail: string
  requestId: string
}
export type RedactionOptions = { allowPii: boolean; allowMessages: boolean }
