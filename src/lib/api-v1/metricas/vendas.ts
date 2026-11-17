import type { PrismaClient } from '@prisma/client'
import { STATUS_PAGO_TODOS } from '../../pedido-status'
import type { ApiContext } from '../types'
import type { MetricDefinition, StoreMetricOptions } from './registry'
import {
  API_METRIC_TAKE,
  aggregateLabel,
  averageMoney,
  boundedMetricRows,
  bucketForInstant,
  decimalOrNull,
  decimalValue,
  listMetricBuckets,
  metricBase,
  metricMoney,
  type MetricParams,
} from './tempo'

type OrderItem = {
  id: string
  produtoId: string
  quantidade: number
  precoUnitario: unknown
  custoUnitario: unknown
  variacaoId: string | null
  variacaoNome: string | null
  produto: { nome: string }
}
type SaleOrder = {
  id: string
  total: unknown
  createdAt: Date
  mpTaxaReal: unknown
  custoFreteReal: unknown
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  fbc: string | null
  itens: OrderItem[]
  garantias: { produtoId: string; pedidoItemId: string | null; valorPago: unknown; produto: { nome: string } }[]
  pagamentos: { mpStatus: string; metodo: string; valor: number }[]
  endereco: { estado: string; cidade: string }
}
type MoneyCount = { count: number; value: ReturnType<typeof decimalValue> }
type SalesAccumulator = {
  orders: number
  gross: ReturnType<typeof decimalValue>
  net: ReturnType<typeof decimalValue>
  profit: ReturnType<typeof decimalValue>
  allProfitKnown: boolean
}

const zero = () => decimalValue(0)
const SUCCESSFUL_PAYMENT_STATUSES = new Set(['approved', 'captured'])
const salesSchema = {
  type: 'object',
  required: ['timezone', 'periodo', 'definicoes', 'resumo', 'serie', 'porStatusPagamento', 'porMetodoPagamento', 'porProduto', 'porVariacao', 'porUf', 'porCidade', 'porAtribuicao'],
} as const

async function db(options: StoreMetricOptions): Promise<PrismaClient> {
  return options.prisma ?? (await import('../../prisma')).prisma
}

function clickChannel(values: { gclid?: string | null; gbraid?: string | null; wbraid?: string | null; fbc?: string | null }): string {
  if (values.gclid) return 'gclid'
  if (values.gbraid) return 'gbraid'
  if (values.wbraid) return 'wbraid'
  if (values.fbc) return 'fbc'
  return 'sem_click_id'
}

function authoritativeAttribution(order: SaleOrder) {
  const canalClickId = clickChannel(order)
  return {
    origem: ['gclid', 'gbraid', 'wbraid'].includes(canalClickId) ? 'google' : canalClickId === 'fbc' ? 'meta' : 'nao_atribuida',
    meio: canalClickId === 'sem_click_id' ? 'nao_atribuido' : 'paid_click',
    campanha: 'nao_disponivel',
    canalClickId,
  }
}

function addMoneyCount(map: Map<string, MoneyCount>, key: string, value: ReturnType<typeof decimalValue>, count = 1): void {
  const current = map.get(key) ?? { count: 0, value: zero() }
  current.count += count
  current.value = current.value.plus(value)
  map.set(key, current)
}

function orderValues(order: SaleOrder) {
  const itemGross = order.itens.reduce((sum, item) => sum.plus(decimalValue(item.precoUnitario).mul(item.quantidade)), zero())
  const warranties = order.garantias.reduce((sum, warranty) => sum.plus(decimalValue(warranty.valorPago)), zero())
  const fee = decimalOrNull(order.mpTaxaReal)
  const freightCost = decimalOrNull(order.custoFreteReal)
  const itemCosts = order.itens.map(item => decimalOrNull(item.custoUnitario))
  const known = fee !== null && freightCost !== null && itemCosts.every(cost => cost !== null)
  const net = decimalValue(order.total)
  const profit = known
    ? net.minus(fee).minus(freightCost).minus(itemCosts.reduce((sum, cost, index) => sum.plus(cost!.mul(order.itens[index].quantidade)), zero()))
    : null
  return { gross: itemGross.plus(warranties), net, profit }
}

