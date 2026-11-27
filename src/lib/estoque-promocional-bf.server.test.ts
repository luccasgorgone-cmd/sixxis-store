import { beforeEach, describe, expect, it, vi } from 'vitest'

const { groupBy } = vi.hoisted(() => ({ groupBy: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { itemPedido: { groupBy } } }))
vi.mock('@/lib/pedido-status', () => ({
  STATUS_PAGO_TODOS: ['pago', 'enviado', 'entregue'],
}))

import { buscarQuantidadesPagasLoteBF } from './estoque-promocional-bf.server'

describe('consulta de unidades pagas do lote BF', () => {
  beforeEach(() => groupBy.mockReset())

  it('consulta só pedidos pagos da campanha e agrupa produto + variação', async () => {
    groupBy.mockResolvedValue([
      { produtoId: 'p1', variacaoId: null, _sum: { quantidade: 3 } },
    ])

    const result = await buscarQuantidadesPagasLoteBF()

    expect(groupBy).toHaveBeenCalledWith(expect.objectContaining({
      by: ['produtoId', 'variacaoId'],
      where: expect.objectContaining({
        produto: { slug: { in: expect.arrayContaining(['sx100-trend', 'spinning-sixxis-life']) } },
        pedido: {
          status: { in: ['pago', 'enviado', 'entregue'] },
          createdAt: { gte: new Date('2026-11-23T00:00:00-03:00') },
        },
      }),
      _sum: { quantidade: true },
    }))
    expect([...result.values()]).toEqual([3])
  })
})
