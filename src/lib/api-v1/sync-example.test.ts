import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncResource } from '../../../docs/api-v1/exemplo-sync'

type SyncContract = {
  slug: string
  sort: string
  watermarkField: string
  from: string
  to: string
  maxDays: number | null
  maxLimit: number
}

afterEach(() => vi.unstubAllGlobals())

describe('generated synchronization helper', () => {
  it('uses the resource clock, finite window and advertised maximum page size', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: '1', createdAt: '2026-11-16T10:00:00.000Z' }], meta: { hasMore: true, nextCursor: 'opaque' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: '2', createdAt: '2026-11-16T11:00:00.000Z' }], meta: { hasMore: false, nextCursor: null } })))
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: 31, maxLimit: 500 }
    const run = syncResource as unknown as (baseUrl: string, token: string, contract: SyncContract, window: { from: string; to: string }) => Promise<{ rows: unknown[]; watermark?: string }>
    const result = await run('https://example.test', 'token', contract, { from: '2026-11-16T00:00:00.000Z', to: '2026-11-16T23:59:59.999Z' })

    const first = new URL(fetch.mock.calls[0][0] as URL)
    const second = new URL(fetch.mock.calls[1][0] as URL)
    expect(first.pathname).toBe('/api/v1/eventos-tracking')
    expect(Object.fromEntries(first.searchParams)).toEqual({ limit: '500', sort: 'createdAt', criadoDesde: '2026-11-16T00:00:00.000Z', criadoAte: '2026-11-16T23:59:59.999Z' })
    expect(second.searchParams.get('cursor')).toBe('opaque')
    expect(result).toEqual({ rows: [{ id: '1', createdAt: '2026-11-16T10:00:00.000Z' }, { id: '2', createdAt: '2026-11-16T11:00:00.000Z' }], watermark: '2026-11-16T11:00:00.000Z' })
  })

  it('rejects a window larger than the resource maximum before fetching', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: 1, maxLimit: 500 }
    const run = syncResource as unknown as (baseUrl: string, token: string, contract: SyncContract, window: { from: string; to: string }) => Promise<unknown>
    await expect(run('https://example.test', 'token', contract, { from: '2026-11-15T00:00:00.000Z', to: '2026-11-17T00:00:00.000Z' })).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})
