import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
const { ipFromRequest } = await import('./bruteforce')

describe('bruteforce: IP usado no bloqueio do login admin', () => {
  it('cf-connecting-ip forjado não troca o IP (não há Cloudflare na frente)', () => {
    const r1 = new Request('http://x/api/admin/auth', { headers: { 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '200.1.2.3' } })
    const r2 = new Request('http://x/api/admin/auth', { headers: { 'cf-connecting-ip': '2.2.2.2', 'x-forwarded-for': '200.1.2.3' } })
    expect(ipFromRequest(r1)).toBe('200.1.2.3')
    expect(ipFromRequest(r2)).toBe(ipFromRequest(r1))
  })
})
