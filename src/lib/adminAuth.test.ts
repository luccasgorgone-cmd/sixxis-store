import { describe, it, expect, beforeAll } from 'vitest'
import type { NextRequest } from 'next/server'
import { signAdminToken, verifyAdminToken } from './adminToken'
import { requireAdmin } from './adminAuth'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-admin-rbac'
})

function req(token: string | undefined, path: string): NextRequest {
  return {
    cookies: { get: (_n: string) => (token ? { value: token } : undefined) },
    nextUrl: { pathname: path },
  } as unknown as NextRequest
}

describe('adminToken role', () => {
  it('assina e verifica role pedidos e admin', () => {
    expect(verifyAdminToken(signAdminToken('pedidos'))?.role).toBe('pedidos')
    expect(verifyAdminToken(signAdminToken('admin'))?.role).toBe('admin')
    expect(verifyAdminToken('lixo.invalido')).toBeNull()
  })
})

describe('requireAdmin — gating por papel', () => {
  it('sem token → 401', async () => {
    const r = await requireAdmin(req(undefined, '/api/admin/pedidos'))
    expect(r?.status).toBe(401)
  })

  it('admin → acessa qualquer rota', async () => {
    const t = signAdminToken('admin')
    expect(await requireAdmin(req(t, '/api/admin/produtos'))).toBeNull()
    expect(await requireAdmin(req(t, '/api/admin/clientes'))).toBeNull()
    expect(await requireAdmin(req(t, '/api/admin/pedidos'))).toBeNull()
  })

  it('pedidos (colaborador) → só rotas de Pedidos', async () => {
    const t = signAdminToken('pedidos')
    expect(await requireAdmin(req(t, '/api/admin/pedidos'))).toBeNull()
    expect(await requireAdmin(req(t, '/api/admin/pedidos/abc/cotar-transportadoras'))).toBeNull()
    expect(await requireAdmin(req(t, '/api/admin/me'))).toBeNull()
  })

  it('pedidos → BLOQUEADO (403) fora de Pedidos', async () => {
    const t = signAdminToken('pedidos')
    for (const path of ['/api/admin/produtos', '/api/admin/clientes', '/api/admin/configuracoes', '/api/admin/pedidos-outra-coisa']) {
      const r = await requireAdmin(req(t, path))
      expect(r?.status, path).toBe(403)
    }
  })
})
