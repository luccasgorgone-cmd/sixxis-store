import { describe, expect, it, vi } from 'vitest'
import { createActiveDigestStore } from './active-digests'
import type { ApiIdentity } from './types'

const identity = (id: string, expiraEm: Date | null = null): ApiIdentity => ({ id, nome: `Key ${id}`, prefixo: `prefix-${id}`, scopes: new Set(['read:all']), expiraEm })

function redisFixture() {
  const hashes = new Map<string, Map<string, string>>()
  const strings = new Map<string, string>()
  return {
    hashes,
    redis: {
      hget: vi.fn(async (key: string, field: string) => hashes.get(key)?.get(field) ?? null),
      hset: vi.fn(async (key: string, values: Record<string, string>) => {
        const hash = hashes.get(key) ?? new Map<string, string>()
        for (const [field, value] of Object.entries(values)) hash.set(field, value)
        hashes.set(key, hash)
        return Object.keys(values).length
      }),
      expire: vi.fn(async () => 1),
      del: vi.fn(async (key: string) => Number(hashes.delete(key))),
      set: vi.fn(async (key: string, value: string, options: { nx: true; px: number } | { px: number }) => {
        if ('nx' in options && strings.has(key)) return null
        strings.set(key, value)
        return 'OK'
      }),
      eval: vi.fn(async (script: string, keys: string[], args: unknown[]) => {
        if (script.includes('LOOKUP_DIGEST')) {
          if (hashes.get(keys[1])?.get(String(args[0]))) return ['quarantined']
          if (strings.get(keys[2])) return ['quarantined']
          const value = hashes.get(keys[0])?.get(String(args[0]))
          if (value !== undefined) return ['active', value]
          return hashes.get(keys[0])?.get('__initialized__') ? ['inactive'] : ['uninitialized']
        }
        if (script.includes('MUTATE_DIGEST')) {
          const hash = hashes.get(keys[0]) ?? new Map<string, string>()
          const version = Number(hash.get('__version__') ?? 0) + 1
          hash.set('__version__', String(version)); hash.set(String(args[0]), String(args[1]))
          hashes.set(keys[0], hash)
          return version
        }
        if (script.includes('QUARANTINE_DIGEST')) {
          const hash = hashes.get(keys[0]) ?? new Map<string, string>()
          const version = Number(hash.get('__version__') ?? 0) + 1
          hash.set('__version__', String(version))
          hashes.set(keys[0], hash)
          const quarantine = hashes.get(keys[1]) ?? new Map<string, string>()
          quarantine.set(String(args[0]), '1'); hashes.set(keys[1], quarantine)
          return version
        }
        if (script.includes('PUBLISH_SNAPSHOT')) {
          const current = Number(hashes.get(keys[0])?.get('__version__') ?? 0)
          if (current !== Number(args[0])) { hashes.delete(keys[1]); return 0 }
          hashes.set(keys[0], hashes.get(keys[1]) ?? new Map()); hashes.delete(keys[1])
          return 1
        }
        if (strings.get(keys[0]) !== String(args[0])) return 0
        strings.delete(keys[0])
        return 1
      }),
    },
  }
}

