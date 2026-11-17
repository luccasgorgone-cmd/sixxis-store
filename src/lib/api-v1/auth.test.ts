import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { authenticateBearer, hasScope, hashApiKey } from './auth'

const raw = `sxs_live_${randomBytes(32).toString('base64url')}`
const digest = createHash('sha256').update(raw).digest('hex')
const row = (extra = {}) => ({ id: 'test-key', nome: 'Fixture', prefixo: raw.slice(0, 20), hash: digest, escopos: ['read:all'], expiraEm: null, revogadoEm: null, ...extra })
const request = (key?: string) => new Request('https://example.test/api/v1/produtos', { headers: key ? { authorization: key } : {} })
const deps = (rows: ReturnType<typeof row>[]) => ({ prisma: { apiChaveLeitura: { findMany: vi.fn().mockResolvedValue(rows) } } })

describe('API bearer authentication', () => {
  it.each([undefined, 'Basic invalid', 'Bearer nope', `Bearer ${raw} extra`])('rejects absent or malformed credential without exposing it', async value => {
    await expect(authenticateBearer(request(value), deps([]))).rejects.toMatchObject({ status: 401 })
  })
  it('hashes to exactly 32 SHA-256 bytes', () => {
    expect(hashApiKey(raw).length).toBe(32)
    expect(hashApiKey(raw).equals(Buffer.from(digest, 'hex'))).toBe(true)
  })
  it('uses dummy fixed-length timing-safe comparison on prefix miss', async () => {
    const compare = vi.fn(timingSafeEqual)
    await expect(authenticateBearer(request(`Bearer ${raw}`), { ...deps([]), compare })).rejects.toMatchObject({ status: 401 })
    expect(compare).toHaveBeenCalledOnce()
    expect(compare.mock.calls[0].every(b => b.byteLength === 32)).toBe(true)
  })
  it('supports prefix collisions and compares all candidates', async () => {
    const compare = vi.fn(timingSafeEqual)
    const d = deps([row({ hash: '00'.repeat(32), id: 'other' }), row()])
    const identity = await authenticateBearer(request(`Bearer ${raw}`), { ...d, compare })
    expect(identity.id).toBe('test-key')
    expect(compare).toHaveBeenCalledTimes(2)
    expect(d.prisma.apiChaveLeitura.findMany.mock.calls[0][0].where).toEqual({ prefixo: raw.slice(0, 20) })
    expect('hash' in identity).toBe(false)
  })
  it('treats luccas-programa-externo with expiraEm null as valid until explicit revocation', async () => {
    const permanent = row({ nome: 'luccas-programa-externo', expiraEm: null })
    const identity = await authenticateBearer(request(`Bearer ${raw}`), { ...deps([permanent]), now: () => new Date('2126-01-01T00:00:00.000Z') })

    expect(identity).toMatchObject({ nome: 'luccas-programa-externo', expiraEm: null })
    await expect(authenticateBearer(request(`Bearer ${raw}`), deps([{ ...permanent, revogadoEm: new Date('2026-11-17T00:00:00.000Z') }]))).rejects.toMatchObject({ status: 401 })
  })
  it.each([{ hash: 'not-hex' }, { hash: 'a'.repeat(63) }, { revogadoEm: new Date() }, { expiraEm: new Date(0) }, { escopos: ['read:unknown'] }, { escopos: 'read:all' }])('fails closed for invalid database state', async extra => {
    const compare = vi.fn(timingSafeEqual)
    await expect(authenticateBearer(request(`Bearer ${raw}`), { ...deps([row(extra)]), compare })).rejects.toMatchObject({ status: 401 })
    expect(compare.mock.calls.every(args => args.every(b => b.byteLength === 32))).toBe(true)
  })
  it('read:all grants domains but never independent PII/message permissions', async () => {
    const identity = await authenticateBearer(request(`Bearer ${raw}`), deps([row()]))
    expect(hasScope(identity, 'read:pedidos')).toBe(true)
    expect(hasScope(identity, 'read:pii')).toBe(false)
    expect(hasScope(identity, 'read:mensagens')).toBe(false)
  })
})
