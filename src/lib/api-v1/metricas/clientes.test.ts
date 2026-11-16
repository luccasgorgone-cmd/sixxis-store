import { Prisma } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import type { ApiContext } from '../types'
import { createClientesMetric } from './clientes'
import { parseMetricParams } from './tempo'

const D = (value: string) => new Prisma.Decimal(value)
const context = { requestId: 'req-clientes', identity: null, ip: '127.0.0.1', startedAt: 0, rateLimit: { success: true, limit: 600, remaining: 599, reset: 0 } } satisfies ApiContext
const params = parseMetricParams(new URLSearchParams({ de: '2026-11-16', ate: '2026-11-16', agrupar: 'dia' }))

describe('metricas/clientes', () => {
  it('classifies new vs recurring by first paid order and computes historical paid LTV', async () => {
    const findMany = vi.fn()
      .mockResolvedValueOnce([
        { clienteId: 'cliente-novo', total: D('100'), createdAt: new Date('2026-11-16T12:00:00Z') },
        { clienteId: 'cliente-recorrente', total: D('200'), createdAt: new Date('2026-11-16T13:00:00Z') },
      ])
      .mockResolvedValueOnce([
        { clienteId: 'cliente-novo', total: D('100'), createdAt: new Date('2026-11-16T12:00:00Z') },
        { clienteId: 'cliente-recorrente', total: D('50'), createdAt: new Date('2026-10-01T12:00:00Z') },
        { clienteId: 'cliente-recorrente', total: D('200'), createdAt: new Date('2026-11-16T13:00:00Z') },
      ])
    const definition = createClientesMetric({ prisma: { pedido: { findMany } } as never })

    const result = await definition.query(context, params)

    expect(result.resumo).toEqual({ clientesCompradores: 2, novos: 1, recorrentes: 1, ltvMedio: '175.00', receitaHistorica: '350.00' })
    expect(result.serie).toEqual([{ bucket: '2026-11-16', clientesCompradores: 2, novos: 1, recorrentes: 1 }])
    expect(result.definicoes.novo).toContain('primeiro pedido pago')
    expect(result.definicoes.ltvMedio).toContain('histórico')
    expect(findMany).toHaveBeenCalledTimes(2)
    expect(findMany.mock.calls[1][0].where.clienteId.in).toEqual(['cliente-novo', 'cliente-recorrente'])
    expect(findMany.mock.calls[1][0].select).toEqual({ clienteId: true, total: true, createdAt: true })
  })

  it('does not run an unbounded history query when the period has no buyers', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const definition = createClientesMetric({ prisma: { pedido: { findMany } } as never })

    const result = await definition.query(context, params)

    expect(result.resumo.ltvMedio).toBe('0.00')
    expect(findMany).toHaveBeenCalledTimes(1)
  })
})
