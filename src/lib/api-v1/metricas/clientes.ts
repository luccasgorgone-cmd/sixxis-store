import type { PrismaClient } from '@prisma/client'
import { STATUS_PAGO_TODOS } from '../../pedido-status'
import type { ApiContext } from '../types'
import type { MetricDefinition, StoreMetricOptions } from './registry'
import { averageMoney, bucketForInstant, decimalValue, listMetricBuckets, metricBase, metricMoney, type MetricParams } from './tempo'

type PaidOrder = { clienteId: string; total: unknown; createdAt: Date }

async function db(options: StoreMetricOptions): Promise<PrismaClient> {
  return options.prisma ?? (await import('../../prisma')).prisma
}

export function createClientesMetric(options: StoreMetricOptions = {}): MetricDefinition<{
  timezone: string
  periodo: MetricParams['periodo']
  definicoes: Record<string, string>
  resumo: { clientesCompradores: number; novos: number; recorrentes: number; ltvMedio: string; receitaHistorica: string }
  serie: Array<{ bucket: string; clientesCompradores: number; novos: number; recorrentes: number }>
}> {
  return {
    slug: 'clientes',
    scope: 'read:financeiro',
    schema: { type: 'object', required: ['timezone', 'periodo', 'definicoes', 'resumo', 'serie'] },
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const periodOrders = await client.pedido.findMany({
        where: { createdAt: { gte: params.from, lt: params.toExclusive }, status: { in: STATUS_PAGO_TODOS } },
        select: { clienteId: true, total: true, createdAt: true },
      }) as unknown as PaidOrder[]
      const customerIds = [...new Set(periodOrders.map(order => order.clienteId))]
      const history = customerIds.length === 0 ? [] : await client.pedido.findMany({
        where: { clienteId: { in: customerIds }, status: { in: STATUS_PAGO_TODOS } },
        select: { clienteId: true, total: true, createdAt: true },
      }) as unknown as PaidOrder[]

      const firstPaid = new Map<string, Date>()
      let historicalRevenue = decimalValue(0)
      for (const order of history) {
        historicalRevenue = historicalRevenue.plus(decimalValue(order.total))
        const current = firstPaid.get(order.clienteId)
        if (!current || order.createdAt < current) firstPaid.set(order.clienteId, order.createdAt)
      }
      const isNew = (customerId: string) => {
        const first = firstPaid.get(customerId)
        return !!first && first >= params.from && first < params.toExclusive
      }
      const novos = customerIds.filter(isNew).length
      const series = new Map(listMetricBuckets(params).map(bucket => [bucket, { bucket, clientesCompradores: 0, novos: 0, recorrentes: 0 }]))
      const buyersByBucket = new Map<string, Set<string>>()
      for (const order of periodOrders) {
        const bucket = bucketForInstant(order.createdAt, params.agrupar)
        const buyers = buyersByBucket.get(bucket) ?? new Set<string>()
        buyers.add(order.clienteId)
        buyersByBucket.set(bucket, buyers)
      }
      for (const [bucketName, buyers] of buyersByBucket) {
        const bucket = series.get(bucketName)!
        for (const customerId of buyers) {
          bucket.clientesCompradores += 1
          if (isNew(customerId) && bucketForInstant(firstPaid.get(customerId)!, params.agrupar) === bucketName) bucket.novos += 1
          else bucket.recorrentes += 1
        }
      }
      const definicoes = {
        clienteComprador: 'Cliente distinto com Pedido.status pago|enviado|entregue e Pedido.createdAt no período BRT.',
        novo: 'Cliente cujo primeiro pedido pago histórico ocorreu no período selecionado.',
        recorrente: 'Cliente comprador no período cujo primeiro pedido pago histórico é anterior ao período.',
        ltvMedio: 'Σ(Pedido.total) de todo o histórico pago dos clientes compradores no período ÷ quantidade desses clientes.',
      }
      return {
        ...metricBase(params, definicoes),
        resumo: {
          clientesCompradores: customerIds.length,
          novos,
          recorrentes: customerIds.length - novos,
          ltvMedio: averageMoney(historicalRevenue, customerIds.length),
          receitaHistorica: metricMoney(historicalRevenue),
        },
        serie: [...series.values()],
      }
    },
  }
}
