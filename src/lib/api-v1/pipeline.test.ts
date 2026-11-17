import { randomBytes } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { withApiV1 } from './pipeline'
import { ApiAuthError } from './auth'
import { rateLimitApiIngress, rateLimitApiPublic, refundApiIngress } from './rate-limit'
import { auditRequest, recordLastUsed, safeClientIp } from './audit'
import type { ApiIdentity } from './types'

const provider = vi.hoisted(() => ({ limit: vi.fn(), getRemaining: vi.fn(), slidingWindow: vi.fn(), construct: vi.fn() }))
vi.mock('@upstash/redis', () => ({ Redis: class {} }))
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: class {
  static slidingWindow = provider.slidingWindow
  limit = provider.limit
  getRemaining = provider.getRemaining
  constructor(config: unknown) { provider.construct(config) }
} }))
afterEach(() => { vi.unstubAllEnvs() })

const identity: ApiIdentity = { id: 'key-id', prefixo: 'safe-prefix', nome: 'Fixture', scopes: new Set(['read:all']), expiraEm: null }
const req = () => new Request('https://example.test/api/v1/produtos?q=private-person&email=private%40example.test&token=secret', { headers: { 'x-forwarded-for': '192.0.2.3, 192.0.2.4', 'x-request-id': 'untrusted' } })
const deps = () => {
  return {
    reserveAuthFailure: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 }),
    refundAuthFailure: vi.fn().mockResolvedValue(undefined),
    activeDigests: {
      lookup: vi.fn().mockResolvedValue({ state: 'active', identity }),
      add: vi.fn().mockResolvedValue(undefined),
      reject: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      withDigestLock: vi.fn(async (_digest: string, work: () => Promise<unknown>) => work()),
    },
    fingerprint: vi.fn().mockReturnValue('trusted'),
    authenticate: vi.fn().mockResolvedValue(identity),
    audit: vi.fn().mockResolvedValue(undefined),
    lastUsed: vi.fn().mockResolvedValue(undefined),
  }
}

