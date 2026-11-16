import type { PrismaClient } from '@prisma/client'
import { hasScope } from '../auth'
import { ApiQueryError } from '../query'
import { withQueryTimeout } from '../resource'
import type { ApiContext } from '../types'
import { createClientesMetric } from './clientes'
import { createFunilMetric } from './funil'
import {
  createAvaliacoesMetric,
  createCarrinhosMetric,
  createCuponsCashbackFidelidadeMetric,
  createEstoqueCatalogoMetric,
  createFreteMetric,
} from './operacao'
import { parseMetricParams, type MetricParams } from './tempo'
import { createVendasMetric } from './vendas'

export type MetricScope = 'read:analytics' | 'read:financeiro'
export type MetricDefinition<T extends Record<string, unknown> = Record<string, unknown>> = {
  slug: string
  scope: MetricScope
  query(ctx: ApiContext, params: MetricParams): Promise<T>
  schema: Record<string, unknown>
}

export type StoreMetricOptions = {
  prisma?: PrismaClient
  now?: () => Date
}

export function createMetricRegistry(definitions: readonly MetricDefinition[]) {
  const metrics = new Map<string, MetricDefinition>()
  for (const definition of definitions) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(definition.slug) || metrics.has(definition.slug)) throw new TypeError('Invalid or duplicate metric slug')
    if (!['read:analytics', 'read:financeiro'].includes(definition.scope)) throw new TypeError('Invalid metric scope')
    metrics.set(definition.slug, definition)
  }
  return {
    get: (slug: string) => metrics.get(slug),
    list: () => [...metrics.values()],
    get size() { return metrics.size },
    async execute(slug: string, ctx: ApiContext, search: URLSearchParams) {
      const definition = metrics.get(slug)
      if (!definition) throw new ApiQueryError(404, 'Métrica não encontrada.')
      if (!ctx.identity || !hasScope(ctx.identity, definition.scope)) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
      const params = parseMetricParams(search)
      return withQueryTimeout(() => definition.query(ctx, params))
    },
  }
}

export type MetricRegistry = ReturnType<typeof createMetricRegistry>

export function createStoreMetricRegistry(options: StoreMetricOptions = {}): MetricRegistry {
  return createMetricRegistry([
    createVendasMetric(options),
    createFunilMetric(options),
    createCarrinhosMetric(options),
    createCuponsCashbackFidelidadeMetric(options),
    createFreteMetric(options),
    createAvaliacoesMetric(options),
    createEstoqueCatalogoMetric(options),
    createClientesMetric(options),
  ])
}
