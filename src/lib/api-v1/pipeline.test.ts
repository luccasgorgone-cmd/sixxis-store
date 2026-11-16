import { randomBytes } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { withApiV1 } from './pipeline'
import { ApiAuthError } from './auth'
import { rateLimitApiKey } from './rate-limit'
import { auditRequest, recordLastUsed, safeClientIp } from './audit'
import type { ApiIdentity } from './types'

const provider = vi.hoisted(() => ({ limit: vi.fn(), slidingWindow: vi.fn(), construct: vi.fn() }))
vi.mock('@upstash/redis', () => ({ Redis: class {} }))
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: class {
  static slidingWindow = provider.slidingWindow
  limit = provider.limit
  constructor(config: unknown) { provider.construct(config) }
} }))
afterEach(() => { vi.unstubAllEnvs() })

const identity: ApiIdentity = { id: 'key-id', prefixo: 'safe-prefix', nome: 'Fixture', scopes: new Set(['read:all']), expiraEm: null }
const req = () => new Request('https://example.test/api/v1/produtos?q=private-person&email=private%40example.test&token=secret', { headers: { 'x-forwarded-for': '192.0.2.3, 192.0.2.4', 'x-request-id': 'untrusted' } })
const deps = () => ({ authenticate: vi.fn().mockResolvedValue(identity), rateLimit: vi.fn().mockResolvedValue({ success: true, limit: 600, remaining: 599, reset: Date.now() + 60_000 }), audit: vi.fn().mockResolvedValue(undefined), lastUsed: vi.fn().mockResolvedValue(undefined) })

describe('API pipeline', () => {
  it('removes every CORS header even when returned by a handler', async () => {
    const res = await withApiV1(() => new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Expose-Headers': '*' } }), { deps: deps() })(req())
    expect([...res.headers.keys()].some(key => key.startsWith('access-control-'))).toBe(false)
  })
  it('contains unexpected handler errors without leaking their details', async () => {
    const d = deps()
    const res = await withApiV1(() => { throw new Error('private-handler-payload') }, { deps: d })(req())
    expect(res.status).toBe(500)
    expect((await res.text()).includes('private-handler-payload')).toBe(false)
    expect(d.audit).toHaveBeenCalledOnce()
  })
  it('adds no-store, request id and 600/min rate headers and awaits metadata writes', async () => {
    const d = deps()
    const response = await withApiV1(async () => Response.json({ data: [] }), { scope: 'read:catalogo', deps: d })(req())
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-request-id')).not.toBe('untrusted')
    expect(response.headers.get('x-ratelimit-limit')).toBe('600')
    expect(response.headers.get('x-ratelimit-remaining')).toBe('599')
    expect(d.audit).toHaveBeenCalledOnce()
    expect(d.lastUsed).toHaveBeenCalledWith(identity, '192.0.2.3')
    expect(JSON.stringify(d.audit.mock.calls).includes('private-person')).toBe(false)
    expect(JSON.stringify(d.audit.mock.calls).includes('private@example.test')).toBe(false)
  })
  it('returns 401 and still audits unauthenticated requests', async () => {
    const d = deps(); d.authenticate.mockRejectedValue(new ApiAuthError())
    const res = await withApiV1(vi.fn(), { deps: d })(req())
    expect(res.status).toBe(401)
    expect(res.headers.get('www-authenticate')).toBe('Bearer')
    expect(d.audit.mock.calls[0][0].identity).toBeNull()
  })
  it('returns 403 for independent scope without running the handler', async () => {
    const handler = vi.fn(); const d = deps()
    const res = await withApiV1(handler, { scope: 'read:pii', deps: d })(req())
    expect(res.status).toBe(403); expect(handler).not.toHaveBeenCalled()
    expect(d.rateLimit).toHaveBeenCalledWith('key-id')
  })
  it('returns 429 with Retry-After at exhaustion', async () => {
    const d = deps(); d.rateLimit.mockResolvedValue({ success: false, limit: 600, remaining: 0, reset: Date.now() + 60_000 })
    const res = await withApiV1(vi.fn(), { deps: d })(req())
    expect(res.status).toBe(429); expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0')
  })
  it('returns generic 503 on limiter infrastructure failure and audits', async () => {
    const d = deps(); d.rateLimit.mockRejectedValue(new Error('private-error-value'))
    const res = await withApiV1(vi.fn(), { deps: d })(req())
    expect(res.status).toBe(503); expect((await res.text()).includes('private-error-value')).toBe(false)
    expect(d.audit).toHaveBeenCalledOnce()
  })
  it('metadata failure never changes response or logs payload', async () => {
    const d = deps(); d.audit.mockRejectedValue(new Error('private')); d.lastUsed.mockRejectedValue(new Error('private'))
    expect((await withApiV1(async () => Response.json({ ok: true }), { deps: d })(req())).status).toBe(200)
  })
})

describe('audit metadata boundaries', () => {
  it('never persists raw/encoded credentials embedded in paths or query key names', async () => {
    const raw = `sxs_live_${randomBytes(32).toString('base64url')}`
    const create = vi.fn().mockResolvedValue({})
    const encoded = raw.replaceAll('_', '%255F')
    await auditRequest({ identity, requestId: 'request-id', path: `/api/v1/${encoded}`, queryKeys: [raw, 'q'], status: 404, durationMs: 1, ip: 'unknown' }, { prisma: { apiAuditoriaLeitura: { create } } })
    const data = JSON.stringify(create.mock.calls)
    expect(data.includes(raw)).toBe(false)
    expect(data.includes(encoded)).toBe(false)
    expect(create.mock.calls[0][0].data.rota === '/api/v1/[REDACTED]').toBe(true)
    expect(create.mock.calls[0][0].data.queryKeys).toEqual(['q'])
  })
  it('persists explicit query keys only and safe bounded IP', async () => {
    const create = vi.fn().mockResolvedValue({}); const prisma = { apiAuditoriaLeitura: { create } }
    await auditRequest({ identity, requestId: 'request-id', path: '/api/v1/produtos', queryKeys: ['q', 'email', 'token'], status: 200, durationMs: 4, ip: '192.0.2.3' }, { prisma })
    expect(create.mock.calls[0][0].data).toMatchObject({ chaveId: identity.id, queryKeys: ['email', 'q'], ip: '192.0.2.3' })
    expect(safeClientIp(new Request('https://example.test', { headers: { 'x-forwarded-for': 'not an ip' } }))).toBe('unknown')
  })
  it('updates lastUsed/IP by id with no raw request or hash', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    await recordLastUsed(identity, 'malicious-ip', { prisma: { apiChaveLeitura: { updateMany } } })
    expect(updateMany.mock.calls[0][0].where).toEqual({ id: 'key-id', revogadoEm: null })
    expect(updateMany.mock.calls[0][0].data.ultimoIp).toBeNull()
  })
})

