import { afterEach, describe, expect, it, vi } from 'vitest'
import { runCli, syncResource } from '../../../docs/api-v1/sync-exemplo'

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
  it('uses the resource clock, chronological window and advertised maximum page size', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: '1', createdAt: '2026-11-16T10:00:00.000Z' }], meta: { hasMore: true, nextCursor: 'opaque' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: '2', createdAt: '2026-11-16T11:00:00.000Z' }], meta: { hasMore: false, nextCursor: null } })))
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: null, maxLimit: 500 }
    const run = syncResource as unknown as (baseUrl: string, token: string, contract: SyncContract, window: { from: string; to: string }) => Promise<{ rows: unknown[]; watermark?: string }>
    const result = await run('https://example.test', 'token', contract, { from: '2026-11-16T00:00:00.000Z', to: '2026-11-16T23:59:59.999Z' })

    const first = new URL(fetch.mock.calls[0][0] as URL)
    const second = new URL(fetch.mock.calls[1][0] as URL)
    expect(first.pathname).toBe('/api/v1/eventos-tracking')
    expect(Object.fromEntries(first.searchParams)).toEqual({ limit: '500', sort: 'createdAt', criadoDesde: '2026-11-16T00:00:00.000Z', criadoAte: '2026-11-16T23:59:59.999Z' })
    expect(second.searchParams.get('cursor')).toBe('opaque')
    expect(result).toEqual({ rows: [{ id: '1', createdAt: '2026-11-16T10:00:00.000Z' }, { id: '2', createdAt: '2026-11-16T11:00:00.000Z' }], watermark: '2026-11-16T11:00:00.000Z' })
  })

  it('accepts a valid ISO window longer than 366 days', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], meta: { hasMore: false, nextCursor: null } })))
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: null, maxLimit: 500 }
    const run = syncResource as unknown as (baseUrl: string, token: string, contract: SyncContract, window: { from: string; to: string }) => Promise<unknown>
    await expect(run('https://example.test', 'token', contract, { from: '2024-01-01T00:00:00.000Z', to: '2026-11-17T00:00:00.000Z' })).resolves.toBeDefined()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it.each([
    ['date-only', '2026-11-16', '2026-11-17T00:00:00.000Z'],
    ['timezone ausente', '2026-11-16T00:00:00.000', '2026-11-17T00:00:00.000Z'],
    ['data impossível', '2026-02-30T00:00:00.000Z', '2026-03-03T00:00:00.000Z'],
  ])('rejects %s before the first authenticated fetch', async (_name, from, to) => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: null, maxLimit: 500 }

    await expect(syncResource('https://example.test', 'token', contract as never, { from, to })).rejects.toThrow('Janela de sincronização inválida.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('accepts explicit numeric timezone offsets', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], meta: { hasMore: false, nextCursor: null } })))
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: null, maxLimit: 500 }

    await expect(syncResource('https://example.test', 'token', contract as never, { from: '2024-01-01T00:00:00.000-03:00', to: '2026-11-17T00:00:00.000+00:00' })).resolves.toBeDefined()
  })

  it.each([
    ['sem data', { meta: { hasMore: false, nextCursor: null } }],
    ['sem meta', { data: [] }],
    ['meta inválida', { data: [], meta: { hasMore: 'false', nextCursor: null } }],
  ])('rejects an invalid page envelope: %s', async (_name, payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))))
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: null, maxLimit: 500 }

    await expect(syncResource('https://example.test', 'token', contract as never, { from: '2026-11-16T00:00:00.000Z', to: '2026-11-17T00:00:00.000Z' })).rejects.toThrow('Envelope de paginação inválido.')
  })

  it('rejects hasMore=true without a non-empty nextCursor', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: '1', createdAt: '2026-11-16T10:00:00.000Z' }], meta: { hasMore: true, nextCursor: null } })))
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: null, maxLimit: 500 }

    await expect(syncResource('https://example.test', 'token', contract as never, { from: '2026-11-16T00:00:00.000Z', to: '2026-11-17T00:00:00.000Z' })).rejects.toThrow('Envelope de paginação inválido.')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('rejects a repeated pagination cursor', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [], meta: { hasMore: true, nextCursor: 'same' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [], meta: { hasMore: true, nextCursor: 'same' } })))
    vi.stubGlobal('fetch', fetch)
    const contract: SyncContract = { slug: 'eventos-tracking', sort: 'createdAt', watermarkField: 'createdAt', from: 'criadoDesde', to: 'criadoAte', maxDays: null, maxLimit: 500 }

    await expect(syncResource('https://example.test', 'token', contract as never, { from: '2026-11-16T00:00:00.000Z', to: '2026-11-17T00:00:00.000Z' })).rejects.toThrow('Cursor de paginação repetido.')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('loads the selected resource contract and prints only count and watermark', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ slug: 'produtos', sync: { sort: 'updatedAt', watermarkField: 'updatedAt', from: 'atualizadoDesde', to: 'atualizadoAte', maxDays: null, maxLimit: 500 } }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: '1', updatedAt: '2026-11-16T10:00:00.000Z' }], meta: { hasMore: false, nextCursor: null } })))
    vi.stubGlobal('fetch', fetch)
    const output: string[] = []

    await runCli(['produtos', '2026-11-16T00:00:00.000Z', '2026-11-16T23:59:59.999Z'], { SIXXIS_API_TOKEN: 'token' }, value => output.push(value))

    expect(new URL(fetch.mock.calls[0][0] as URL).pathname).toBe('/api/v1/meta/recursos')
    expect(new URL(fetch.mock.calls[1][0] as URL).pathname).toBe('/api/v1/produtos')
    expect(fetch.mock.calls[0][1]).toEqual({ headers: { Authorization: 'Bearer token' } })
    expect(output).toEqual(['{"count":1,"watermark":"2026-11-16T10:00:00.000Z"}'])
  })

  it('requires the token from the environment before fetching', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(runCli(['produtos', '2026-11-16T00:00:00.000Z', '2026-11-16T23:59:59.999Z'], {}, vi.fn())).rejects.toThrow('SIXXIS_API_TOKEN')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('never sends the token to an environment-controlled origin', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ slug: 'produtos', sync: { sort: 'updatedAt', watermarkField: 'updatedAt', from: 'atualizadoDesde', to: 'atualizadoAte', maxDays: null, maxLimit: 500 } }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [], meta: { hasMore: false, nextCursor: null } })))
    vi.stubGlobal('fetch', fetch)

    await runCli(['produtos', '2026-11-16T00:00:00.000Z', '2026-11-16T23:59:59.999Z'], { SIXXIS_API_TOKEN: 'token', SIXXIS_API_BASE_URL: 'https://attacker.example' }, vi.fn())

    expect(new URL(fetch.mock.calls[0][0] as URL).origin).toBe('https://www.sixxis.com.br')
    expect(new URL(fetch.mock.calls[1][0] as URL).origin).toBe('https://www.sixxis.com.br')
  })
})
