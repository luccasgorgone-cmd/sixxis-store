import { mkdtemp, readFile, stat, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { runApiKeyCli } from '../../../scripts/api-chave'

const fixture = () => {
  const write = vi.fn(); const create = vi.fn().mockResolvedValue({ id: 'key-id' })
  const prisma = { apiChaveLeitura: { create, findMany: vi.fn().mockResolvedValue([{ id: 'key-id', nome: 'Test', prefixo: 'safe-prefix', hash: 'must-not-list', raw: 'must-not-list', escopos: ['read:all'], criadoEm: new Date(0), expiraEm: null, revogadoEm: null, ultimoUsoEm: null, ultimoIp: null }]), updateMany: vi.fn().mockResolvedValue({ count: 1 }) } }
  return { write, prisma }
}

describe('API key CLI without real database', () => {
  it('requires an exclusive output file before persisting a new key', async () => {
    const d = fixture()
    await expect(runApiKeyCli(['criar', '--nome', 'Fixture', '--escopos', 'read:all,read:pii'], d)).rejects.toThrow()
    expect(d.prisma.apiChaveLeitura.create).not.toHaveBeenCalled()
    expect(d.write).not.toHaveBeenCalled()
  })
  it('writes valid entropy exclusively to a new 0600 file and persists only its hash', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'api-key-test-')); const path = join(dir, 'key')
    try {
      const d = fixture(); await runApiKeyCli(['criar', '--nome', 'Fixture', '--escopos', 'read:all', '--output', path], d)
      expect((await stat(path)).mode & 0o777).toBe(0o600)
      const raw = await readFile(path, 'utf8')
      expect(/^sxs_live_[A-Za-z0-9_-]{43}\n$/.test(raw)).toBe(true)
      const data = d.prisma.apiChaveLeitura.create.mock.calls[0][0].data
      expect(data.hash.length).toBe(64)
      expect(JSON.stringify(data).includes(raw.trim())).toBe(false)
      expect(d.write.mock.calls.some(args => String(args[0]).includes('sxs_live_'))).toBe(false)
      await expect(runApiKeyCli(['criar', '--nome', 'Fixture', '--escopos', 'read:all', '--output', path], d)).rejects.toThrow()
      expect(d.prisma.apiChaveLeitura.create).toHaveBeenCalledOnce()
    } finally { await rm(dir, { recursive: true, force: true }) }
  })
  it('does not persist a key until its one-time output is durably written', async () => {
    const d = fixture()
    const output = {
      chmod: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockRejectedValue(new Error('disk full')),
      sync: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    await expect(runApiKeyCli(
      ['criar', '--nome', 'Fixture', '--escopos', 'read:all', '--output', '/unused/key'],
      { ...d, openOutput: vi.fn().mockResolvedValue(output) } as never,
    )).rejects.toThrow()
    expect(d.prisma.apiChaveLeitura.create).not.toHaveBeenCalled()
    expect(d.prisma.apiChaveLeitura.updateMany).not.toHaveBeenCalled()
    expect(output.close).toHaveBeenCalledOnce()
  })
  it('lists only explicit metadata and never raw/hash', async () => {
    const d = fixture(); await runApiKeyCli(['listar'], d)
    const output = d.write.mock.calls.map(args => args[0]).join('')
    expect(output.includes('must-not-list')).toBe(false)
    expect(output.includes('hash')).toBe(false)
    expect(d.prisma.apiChaveLeitura.findMany.mock.calls[0][0].select.hash).toBeUndefined()
  })
  it('refuses ambiguous prefix revocation instead of revoking all colliding keys', async () => {
    const d = fixture(); d.prisma.apiChaveLeitura.findMany.mockResolvedValue([{ id: 'one' }, { id: 'two' }] as never)
    await expect(runApiKeyCli(['revogar', '--prefixo', 'safe-prefix'], d)).rejects.toThrow()
    expect(d.prisma.apiChaveLeitura.updateMany).not.toHaveBeenCalled()
  })
  it('revokes id without deleting history', async () => {
    const d = fixture(); await runApiKeyCli(['revogar', '--id', 'key-id'], d)
    expect(d.prisma.apiChaveLeitura.updateMany.mock.calls[0][0]).toMatchObject({ where: { id: 'key-id', revogadoEm: null }, data: { revogadoEm: expect.any(Date) } })
  })
  it.each([['read:nope', '2099-01-01T00:00:00Z'], ['read:all', 'not-date'], ['read:all', '2000-01-01T00:00:00Z']])('rejects invalid scope/expiration before persistence', async (scope, expiry) => {
    const d = fixture()
    await expect(runApiKeyCli(['criar', '--nome', 'Test', '--escopos', scope, '--expira-em', expiry], d)).rejects.toThrow()
    expect(d.prisma.apiChaveLeitura.create).not.toHaveBeenCalled()
  })
})