describe('API pipeline', () => {
  it('audits a dispatcher supplied allowlisted route template, never client segments', async () => {
    const d = deps()
    const request = new Request('https://example.test/api/v1/produtos/customer-private-id?q=private-value')
    await withApiV1(() => Response.json({ ok: true }), { auditRoute: '/api/v1/produtos/:id', deps: d })(request)
    expect(d.audit.mock.calls[0][0].path).toBe('/api/v1/produtos/:id')
    expect(JSON.stringify(d.audit.mock.calls).includes('customer-private-id')).toBe(false)
  })
  it('audits unknown routes as a fixed marker even for authenticated requests', async () => {
    const d = deps()
    await withApiV1(() => new Response(null, { status: 404 }), { deps: d })(new Request('https://example.test/api/v1/unknown-private-segment'))
    expect(d.audit.mock.calls[0][0].path === '/api/v1/:unknown').toBe(true)
  })
  it('does not persist audit rows for unauthenticated requests', async () => {
    const d = deps(); d.activeDigests.lookup.mockResolvedValue({ state: 'inactive' }); d.authenticate.mockRejectedValue(new ApiAuthError())
    await withApiV1(vi.fn(), { auditRoute: '/api/v1/produtos/:id', deps: d })(new Request('https://example.test/api/v1/produtos/private-client-id'))
    expect(d.audit).not.toHaveBeenCalled()
  })
  it.each(['11987654321', '12345678909', 'CustomerPrivateName', '%2531%2531%2539'])('does not audit unformatted PII or encoding in request paths', async segment => {
    const d = deps(); d.activeDigests.lookup.mockResolvedValue({ state: 'inactive' }); d.authenticate.mockRejectedValue(new ApiAuthError())
    await withApiV1(vi.fn(), { deps: d })(new Request(`https://example.test/api/v1/${segment}`))
    expect(d.audit).not.toHaveBeenCalled()
  })
  it('rejects a concatenated credential in both request path and dispatcher template', async () => {
    const raw = `sxs_live_${randomBytes(32).toString('base64url')}`
    const d = deps()
    await withApiV1(() => new Response(null, { status: 404 }), { auditRoute: `/api/v1/prefix${raw}suffix`, deps: d })(new Request(`https://example.test/api/v1/prefix${raw}suffix`))
    expect(d.audit.mock.calls[0][0].path === '/api/v1/:unknown').toBe(true)
    expect(JSON.stringify(d.audit.mock.calls).includes(raw)).toBe(false)
  })
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
  it('adds no-store and request id without quota headers and awaits metadata writes', async () => {
    const d = deps()
    const response = await withApiV1(async () => Response.json({ data: [] }), { scope: 'read:catalogo', deps: d })(req())
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-request-id')).not.toBe('untrusted')
    expect(response.headers.get('x-ratelimit-limit')).toBeNull()
    expect(response.headers.get('x-ratelimit-remaining')).toBeNull()
    expect(response.headers.get('x-ratelimit-reset')).toBeNull()
    expect(d.reserveAuthFailure).not.toHaveBeenCalled()
    expect(d.audit).toHaveBeenCalledOnce()
    expect(d.lastUsed).toHaveBeenCalledWith(identity, '192.0.2.3')
    expect(JSON.stringify(d.audit.mock.calls).includes('private-person')).toBe(false)
    expect(JSON.stringify(d.audit.mock.calls).includes('private@example.test')).toBe(false)
  })
  it('counts an invalid credential against the IP quota and returns 401 without a database audit write', async () => {
    const d = deps(); d.activeDigests.lookup.mockResolvedValue({ state: 'inactive' }); d.authenticate.mockRejectedValue(new ApiAuthError())
    const res = await withApiV1(vi.fn(), { deps: d })(req())
    expect(res.status).toBe(401)
    expect(res.headers.get('www-authenticate')).toBe('Bearer')
    expect(d.reserveAuthFailure).toHaveBeenCalledWith('192.0.2.3')
    expect(d.audit).not.toHaveBeenCalled()
  })
  it('returns 429 on the 61st invalid credential while preserving the IP brute-force quota', async () => {
    const d = deps()
    let state: 'inactive' | 'quarantined' = 'inactive'
    d.authenticate.mockRejectedValue(new ApiAuthError())
    d.activeDigests.lookup.mockImplementation(async () => ({ state }))
    d.activeDigests.reject.mockImplementation(async () => { state = 'quarantined' })
    let failures = 0
    d.reserveAuthFailure.mockImplementation(async () => ({ success: ++failures <= 60, limit: 60, remaining: Math.max(0, 60 - failures), reset: Date.now() + 60_000 }))
    const handle = withApiV1(vi.fn(), { deps: d })

    const statuses: number[] = []
    for (let index = 0; index < 61; index += 1) statuses.push((await handle(req())).status)

    expect(statuses).toEqual([...Array(60).fill(401), 429])
    expect(d.authenticate).toHaveBeenCalledOnce()
    expect(d.reserveAuthFailure).toHaveBeenCalledTimes(61)
    expect(d.audit).not.toHaveBeenCalled()
  })
  it('returns 403 for independent scope without running the handler', async () => {
    const handler = vi.fn(); const d = deps()
    const res = await withApiV1(handler, { scope: 'read:pii', deps: d })(req())
    expect(res.status).toBe(403); expect(handler).not.toHaveBeenCalled()
  })
  it('never rate-limits an authenticated key after more than 60 valid requests', async () => {
    const d = deps()
    const handle = withApiV1(() => Response.json({ ok: true }), { deps: d })

    const statuses: number[] = []
    for (let index = 0; index < 61; index += 1) statuses.push((await handle(req())).status)

    expect(statuses).toEqual(Array(61).fill(200))
    expect(d.authenticate).not.toHaveBeenCalled()
    expect(d.reserveAuthFailure).not.toHaveBeenCalled()
    expect(d.refundAuthFailure).not.toHaveBeenCalled()
    expect(d.activeDigests.withDigestLock).not.toHaveBeenCalled()
  })
  it('rejects a quarantined digest before database authentication', async () => {
    const d = deps()
    d.activeDigests.lookup.mockResolvedValue({ state: 'quarantined' })
    d.reserveAuthFailure.mockResolvedValue({ success: false, limit: 60, remaining: 0, reset: Date.now() + 60_000 })
    const handle = withApiV1(() => Response.json({ ok: true }), { deps: d })

    expect((await handle(req())).status).toBe(429)
    expect(d.authenticate).not.toHaveBeenCalled()
    expect(d.activeDigests.withDigestLock).not.toHaveBeenCalled()
  })
  it('fails closed before authentication when the distributed digest store is unavailable', async () => {
    const d = deps()
    d.activeDigests.lookup.mockRejectedValue(new Error('redis unavailable'))
    const response = await withApiV1(() => Response.json({ ok: true }), { deps: d })(req())

    expect(response.status).toBe(503)
    expect(d.authenticate).not.toHaveBeenCalled()
  })
  it('bounds database authentication while holding an inactive-digest lock', async () => {
    vi.useFakeTimers()
    const d = deps()
    d.activeDigests.lookup.mockResolvedValue({ state: 'inactive' })
    d.authenticate.mockImplementation(() => new Promise(() => undefined))
    const result = withApiV1(() => Response.json({ ok: true }), { deps: d })(req())

    await vi.advanceTimersByTimeAsync(10_000)

    await expect(result).resolves.toMatchObject({ status: 503 })
    expect(d.refundAuthFailure).toHaveBeenCalledWith('192.0.2.3')
    vi.useRealTimers()
  })
  it('atomically reserves only sixty database authentication attempts during a parallel invalid burst', async () => {
    const d = deps()
    let fingerprint = 0
    d.fingerprint.mockImplementation(() => `unknown-${fingerprint++}`)
    d.activeDigests.lookup.mockResolvedValue({ state: 'inactive' })
    d.authenticate.mockRejectedValue(new ApiAuthError())
    let reservations = 0
    d.reserveAuthFailure.mockImplementation(async () => {
      const used = ++reservations
      return { success: used <= 60, limit: 60, remaining: Math.max(0, 60 - used), reset: Date.now() + 60_000 }
    })
    const handle = withApiV1(vi.fn(), { deps: d })

    const responses = await Promise.all(Array.from({ length: 80 }, () => handle(req())))

    expect(responses.filter(response => response.status === 401)).toHaveLength(60)
    expect(responses.filter(response => response.status === 429)).toHaveLength(20)
    expect(d.authenticate).toHaveBeenCalledTimes(60)
  })
  it('refunds the atomic reservation when an authoritative cache miss authenticates successfully', async () => {
    const d = deps()
    d.activeDigests.lookup.mockResolvedValue({ state: 'inactive' })
    const response = await withApiV1(() => Response.json({ ok: true }), { deps: d })(req())

    expect(response.status).toBe(200)
    expect(d.reserveAuthFailure).toHaveBeenCalledOnce()
    expect(d.refundAuthFailure).toHaveBeenCalledWith('192.0.2.3')
    expect(d.activeDigests.add).toHaveBeenCalledWith('trusted', identity)
  })
  it('never authenticates more than sixty times for one parallel invalid digest', async () => {
    const d = deps()
    let state: 'inactive' | 'quarantined' = 'inactive'
    let chain = Promise.resolve()
    d.activeDigests.lookup.mockImplementation(async () => ({ state }))
    d.activeDigests.reject.mockImplementation(async () => { state = 'quarantined' })
    d.activeDigests.withDigestLock.mockImplementation(async (_digest: string, work: () => Promise<unknown>) => {
      const previous = chain
      let release!: () => void
      chain = new Promise<void>(resolve => { release = resolve })
      await previous
      try { return await work() } finally { release() }
    })
    d.authenticate.mockRejectedValue(new ApiAuthError())
    let reservations = 0
    d.reserveAuthFailure.mockImplementation(async () => {
      const used = ++reservations
      return { success: used <= 60, limit: 60, remaining: Math.max(0, 60 - used), reset: Date.now() + 60_000 }
    })
    const handle = withApiV1(vi.fn(), { deps: d })

    const responses = await Promise.all(Array.from({ length: 80 }, () => handle(req())))

    expect(responses.filter(response => response.status === 401)).toHaveLength(60)
    expect(responses.filter(response => response.status === 429)).toHaveLength(20)
    expect(d.authenticate).toHaveBeenCalledOnce()
  })
  it('serves parallel valid requests without a digest mutex, database authentication or quota reservation', async () => {
    const d = deps()
    d.activeDigests.withDigestLock.mockRejectedValue(new Error('must not lock active identity'))
    const handle = withApiV1(() => Response.json({ ok: true }), { deps: d })

    const responses = await Promise.all(Array.from({ length: 80 }, () => handle(req())))

    expect(responses.every(response => response.status === 200)).toBe(true)
    expect(d.authenticate).not.toHaveBeenCalled()
    expect(d.reserveAuthFailure).not.toHaveBeenCalled()
    expect(d.activeDigests.withDigestLock).not.toHaveBeenCalled()
  })
  it('discovers one valid cache miss before reserving quota for parallel followers', async () => {
    const d = deps()
    let state: 'inactive' | 'active' = 'inactive'
    let chain = Promise.resolve()
    d.activeDigests.lookup.mockImplementation(async () => state === 'active' ? { state, identity } : { state })
    d.activeDigests.add.mockImplementation(async () => { state = 'active' })
    d.activeDigests.withDigestLock.mockImplementation(async (_digest: string, work: () => Promise<unknown>) => {
      const previous = chain
      let release!: () => void
      chain = new Promise<void>(resolve => { release = resolve })
      await previous
      try { return await work() } finally { release() }
    })
    const handle = withApiV1(() => Response.json({ ok: true }), { deps: d })

    const responses = await Promise.all(Array.from({ length: 80 }, () => handle(req())))

    expect(responses.every(response => response.status === 200)).toBe(true)
    expect(d.authenticate).toHaveBeenCalledOnce()
    expect(d.reserveAuthFailure).toHaveBeenCalledOnce()
    expect(d.refundAuthFailure).toHaveBeenCalledOnce()
  })
  it('metadata failure never changes response or logs payload', async () => {
    const d = deps(); d.audit.mockRejectedValue(new Error('private')); d.lastUsed.mockRejectedValue(new Error('private'))
    expect((await withApiV1(async () => Response.json({ ok: true }), { deps: d })(req())).status).toBe(200)
  })
})

