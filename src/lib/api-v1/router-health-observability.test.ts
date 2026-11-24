import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  reconcile: vi.fn(),
  ensure: vi.fn(),
}))

vi.mock('../prisma', () => ({ prisma: { $queryRaw: mocks.queryRaw } }))
vi.mock('./active-digest-sync', () => ({
  reconcileActiveApiKeyDigests: mocks.reconcile,
  ensureActiveApiKeyDigests: mocks.ensure,
}))

import { routeApiV1 } from './router'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.queryRaw.mockResolvedValue([{ ok: 1 }])
  mocks.reconcile.mockResolvedValue(undefined)
})

describe('GET /api/v1/health default liveness', () => {
  it('checks MySQL without reconciling the Redis allowlist', async () => {
    const response = await routeApiV1(
      new Request('https://example.test/api/v1/health'),
      ['health'],
      {
        publicRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 }),
        env: { RAILWAY_GIT_COMMIT_SHA: 'fixture' },
        now: () => new Date('2026-11-17T12:00:00.000Z'),
      },
    )

    expect(response.status).toBe(200)
    expect(mocks.queryRaw).toHaveBeenCalledOnce()
    expect(mocks.reconcile).not.toHaveBeenCalled()
    expect(mocks.ensure).not.toHaveBeenCalled()
  })
})