function emptySalesAccumulator(): SalesAccumulator {
  return { orders: 0, gross: zero(), net: zero(), profit: zero(), allProfitKnown: true }
}

function addOrder(accumulator: SalesAccumulator, order: SaleOrder): void {
  const values = orderValues(order)
  accumulator.orders += 1
  accumulator.gross = accumulator.gross.plus(values.gross)
  accumulator.net = accumulator.net.plus(values.net)
  if (values.profit === null) accumulator.allProfitKnown = false
  else accumulator.profit = accumulator.profit.plus(values.profit)
}

function renderAccumulator(value: SalesAccumulator) {
  return {
    pedidosPagos: value.orders,
    receitaBruta: metricMoney(value.gross),
    receitaLiquidaComercial: metricMoney(value.net),
    lucroLiquidoConhecido: value.allProfitKnown ? metricMoney(value.profit) : null,
    ticketMedio: averageMoney(value.net, value.orders),
  }
}

export function createVendasMetric(options: StoreMetricOptions = {}): MetricDefinition<{
  timezone: string
  periodo: MetricParams['periodo']
  definicoes: Record<string, string>
  resumo: ReturnType<typeof renderAccumulator> & { pedidosComLucroConhecido: number; pedidosComCustoPendente: number }
  serie: Array<{ bucket: string } & ReturnType<typeof renderAccumulator>>
  porStatusPagamento: Array<{ status: string; pagamentos: number; valor: string }>
  porMetodoPagamento: Array<{ metodo: string; pagamentos: number; valor: string }>
  porProduto: Array<{ produtoId: string; produto: string; quantidade: number; receitaBruta: string }>
  porVariacao: Array<{ produtoId: string; variacaoId: string | null; variacao: string; quantidade: number; receitaBruta: string }>
  porUf: Array<{ uf: string; pedidos: number; receitaLiquidaComercial: string }>
  porCidade: Array<{ uf: string; cidade: string; pedidos: number; receitaLiquidaComercial: string }>
  porAtribuicao: Array<{ origem: string; meio: string; campanha: string; canalClickId: string; pedidos: number; receitaLiquidaComercial: string }>
}> {
  return {
    slug: 'vendas',
    scope: 'read:financeiro',
    schema: salesSchema,
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const rawOrders = boundedMetricRows(await client.pedido.findMany({
          where: { createdAt: { gte: params.from, lt: params.toExclusive }, status: { in: STATUS_PAGO_TODOS } },
          select: {
            id: true, total: true, createdAt: true, mpTaxaReal: true, custoFreteReal: true,
            gclid: true, gbraid: true, wbraid: true, fbc: true,
            itens: { select: { id: true, produtoId: true, quantidade: true, precoUnitario: true, custoUnitario: true, variacaoId: true, variacaoNome: true, produto: { select: { nome: true } } } },
            garantias: { select: { produtoId: true, pedidoItemId: true, valorPago: true, produto: { select: { nome: true } } } },
            pagamentos: { select: { mpStatus: true, metodo: true, valor: true } },
            endereco: { select: { estado: true, cidade: true } },
          },
          take: API_METRIC_TAKE,
        }))
      const orders = rawOrders as unknown as SaleOrder[]
      const total = emptySalesAccumulator()
      const byBucket = new Map(listMetricBuckets(params).map(bucket => [bucket, emptySalesAccumulator()]))
      const paymentStatus = new Map<string, MoneyCount>()
      const paymentMethod = new Map<string, MoneyCount>()
      const products = new Map<string, { produtoId: string; produto: string; quantidade: number; receita: ReturnType<typeof decimalValue> }>()
      const variations = new Map<string, { produtoId: string; variacaoId: string | null; variacao: string; quantidade: number; receita: ReturnType<typeof decimalValue> }>()
      const states = new Map<string, MoneyCount>()
      const cities = new Map<string, { uf: string; cidade: string; count: number; value: ReturnType<typeof decimalValue> }>()
      const attribution = new Map<string, { origem: string; meio: string; campanha: string; canalClickId: string; count: number; value: ReturnType<typeof decimalValue> }>()
      let knownProfit = 0

      for (const order of orders) {
        addOrder(total, order)
        addOrder(byBucket.get(bucketForInstant(order.createdAt, params.agrupar))!, order)
        if (orderValues(order).profit !== null) knownProfit += 1
        for (const payment of order.pagamentos) {
          const value = decimalValue(payment.valor).div(100)
          addMoneyCount(paymentStatus, aggregateLabel(payment.mpStatus, 'desconhecido'), value)
          if (SUCCESSFUL_PAYMENT_STATUSES.has(payment.mpStatus.toLocaleLowerCase())) {
            addMoneyCount(paymentMethod, aggregateLabel(payment.metodo, 'desconhecido'), value)
          }
        }
        if (order.pagamentos.length === 0) {
          addMoneyCount(paymentStatus, 'sem_pagamento_registrado', zero())
        }
        for (const item of order.itens) {
          const itemRevenue = decimalValue(item.precoUnitario).mul(item.quantidade)
          const product = products.get(item.produtoId) ?? { produtoId: item.produtoId, produto: aggregateLabel(item.produto.nome, 'produto_sem_nome', true), quantidade: 0, receita: zero() }
          product.quantidade += item.quantidade
          product.receita = product.receita.plus(itemRevenue)
          products.set(item.produtoId, product)
          const variationKey = `${item.produtoId}:${item.variacaoId ?? ''}`
          const variation = variations.get(variationKey) ?? { produtoId: item.produtoId, variacaoId: item.variacaoId, variacao: aggregateLabel(item.variacaoNome, 'sem_variacao', true), quantidade: 0, receita: zero() }
          variation.quantidade += item.quantidade
          variation.receita = variation.receita.plus(itemRevenue)
          variations.set(variationKey, variation)
        }
        const itemById = new Map(order.itens.map(item => [item.id, item]))
        for (const warranty of order.garantias) {
          const warrantyRevenue = decimalValue(warranty.valorPago)
          const product = products.get(warranty.produtoId) ?? { produtoId: warranty.produtoId, produto: aggregateLabel(warranty.produto.nome, 'produto_sem_nome', true), quantidade: 0, receita: zero() }
          product.receita = product.receita.plus(warrantyRevenue)
          products.set(warranty.produtoId, product)
          const item = warranty.pedidoItemId ? itemById.get(warranty.pedidoItemId) : undefined
          const variationId = item?.variacaoId ?? null
          const variationName = item ? aggregateLabel(item.variacaoNome, 'sem_variacao', true) : 'garantia_nao_alocada'
          const variationKey = item ? `${warranty.produtoId}:${variationId ?? ''}` : `${warranty.produtoId}:garantia_nao_alocada`
          const variation = variations.get(variationKey) ?? { produtoId: warranty.produtoId, variacaoId: variationId, variacao: variationName, quantidade: 0, receita: zero() }
          variation.receita = variation.receita.plus(warrantyRevenue)
          variations.set(variationKey, variation)
        }
        const net = decimalValue(order.total)
        const uf = aggregateLabel(order.endereco.estado, 'N/A', true)
        addMoneyCount(states, uf, net)
        const city = aggregateLabel(order.endereco.cidade, 'nao_informada')
        const cityKey = `${uf}\u0000${city}`
        const cityValue = cities.get(cityKey) ?? { uf, cidade: city, count: 0, value: zero() }
        cityValue.count += 1
        cityValue.value = cityValue.value.plus(net)
        cities.set(cityKey, cityValue)

        const { origem, meio, campanha, canalClickId } = authoritativeAttribution(order)
        const attributionKey = JSON.stringify([origem, meio, campanha, canalClickId])
        const attributed = attribution.get(attributionKey) ?? { origem, meio, campanha, canalClickId, count: 0, value: zero() }
        attributed.count += 1
        attributed.value = attributed.value.plus(net)
        attribution.set(attributionKey, attributed)
      }

      const definicoes = {
        pedidosPagos: 'Pedido.status em pago|enviado|entregue, incluindo variantes legadas em maiúsculas, com Pedido.createdAt no período BRT.',
        receitaBruta: 'Σ(ItemPedido.precoUnitario × quantidade) + Σ(GarantiaEstendida.valorPago) dos pedidos pagos.',
        receitaLiquidaComercial: 'Σ(Pedido.total) dos pedidos pagos.',
        lucroLiquidoConhecido: 'Σ(Pedido.total − mpTaxaReal − custoFreteReal − Σ(ItemPedido.custoUnitario × quantidade)); null se qualquer entrada de custo conhecida estiver ausente.',
        ticketMedio: 'receitaLiquidaComercial ÷ pedidosPagos.',
        metodoPagamento: 'Somente pernas reais com mpStatus approved|captured; tentativas rejeitadas permanecem apenas na quebra de status.',
        produtoVariacao: 'Garantias compõem o produto por GarantiaEstendida.produtoId; na variação usam pedidoItemId quando disponível e garantia_nao_alocada quando ausente.',
        atribuicao: 'Somente click ids persistidos no Pedido pago entram na atribuição financeira. Eventos client-side não alteram origem, meio ou campanha; click ids saem apenas como canal agregado.',
      }
      return {
        ...metricBase(params, definicoes),
        resumo: { ...renderAccumulator(total), pedidosComLucroConhecido: knownProfit, pedidosComCustoPendente: orders.length - knownProfit },
        serie: [...byBucket].map(([bucket, value]) => ({ bucket, ...renderAccumulator(value) })),
        porStatusPagamento: [...paymentStatus].map(([status, value]) => ({ status, pagamentos: value.count, valor: metricMoney(value.value) })).sort((a, b) => a.status.localeCompare(b.status)),
        porMetodoPagamento: [...paymentMethod].map(([metodo, value]) => ({ metodo, pagamentos: value.count, valor: metricMoney(value.value) })).sort((a, b) => a.metodo.localeCompare(b.metodo)),
        porProduto: [...products.values()].map(value => ({ produtoId: value.produtoId, produto: value.produto, quantidade: value.quantidade, receitaBruta: metricMoney(value.receita) })).sort((a, b) => a.produtoId.localeCompare(b.produtoId)),
        porVariacao: [...variations.values()].map(value => ({ produtoId: value.produtoId, variacaoId: value.variacaoId, variacao: value.variacao, quantidade: value.quantidade, receitaBruta: metricMoney(value.receita) })).sort((a, b) => `${a.produtoId}:${a.variacaoId ?? ''}`.localeCompare(`${b.produtoId}:${b.variacaoId ?? ''}`)),
        porUf: [...states].map(([uf, value]) => ({ uf, pedidos: value.count, receitaLiquidaComercial: metricMoney(value.value) })).sort((a, b) => a.uf.localeCompare(b.uf)),
        porCidade: [...cities.values()].map(value => ({ uf: value.uf, cidade: value.cidade, pedidos: value.count, receitaLiquidaComercial: metricMoney(value.value) })).sort((a, b) => `${a.uf}:${a.cidade}`.localeCompare(`${b.uf}:${b.cidade}`)),
        porAtribuicao: [...attribution.values()].map(value => ({ origem: value.origem, meio: value.meio, campanha: value.campanha, canalClickId: value.canalClickId, pedidos: value.count, receitaLiquidaComercial: metricMoney(value.value) })).sort((a, b) => `${a.origem}:${a.meio}:${a.campanha}:${a.canalClickId}`.localeCompare(`${b.origem}:${b.meio}:${b.campanha}:${b.canalClickId}`)),
      }
    },
  }
}
