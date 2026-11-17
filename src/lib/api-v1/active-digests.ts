import { randomUUID } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { API_SCOPES } from './constants'
import type { ApiIdentity, ApiScope } from './types'

const ACTIVE_DIGESTS_KEY = 'api:v1:active-digests'
const QUARANTINED_DIGESTS_KEY = 'api:v1:quarantined-digests'
const INITIALIZED_FIELD = '__initialized__'
const VERSION_FIELD = '__version__'
const DEFAULT_TIMEOUT_MS = 5_000
const LOCK_TTL_MS = 60_000
const LOCK_WORK_TIMEOUT_MS = 25_000
const LOCK_RETRY_MS = 25
const REJECTED_DIGEST_TTL_MS = 60_000
const RECONCILE_RETRIES = 3

type RedisClient = {
  hget(key: string, field: string): Promise<unknown>
  hset(key: string, values: Record<string, string>): Promise<unknown>
  expire(key: string, seconds: number): Promise<unknown>
  del(key: string): Promise<unknown>
  set(key: string, value: string, options: { nx: true; px: number } | { px: number }): Promise<unknown>
  eval(script: string, keys: string[], args: unknown[]): Promise<unknown>
}

export type ActiveDigestState =
  | { state: 'uninitialized' | 'inactive' | 'quarantined' }
  | { state: 'active'; identity: ApiIdentity }
export type ActiveDigestStore = {
  lookup(digest: string): Promise<ActiveDigestState>
  add(digest: string, identity: ApiIdentity): Promise<void>
  reject(digest: string): Promise<void>
  remove(digest: string): Promise<void>
  replaceFrom(load: () => Promise<ReadonlyMap<string, ApiIdentity>>): Promise<void>
  withDigestLock(digest: string, work: () => Promise<unknown>): Promise<unknown>
}

type StoreOptions = {
  redis?: RedisClient
  env?: Record<string, string | undefined>
  now?: () => number
  randomId?: () => string
  timeoutMs?: number
  wait?: (milliseconds: number) => Promise<void>
}

const RELEASE_LOCK = `-- RELEASE_LOCK
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0`
const LOOKUP_DIGEST = `-- LOOKUP_DIGEST
if redis.call('HGET', KEYS[2], ARGV[1]) then
  return {'quarantined'}
end
if redis.call('GET', KEYS[3]) then
  return {'quarantined'}
end
local identity = redis.call('HGET', KEYS[1], ARGV[1])
if identity then
  return {'active', identity}
end
if not redis.call('HGET', KEYS[1], '${INITIALIZED_FIELD}') then
  return {'uninitialized'}
end
return {'inactive'}`
const MUTATE_DIGEST = `-- MUTATE_DIGEST
local version = redis.call('HINCRBY', KEYS[1], '${VERSION_FIELD}', 1)
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('PERSIST', KEYS[1])
return version`
const QUARANTINE_DIGEST = `-- QUARANTINE_DIGEST
local version = redis.call('HINCRBY', KEYS[1], '${VERSION_FIELD}', 1)
redis.call('HSET', KEYS[2], ARGV[1], '1')
redis.call('PERSIST', KEYS[1])
redis.call('PERSIST', KEYS[2])
return version`
const PUBLISH_SNAPSHOT = `-- PUBLISH_SNAPSHOT
local current = tonumber(redis.call('HGET', KEYS[1], '${VERSION_FIELD}') or '0')
if current ~= tonumber(ARGV[1]) then
  redis.call('DEL', KEYS[2])
  return 0
end
redis.call('RENAME', KEYS[2], KEYS[1])
redis.call('PERSIST', KEYS[1])
return 1`

function configuredRedis(env: Record<string, string | undefined>): RedisClient {
  const url = env.UPSTASH_REDIS_REST_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Active digest store unavailable')
  return new Redis({ url, token })
}

function serializeIdentity(identity: ApiIdentity): string {
  return JSON.stringify({
    id: identity.id,
    nome: identity.nome,
    prefixo: identity.prefixo,
    scopes: [...identity.scopes].sort(),
    expiraEm: identity.expiraEm?.toISOString() ?? null,
  })
}

function parseIdentity(value: unknown, now: number): ActiveDigestState {
  if (value === null || value === undefined) return { state: 'inactive' }
  if (value === '-1') return { state: 'quarantined' }
  try {
    const parsed = JSON.parse(String(value)) as Record<string, unknown>
    const scopes = parsed.scopes
    const expiraEm = parsed.expiraEm === null ? null : typeof parsed.expiraEm === 'string' ? new Date(parsed.expiraEm) : null
    const validScopes = Array.isArray(scopes) && scopes.length > 0 && scopes.every(scope => typeof scope === 'string' && (API_SCOPES as readonly string[]).includes(scope))
    if (typeof parsed.id !== 'string' || !parsed.id || typeof parsed.nome !== 'string' || typeof parsed.prefixo !== 'string' || !validScopes) return { state: 'quarantined' }
    if (parsed.expiraEm !== null && (!expiraEm || !Number.isFinite(expiraEm.getTime()) || expiraEm.getTime() <= now)) return { state: 'quarantined' }
    return { state: 'active', identity: { id: parsed.id, nome: parsed.nome, prefixo: parsed.prefixo, scopes: new Set(scopes as ApiScope[]), expiraEm } }
  } catch {
    return { state: 'quarantined' }
  }
}