describe('audit metadata boundaries', () => {
  it.each(['/api/v1/produtos/client-private-id', '/api/v1/11987654321', '/api/v1/12345678909', '/api/v1/%2531%2531', '/api/v1/fake-resource/:id'])('rejects arbitrary paths when called directly', async path => {
    const create = vi.fn().mockResolvedValue({})
    await auditRequest({ identity, requestId: 'request-id', path, queryKeys: ['q'], status: 200, durationMs: 1, ip: 'unknown' }, { prisma: { apiAuditoriaLeitura: { create } } })
    expect(create.mock.calls[0][0].data.rota === '/api/v1/:unknown').toBe(true)
  })
  it('accepts only a known canonical template in direct audit calls', async () => {
    const create = vi.fn().mockResolvedValue({})
    await auditRequest({ identity, requestId: 'request-id', path: '/api/v1/produtos/:id', queryKeys: ['q'], status: 200, durationMs: 1, ip: 'unknown' }, { prisma: { apiAuditoriaLeitura: { create } } })
    expect(create.mock.calls[0][0].data.rota).toBe('/api/v1/produtos/:id')
  })
  it('never persists raw/encoded credentials embedded in paths or query key names', async () => {
    const raw = `sxs_live_${randomBytes(32).toString('base64url')}`
    const create = vi.fn().mockResolvedValue({})
    const encoded = raw.replaceAll('_', '%255F')
    await auditRequest({ identity, requestId: 'request-id', path: `/api/v1/${encoded}`, queryKeys: [raw, 'q'], status: 404, durationMs: 1, ip: 'unknown' }, { prisma: { apiAuditoriaLeitura: { create } } })
    const data = JSON.stringify(create.mock.calls)
    expect(data.includes(raw)).toBe(false)
    expect(data.includes(encoded)).toBe(false)
    expect(create.mock.calls[0][0].data.rota === '/api/v1/:unknown').toBe(true)
    expect(create.mock.calls[0][0].data.queryKeys).toEqual(['q'])
  })
  it('persists explicit query keys only and safe bounded IP', async () => {
    const create = vi.fn().mockResolvedValue({}); const prisma = { apiAuditoriaLeitura: { create } }
    await auditRequest({ identity, requestId: 'request-id', path: '/api/v1/produtos', queryKeys: ['q', 'email', 'token'], status: 200, durationMs: 4, ip: '192.0.2.3' }, { prisma })
    expect(create.mock.calls[0][0].data).toMatchObject({ chaveId: identity.id, queryKeys: ['email', 'q'], ip: '192.0.2.3' })
    expect(safeClientIp(new Request('https://example.test', { headers: { 'x-forwarded-for': 'not an ip' } }))).toBe('unknown')
  })
  it('uses only the Railway-overwritten forwarded chain for rate-limit identity', () => {
    const request = new Request('https://example.test', { headers: {
      'cf-connecting-ip': '192.0.2.10',
      'x-real-ip': '192.0.2.11',
      'x-forwarded-for': '198.51.100.99, 192.0.2.12',
    } })
    expect(safeClientIp(request)).toBe('198.51.100.99')
    expect(safeClientIp(new Request('https://example.test', { headers: {
      'x-real-ip': '192.0.2.11',
    } }))).toBe('unknown')
  })
  it('updates lastUsed/IP by id with no raw request or hash', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    await recordLastUsed(identity, 'malicious-ip', { prisma: { apiChaveLeitura: { updateMany } } })
    expect(updateMany.mock.calls[0][0].where).toEqual({ id: 'key-id', revogadoEm: null })
    expect(updateMany.mock.calls[0][0].data.ultimoIp).toBeNull()
  })
})