describe('API limiter production fail-closed', () => {
  it('uses the actual shared Upstash adapter and propagates provider failures as 503', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fixture')
    vi.stubEnv('API_V1_RATE_LIMIT_PER_MINUTE', '600')
    provider.limit.mockResolvedValueOnce({ success: true, remaining: 599, reset: 60_000 })
    expect((await rateLimitApiKey('adapter-key')).limit).toBe(600)
    expect(provider.slidingWindow).toHaveBeenCalledWith(600, '1 m')
    expect(provider.construct.mock.calls[0][0]).toMatchObject({ prefix: 'rl:api-leitura:600', analytics: false })
    expect(provider.limit).toHaveBeenCalledWith('adapter-key')
    provider.limit.mockRejectedValueOnce(new Error('provider-private-detail'))
    await expect(rateLimitApiKey('adapter-key')).rejects.toMatchObject({ status: 503 })
  })
  it.each(['0', '-1', '1.5', 'NaN', '0x10', ''])('fails closed for invalid configured limit', async value => {
    await expect(rateLimitApiKey('id', 600, '1 m', { env: { NODE_ENV: 'production', API_V1_RATE_LIMIT_PER_MINUTE: value } })).rejects.toMatchObject({ status: 503 })
  })
  it('returns unavailable when Upstash is absent in production', async () => {
    await expect(rateLimitApiKey('id', 600, '1 m', { env: { NODE_ENV: 'production' } })).rejects.toMatchObject({ status: 503 })
  })
  it('returns unavailable on provider failure in production', async () => {
    await expect(rateLimitApiKey('id', 600, '1 m', { env: { NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'fixture' }, limit: vi.fn().mockRejectedValue(new Error('provider')) })).rejects.toMatchObject({ status: 503 })
  })
  it('uses configurable per-key limit with shared limiter', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: 60_000 })
    const res = await rateLimitApiKey('id', 600, '1 m', { env: { NODE_ENV: 'production', API_V1_RATE_LIMIT_PER_MINUTE: '10', UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'fixture' }, limit })
    expect(res.limit).toBe(10); expect(limit).toHaveBeenCalledWith('api-leitura', 'id', 10, '1 m')
  })
})
