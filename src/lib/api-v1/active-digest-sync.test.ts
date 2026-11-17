import { describe, expect, it, vi } from 'vitest'
import { reconcileActiveApiKeyDigests } from './active-digest-sync'
import type { ApiIdentity } from './types'

describe('active API digest reconciliation', () => {
  it('loads the database snapshot through versioned replacement', async () => {
    const expires = new Date('2026-12-01T00:00:00.000Z')
    const findMany = vi.fn().mockResolvedValue([{ id: 'key-id', nome: 'Fixture', prefixo: 'safe', hash: 'a'.repeat(64), escopos: ['read:all'], expiraEm: expires }])
    const replaceFrom = vi.fn(async (load: () => Promise<ReadonlyMap<string, ApiIdentity>>) => {
      await expect(load()).resolves.toEqual(new Map([['a'.repeat(64), { id: 'key-id', nome: 'Fixture', prefixo: 'safe', scopes: new Set(['read:all']), expiraEm: expires }]]))
    })

    await reconcileActiveApiKeyDigests({ apiChaveLeitura: { findMany } } as never, { replaceFrom })

    expect(replaceFrom).toHaveBeenCalledOnce()
  })

  it('bounds a stalled database snapshot query at ten seconds', async () => {
    vi.useFakeTimers()
    const findMany = vi.fn(() => new Promise(() => undefined))
    const replaceFrom = vi.fn(async (load: () => Promise<ReadonlyMap<string, ApiIdentity>>) => { await load() })
    const result = reconcileActiveApiKeyDigests({ apiChaveLeitura: { findMany } } as never, { replaceFrom })
    const rejection = expect(result).rejects.toMatchObject({ status: 503 })

    await vi.advanceTimersByTimeAsync(10_000)
    await rejection
    vi.useRealTimers()
  })
})
