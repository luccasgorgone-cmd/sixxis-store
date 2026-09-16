import { describe, expect, it } from 'vitest'
import { montarPayloadGa4Purchase } from './ga4-measurement-protocol'

describe('montarPayloadGa4Purchase', () => {
  const base = {
    clientId: '123.456',
    transactionId: 'pedido-1',
    value: 100,
    currency: 'BRL',
    items: [{ item_id: 'SKU-1', price: 100, quantity: 1 }],
  }

  it('envia session_id e engagement_time_msec para atribuir o purchase à sessão', () => {
    const payload = montarPayloadGa4Purchase({ ...base, sessionId: '1758012345' })
    expect(payload.events[0].params).toMatchObject({
      session_id: 1758012345,
      engagement_time_msec: 1000,
    })
  })

  it('mantém compatibilidade com pedidos antigos sem session_id', () => {
    const payload = montarPayloadGa4Purchase(base)
    expect(payload.events[0].params).not.toHaveProperty('session_id')
  })
})