export function createActiveDigestStore(options: StoreOptions = {}): ActiveDigestStore {
  const now = options.now ?? Date.now
  const randomId = options.randomId ?? randomUUID
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const wait = options.wait ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)))
  const redis = () => options.redis ?? configuredRedis(options.env ?? process.env)
  const within = async <T>(operation: Promise<T>, durationMs: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Active digest store unavailable')), durationMs) }),
      ])
    } catch {
      throw new Error('Active digest store unavailable')
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
  const bounded = <T>(operation: Promise<T>): Promise<T> => within(operation, timeoutMs)
  const withLock = async <T>(key: string, work: () => Promise<T>): Promise<T> => {
    const client = redis()
    const token = randomId()
    const deadline = now() + LOCK_WORK_TIMEOUT_MS
    while (now() < deadline) {
      const acquisitionBudget = Math.min(timeoutMs, deadline - now())
      if (acquisitionBudget <= 0) break
      const acquired = await within(client.set(key, token, { nx: true, px: LOCK_TTL_MS }), acquisitionBudget)
      if (acquired === 'OK') {
        const remaining = deadline - now()
        try {
          if (remaining <= 0) throw new Error('Active digest store unavailable')
          return await within(work(), remaining)
        }
        finally { await bounded(client.eval(RELEASE_LOCK, [key], [token])).catch(() => undefined) }
      }
      const retryBudget = Math.min(LOCK_RETRY_MS, deadline - now())
      if (retryBudget <= 0) break
      await wait(retryBudget)
    }
    throw new Error('Active digest store unavailable')
  }
  const version = async (): Promise<number> => {
    const value = await bounded(redis().hget(ACTIVE_DIGESTS_KEY, VERSION_FIELD))
    const parsed = Number(value ?? 0)
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0
  }
  return {
    async lookup(digest) {
      const result = await bounded(redis().eval(LOOKUP_DIGEST, [ACTIVE_DIGESTS_KEY, QUARANTINED_DIGESTS_KEY, `${ACTIVE_DIGESTS_KEY}:rejected:${digest}`], [digest]))
      if (!Array.isArray(result) || typeof result[0] !== 'string') throw new Error('Active digest store unavailable')
      if (result[0] === 'uninitialized' || result[0] === 'inactive' || result[0] === 'quarantined') return { state: result[0] }
      if (result[0] !== 'active' || result.length !== 2) throw new Error('Active digest store unavailable')
      return parseIdentity(result[1], now())
    },
    async add(digest, identity) {
      await bounded(redis().eval(MUTATE_DIGEST, [ACTIVE_DIGESTS_KEY], [digest, serializeIdentity(identity)]))
    },
    async reject(digest) {
      const result = await bounded(redis().set(`${ACTIVE_DIGESTS_KEY}:rejected:${digest}`, '1', { px: REJECTED_DIGEST_TTL_MS }))
      if (result !== 'OK') throw new Error('Active digest store unavailable')
    },
    async remove(digest) {
      await bounded(redis().eval(QUARANTINE_DIGEST, [ACTIVE_DIGESTS_KEY, QUARANTINED_DIGESTS_KEY], [digest]))
    },
    async replaceFrom(load) {
      const client = redis()
      for (let attempt = 0; attempt < RECONCILE_RETRIES; attempt += 1) {
        const expectedVersion = await version()
        const digests = await load()
        const temporary = `${ACTIVE_DIGESTS_KEY}:replace:${randomId()}`
        const values: Record<string, string> = { [INITIALIZED_FIELD]: '1', [VERSION_FIELD]: String(expectedVersion + 1) }
        for (const [digest, identity] of digests) values[digest] = serializeIdentity(identity)
        try {
          await bounded(client.hset(temporary, values))
          await bounded(client.expire(temporary, 120))
          const published = await bounded(client.eval(PUBLISH_SNAPSHOT, [ACTIVE_DIGESTS_KEY, temporary], [expectedVersion]))
          if (Number(published) === 1) return
        } catch (error) {
          await bounded(client.del(temporary)).catch(() => undefined)
          throw error
        }
      }
      throw new Error('Active digest store unavailable')
    },
    withDigestLock(digest, work) {
      return withLock(`${ACTIVE_DIGESTS_KEY}:auth-lock:${digest}`, work)
    },
  }
}

export const activeDigestStore = createActiveDigestStore()