describe('API limiter production fail-closed', () => {
  it('fails closed on the resolved Upstash timeout shape for an invalid credential', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fixture')
    provider.limit.mockResolvedValue({ success: true, limit: 0, remaining: 0, reset: 0, pending: Promise.resolve(), reason: 'timeout' })
    const handler = vi.fn(() => Response.json({ ok: true })); const d = deps()
    d.authenticate.mockRejectedValue(new ApiAuthError())
    d.activeDigests.lookup.mockResolvedValue({ state: 'inactive' })
    const response = await withApiV1(handler, { deps: { ...d, reserveAuthFailure: rateLimitApiIngress } })(req())
    expect(response.status).toBe(503)
    expect(handler).not.toHaveBeenCalled()
  })
  it('uses the actual shared Upstash ingress adapter and propagates provider failures as 503', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fixture')
    provider.limit.mockResolvedValueOnce({ success: true, remaining: 599, reset: 60_000 })
    expect((await rateLimitApiIngress('192.0.2.3')).limit).toBe(60)
    expect(provider.slidingWindow).toHaveBeenCalledWith(60, '1 m')
    expect(provider.construct.mock.calls[0][0]).toMatchObject({ prefix: 'rl:api-leitura-ingress:60', analytics: false, timeout: 5000 })
    expect(provider.limit).toHaveBeenCalledWith('192.0.2.3')
    provider.limit.mockRejectedValueOnce(new Error('provider-private-detail'))
    await expect(rateLimitApiIngress('192.0.2.3')).rejects.toMatchObject({ status: 503 })
  })
  it('refunds a reserved ingress token with the shared atomic adapter', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fixture')
    provider.limit.mockResolvedValueOnce({ success: true, remaining: 60, reset: 60_000 })

    await expect(refundApiIngress('192.0.2.3')).resolves.toBeUndefined()
    expect(provider.limit).toHaveBeenLastCalledWith('192.0.2.3', { rate: -1 })
  })
  it.each(['0', '-1', '1.5', 'NaN', '0x10', ''])('fails closed for invalid configured limit', async value => {
    await expect(rateLimitApiIngress('192.0.2.3', { env: { NODE_ENV: 'production', API_V1_INGRESS_RATE_LIMIT_PER_MINUTE: value } })).rejects.toMatchObject({ status: 503 })
  })
  it('returns unavailable when Upstash is absent in production', async () => {
    await expect(rateLimitApiIngress('192.0.2.3', { env: { NODE_ENV: 'production' } })).rejects.toMatchObject({ status: 503 })
  })
  it('returns unavailable on provider failure in production', async () => {
    await expect(rateLimitApiIngress('192.0.2.3', { env: { NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'fixture' }, limit: vi.fn().mockRejectedValue(new Error('provider')) })).rejects.toMatchObject({ status: 503 })
  })
  it('uses a separate strict ingress namespace and bounded IP quota', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true, remaining: 59, reset: 60_000 })
    const res = await rateLimitApiIngress('192.0.2.3', { env: { NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'fixture' }, limit })
    expect(res.limit).toBe(60)
    expect(limit).toHaveBeenCalledWith('api-leitura-ingress', '192.0.2.3', 60, '1 m')
  })
  it('isolates public-route traffic from the pre-auth ingress quota', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true, remaining: 59, reset: 60_000 })
    await rateLimitApiPublic('192.0.2.3', { env: { NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'fixture' }, limit })
    expect(limit).toHaveBeenCalledWith('api-leitura-public', '192.0.2.3', 60, '1 m')
  })
})
