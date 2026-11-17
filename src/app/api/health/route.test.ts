import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  reconcile: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: mocks.queryRaw } }))
vi.mock('@/lib/api-v1/active-digest-sync', () => ({ reconcileActiveApiKeyDigests: mocks.reconcile }))

import { GET } from './route'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.queryRaw.mockResolvedValue([{ ok: 1 }])
  mocks.reconcile.mockResolvedValue(undefined)
})

describe('GET /api/health', () => {
  it('observes database liveness without mutating the Redis allowlist', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(mocks.queryRaw).toHaveBeenCalledOnce()
    expect(mocks.reconcile).not.toHaveBeenCalled()
  })
})