describe('distributed active API digest store', () => {
  it('distinguishes uninitialized, active, missing and quarantined identities', async () => {
    const fixture = redisFixture()
    const store = createActiveDigestStore({ redis: fixture.redis, now: () => 1_000 })
    await expect(store.lookup('missing')).resolves.toEqual({ state: 'uninitialized' })
    await store.add('non-expiring', identity('permanent'))
    await store.add('future', identity('future', new Date(2_000)))
    await store.add('expired', identity('expired', new Date(999)))

    await expect(store.lookup('non-expiring')).resolves.toMatchObject({ state: 'active', identity: { id: 'permanent' } })
    await expect(store.lookup('future')).resolves.toMatchObject({ state: 'active', identity: { id: 'future' } })
    await expect(store.lookup('expired')).resolves.toEqual({ state: 'quarantined' })
    await expect(store.lookup('missing')).resolves.toEqual({ state: 'uninitialized' })
    await store.replaceFrom(async () => new Map([
      ['non-expiring', identity('permanent')],
      ['future', identity('future', new Date(2_000))],
      ['expired', identity('expired', new Date(999))],
    ]))
    await expect(store.lookup('missing')).resolves.toEqual({ state: 'inactive' })
  })

  it('publishes a versioned snapshot and quarantines a revoked digest', async () => {
    const fixture = redisFixture()
    const store = createActiveDigestStore({ redis: fixture.redis, now: () => 1_000, randomId: () => 'replacement' })
    await store.add('old', identity('old'))
    await store.replaceFrom(async () => new Map([['current', identity('current')], ['future', identity('future', new Date(2_000))]]))

    await expect(store.lookup('old')).resolves.toEqual({ state: 'inactive' })
    await expect(store.lookup('current')).resolves.toMatchObject({ state: 'active', identity: { id: 'current' } })
    await store.remove('current')
    await expect(store.lookup('current')).resolves.toEqual({ state: 'quarantined' })
    await store.add('current', identity('late-active-write'))
    await store.replaceFrom(async () => new Map([['current', identity('stale-snapshot')]]))
    await expect(store.lookup('current')).resolves.toEqual({ state: 'quarantined' })
  })

  it('performs parallel active lookups without acquiring the digest mutex', async () => {
    const fixture = redisFixture()
    const store = createActiveDigestStore({ redis: fixture.redis })
    await store.add('active', identity('parallel'))

    const states = await Promise.all(Array.from({ length: 80 }, () => store.lookup('active')))

    expect(states.every(state => state.state === 'active')).toBe(true)
    expect(fixture.redis.set).not.toHaveBeenCalled()
  })

  it('temporarily rejects a verified invalid digest without changing snapshot completeness', async () => {
    const fixture = redisFixture()
    const store = createActiveDigestStore({ redis: fixture.redis })

    await store.reject('invalid')

    await expect(store.lookup('invalid')).resolves.toEqual({ state: 'quarantined' })
    await expect(store.lookup('other')).resolves.toEqual({ state: 'uninitialized' })
    expect(fixture.redis.set).toHaveBeenCalledWith(expect.stringContaining(':rejected:invalid'), '1', { px: 60_000 })
  })

  it('retries a snapshot CAS instead of overwriting concurrent key creation', async () => {
    const fixture = redisFixture()
    const store = createActiveDigestStore({ redis: fixture.redis, randomId: () => 'replacement' })
    let release!: () => void
    let loads = 0
    const load = vi.fn(() => {
      loads += 1
      if (loads > 1) return Promise.resolve(new Map([['created-during-reconciliation', identity('created')]]))
      return new Promise<ReadonlyMap<string, ApiIdentity>>(resolve => { release = () => resolve(new Map()) })
    })

    const replacement = store.replaceFrom(load)
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce())
    await store.add('created-during-reconciliation', identity('created'))
    release()
    await replacement

    expect(load).toHaveBeenCalledTimes(2)
    await expect(store.lookup('created-during-reconciliation')).resolves.toMatchObject({ state: 'active', identity: { id: 'created' } })
  })

  it('fails closed within a bounded time when Redis stalls', async () => {
    vi.useFakeTimers()
    const fixture = redisFixture()
    fixture.redis.eval.mockImplementation(() => new Promise(() => undefined))
    const store = createActiveDigestStore({ redis: fixture.redis, timeoutMs: 5_000 })
    const result = store.lookup('digest')
    const rejection = expect(result).rejects.toThrow('Active digest store unavailable')
    await vi.advanceTimersByTimeAsync(5_000)
    await rejection
    vi.useRealTimers()
  })

  it('ends digest work before a lease with double the global work deadline', async () => {
    vi.useFakeTimers()
    const fixture = redisFixture()
    const store = createActiveDigestStore({ redis: fixture.redis })
    const result = store.withDigestLock('digest', () => new Promise(() => undefined))
    const rejection = expect(result).rejects.toThrow('Active digest store unavailable')

    await vi.advanceTimersByTimeAsync(25_000)

    await rejection
    expect(fixture.redis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), { nx: true, px: 60_000 })
    vi.useRealTimers()
  })

  it('bounds a late lock acquisition by the remaining global deadline', async () => {
    vi.useFakeTimers()
    const fixture = redisFixture()
    let current = 0
    fixture.redis.set
      .mockResolvedValueOnce(null)
      .mockImplementationOnce(() => new Promise(() => undefined))
    const store = createActiveDigestStore({
      redis: fixture.redis,
      now: () => current,
      wait: async () => { current = 24_999 },
    })
    const result = store.withDigestLock('digest', async () => undefined)
    const rejection = expect(result).rejects.toThrow('Active digest store unavailable')

    await vi.advanceTimersByTimeAsync(1)

    await rejection
    vi.useRealTimers()
  })
})
