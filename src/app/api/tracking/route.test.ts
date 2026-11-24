import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  sessionUpsert: vi.fn(),
  sessionUpdate: vi.fn(),
  eventCreate: vi.fn(),
  eventUpsert: vi.fn(),
  orderFindFirst: vi.fn(),
  hourlyUpsert: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({ rateLimit: mocks.limit, getClientIp: () => '192.0.2.10' }))
vi.mock('@/lib/prisma', () => ({ prisma: {
  sessaoVisitante: { upsert: mocks.sessionUpsert, update: mocks.sessionUpdate },
  eventoTracking: { create: mocks.eventCreate, upsert: mocks.eventUpsert },
  pedido: { findFirst: mocks.orderFindFirst },
  relatorioVendaHora: { upsert: mocks.hourlyUpsert },
} }))
vi.mock('@/lib/tracking', () => ({
  COOKIE_SESSION: 'sixxis_sid',
  detectDispositivo: () => 'desktop', detectBrowser: () => 'test', detectOS: () => 'test',
  extrairUTMs: () => ({}),
}))
vi.mock('@/lib/consent', () => ({ CONSENT_COOKIE: 'sixxis_consent', parseConsent: () => ({ analytics: true, marketing: false }) }))
vi.mock('@/lib/pedido-status', () => ({ STATUS_PAGO_TODOS: ['pago', 'approved'] }))

import { POST } from './route'

const sid = 'sid_1731772800000_abcdefgh'
const consent = encodeURIComponent(JSON.stringify({ a: 1, m: 0 }))
function request(body: unknown, cookieSid = sid): NextRequest {
  return new NextRequest('https://example.test/api/tracking', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: `sixxis_consent=${consent}; sixxis_sid=${cookieSid}` },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.limit.mockResolvedValue({ success: true, remaining: 119, reset: Date.now() + 60_000 })
  mocks.sessionUpsert.mockResolvedValue({})
  mocks.eventCreate.mockResolvedValue({})
  mocks.eventUpsert.mockResolvedValue({})
  mocks.orderFindFirst.mockResolvedValue({ id: 'order-paid', total: 1299 })
})

describe('POST /api/tracking trust boundary', () => {
  it('rate-limits before parsing or writing tracking data', async () => {
    mocks.limit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 })
    const response = await POST(request({ tipo: 'page_view', sessaoId: sid, pagina: '/' }))
    expect(response.status).toBe(429)
    expect(mocks.sessionUpsert).not.toHaveBeenCalled()
    expect(mocks.eventCreate).not.toHaveBeenCalled()
  })

  it('rejects unknown event types and session IDs that differ from the first-party cookie', async () => {
    expect((await POST(request({ tipo: 'arbitrary_admin_event', sessaoId: sid }))).status).toBe(400)
    expect((await POST(request({ tipo: 'page_view', sessaoId: sid }, 'sid_1731772800000_otherid'))).status).toBe(400)
    expect(mocks.sessionUpsert).not.toHaveBeenCalled()
  })

  it('accepts an allowlisted event with a bounded sanitized payload', async () => {
    const response = await POST(request({ tipo: 'page_view', sessaoId: sid, pagina: '/produtos', landingPage: 'https://example.test/?utm_source=google' }))
    expect(response.status).toBe(200)
    expect(mocks.limit).toHaveBeenCalledWith('tracking', '192.0.2.10')
    expect(mocks.sessionUpsert).toHaveBeenCalledOnce()
    expect(mocks.eventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ sessaoId: sid, tipo: 'page_view', pagina: '/produtos' }) })
  })

  it('rejects purchase telemetry unless it matches an authoritative paid order', async () => {
    mocks.orderFindFirst.mockResolvedValue(null)
    const response = await POST(request({ tipo: 'purchase', sessaoId: sid, valor: 1299, dados: { transaction_id: 'order-unpaid', shipping: 0, itens: [] } }))
    expect(response.status).toBe(400)
    expect(mocks.eventCreate).not.toHaveBeenCalled()
    expect(mocks.eventUpsert).not.toHaveBeenCalled()
    expect(mocks.hourlyUpsert).not.toHaveBeenCalled()
  })

  it('deduplicates a paid purchase without mutating the client-forgeable hourly sales report', async () => {
    const response = await POST(request({ tipo: 'purchase', sessaoId: sid, valor: 1299, dados: { transaction_id: 'order-paid', shipping: 0, itens: [] } }))
    const otherSid = 'sid_1731772800001_ijklmnop'
    const repeated = await POST(request({ tipo: 'purchase', sessaoId: otherSid, valor: 1299, dados: { transaction_id: 'order-paid', shipping: 0, itens: [] } }, otherSid))
    expect(response.status).toBe(200)
    expect(repeated.status).toBe(200)
    expect(mocks.orderFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'order-paid' }) }))
    expect(mocks.eventCreate).not.toHaveBeenCalled()
    expect(mocks.eventUpsert).toHaveBeenCalledTimes(2)
    const firstId = mocks.eventUpsert.mock.calls[0][0].where.id
    const repeatedId = mocks.eventUpsert.mock.calls[1][0].where.id
    expect(firstId).toMatch(/^trk_[a-f0-9]{64}$/)
    expect(repeatedId).toBe(firstId)
    expect(mocks.eventUpsert).toHaveBeenCalledWith({ where: { id: firstId }, create: expect.objectContaining({ id: firstId, sessaoId: sid, tipo: 'purchase' }), update: {} })
    expect(mocks.hourlyUpsert).not.toHaveBeenCalled()
    expect(mocks.sessionUpdate).not.toHaveBeenCalled()
  })

  it('grava o evento quando outra requisição cria a mesma sessão ao mesmo tempo', async () => {
    mocks.sessionUpsert.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'P2002' }))
    mocks.sessionUpdate.mockResolvedValue({})
    const response = await POST(request({ tipo: 'view_item', sessaoId: sid, pagina: '/produtos/sx070-trend', valor: 2100 }))
    expect(response.status).toBe(200)
    expect(mocks.sessionUpdate).not.toHaveBeenCalled()
    expect(mocks.eventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ sessaoId: sid, tipo: 'view_item' }) })
  })

  it('mantém a contagem de páginas quando o page_view perde a corrida de criação', async () => {
    mocks.sessionUpsert.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'P2002' }))
    mocks.sessionUpdate.mockResolvedValue({})
    const response = await POST(request({ tipo: 'page_view', sessaoId: sid, pagina: '/produtos/sx070-trend' }))
    expect(response.status).toBe(200)
    expect(mocks.sessionUpdate).toHaveBeenCalledWith({ where: { sessaoId: sid }, data: { totalPaginas: { increment: 1 } } })
    expect(mocks.eventCreate).toHaveBeenCalledOnce()
  })

  it('não mascara outros erros de banco', async () => {
    mocks.sessionUpsert.mockRejectedValueOnce(Object.assign(new Error('down'), { code: 'P1001' }))
    const response = await POST(request({ tipo: 'view_item', sessaoId: sid, pagina: '/produtos/sx070-trend' }))
    expect(response.status).toBe(500)
    expect(mocks.eventCreate).not.toHaveBeenCalled()
  })
})
