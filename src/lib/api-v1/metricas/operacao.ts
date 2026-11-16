import type { PrismaClient } from '@prisma/client'
import { STATUS_PAGO_TODOS } from '../../pedido-status'
import type { ApiContext } from '../types'
import { loadPeriodAndFollowupEvents, summarizeCheckoutAbandonment } from './funil'
import type { MetricDefinition, StoreMetricOptions } from './registry'
import {
  aggregateLabel,
  bucketForInstant,
  decimalOrNull,
  decimalValue,
  listMetricBuckets,
  metricBase,
  metricMoney,
  type MetricParams,
} from './tempo'

async function db(options: StoreMetricOptions): Promise<PrismaClient> {
  return options.prisma ?? (await import('../../prisma')).prisma
}

type CartRow = { status: string; etapaAtual: number; valorTotal: unknown; itens: unknown; atualizadoEm: Date }

function hasItems(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}

export function createCarrinhosMetric(options: StoreMetricOptions = {}): MetricDefinition<{
  timezone: string
  periodo: MetricParams['periodo']
  definicoes: Record<string, string>
  persistentes: {
    resumo: { carrinhos: number; ativos: number; convertidos: number; abandonadosComerciais: number; valorTotal: string; valorAbandonadoComercial: string }
    porEtapa: Array<{ etapa: number; carrinhos: number; valorTotal: string }>
    porStatus: Array<{ status: string; carrinhos: number; valorTotal: string }>
    serie: Array<{ bucket: string; carrinhos: number; abandonadosComerciais: number; valorTotal: string }>
  }
  checkoutTracked: { tracked: true; abandono: { comercial: number; tecnico: number; emAndamento: number } }
}> {
  return {
    slug: 'carrinhos',
    scope: 'read:analytics',
    schema: { type: 'object', required: ['timezone', 'periodo', 'definicoes', 'persistentes', 'checkoutTracked'] },
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const now = options.now?.() ?? new Date()
      const [rawCarts, loadedEvents] = await Promise.all([
        client.carrinhoCliente.findMany({
          where: { atualizadoEm: { gte: params.from, lt: params.toExclusive } },
          select: { status: true, etapaAtual: true, valorTotal: true, itens: true, atualizadoEm: true },
        }),
        loadPeriodAndFollowupEvents(client, params, now),
      ])
      const carts = rawCarts as unknown as CartRow[]
      const cutoff = now.getTime() - 60 * 60 * 1000
      const byStage = new Map<number, { count: number; value: ReturnType<typeof decimalValue> }>()
      const byStatus = new Map<string, { count: number; value: ReturnType<typeof decimalValue> }>()
      const series = new Map(listMetricBuckets(params).map(bucket => [bucket, { bucket, carrinhos: 0, abandonadosComerciais: 0, value: decimalValue(0) }]))
      let totalValue = decimalValue(0)
      let abandonedValue = decimalValue(0)
      let active = 0
      let converted = 0
      let abandoned = 0
      for (const cart of carts) {
        const value = decimalValue(cart.valorTotal)
        const isAbandoned = cart.status === 'ativo' && hasItems(cart.itens) && cart.atualizadoEm.getTime() <= cutoff
        const derivedStatus = isAbandoned ? 'abandonado_comercial' : aggregateLabel(cart.status, 'desconhecido')
        if (isAbandoned) {
          abandoned += 1
          abandonedValue = abandonedValue.plus(value)
        } else if (cart.status === 'ativo') active += 1
        if (cart.status === 'convertido') converted += 1
        totalValue = totalValue.plus(value)
        const stage = byStage.get(cart.etapaAtual) ?? { count: 0, value: decimalValue(0) }
        stage.count += 1
        stage.value = stage.value.plus(value)
        byStage.set(cart.etapaAtual, stage)
        const status = byStatus.get(derivedStatus) ?? { count: 0, value: decimalValue(0) }
        status.count += 1
        status.value = status.value.plus(value)
        byStatus.set(derivedStatus, status)
        const bucket = series.get(bucketForInstant(cart.atualizadoEm, params.agrupar))!
        bucket.carrinhos += 1
        bucket.abandonadosComerciais += isAbandoned ? 1 : 0
        bucket.value = bucket.value.plus(value)
      }
      return {
        ...metricBase(params, {
          carrinhoPersistente: 'CarrinhoCliente atualizado no período; cobre clientes logados e nunca expõe itens ou clienteId.',
          abandonoComercial: 'status=ativo, itens não vazios e atualizadoEm inativo por >= 1h.',
          checkoutTracked: 'Abandono técnico/comercial de checkout usa EventoTracking consentido, com as mesmas regras de metricas/funil.',
        }),
        persistentes: {
          resumo: { carrinhos: carts.length, ativos: active, convertidos: converted, abandonadosComerciais: abandoned, valorTotal: metricMoney(totalValue), valorAbandonadoComercial: metricMoney(abandonedValue) },
          porEtapa: [...byStage].map(([etapa, value]) => ({ etapa, carrinhos: value.count, valorTotal: metricMoney(value.value) })).sort((a, b) => a.etapa - b.etapa),
          porStatus: [...byStatus].map(([status, value]) => ({ status, carrinhos: value.count, valorTotal: metricMoney(value.value) })).sort((a, b) => a.status.localeCompare(b.status)),
          serie: [...series.values()].map(value => ({ bucket: value.bucket, carrinhos: value.carrinhos, abandonadosComerciais: value.abandonadosComerciais, valorTotal: metricMoney(value.value) })),
        },
        checkoutTracked: { tracked: true as const, abandono: summarizeCheckoutAbandonment(loadedEvents.classificationEvents, now) },
      }
    },
  }
}

type CouponUse = { valorDesconto: unknown; valorPedido: unknown; usadoEm: Date; cupom: { codigo: string } }
type CashbackRow = { tipo: string; status: string; valor: unknown; createdAt: Date }
type LoyaltyLevel = { slug: string; nome: string; gastoMin: number; gastoMax: number | null }

export function createCuponsCashbackFidelidadeMetric(options: StoreMetricOptions = {}): MetricDefinition<{
  timezone: string
  periodo: MetricParams['periodo']
  definicoes: Record<string, string>
  cupons: { resumo: { usos: number; desconto: string; receita: string }; porCupom: Array<{ codigo: string; usos: number; desconto: string; receita: string }> }
  cashback: { creditos: string; debitos: string; saldoMovimentacao: string; saldoDisponivelAtual: string; saldoPendenteAtual: string }
  fidelidade: { snapshotAtual: true; porFaixa: Array<{ slug: string; nome: string; gastoMin: string; gastoMax: string | null; clientes: number }> }
  serie: Array<{ bucket: string; usosCupom: number; descontoCupom: string; receitaCupom: string; creditosCashback: string; debitosCashback: string }>
}> {
  return {
    slug: 'cupons-cashback-fidelidade',
    scope: 'read:financeiro',
    schema: { type: 'object', required: ['timezone', 'periodo', 'definicoes', 'cupons', 'cashback', 'fidelidade'] },
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const [rawUses, rawCashback, balances, rawLevels, customerSpend] = await Promise.all([
        client.cupomUso.findMany({ where: { usadoEm: { gte: params.from, lt: params.toExclusive } }, select: { valorDesconto: true, valorPedido: true, usadoEm: true, cupom: { select: { codigo: true } } } }),
        client.cashbackTransacao.findMany({ where: { createdAt: { gte: params.from, lt: params.toExclusive } }, select: { tipo: true, status: true, valor: true, createdAt: true } }),
        client.cliente.aggregate({ _sum: { cashbackSaldo: true, cashbackPendente: true } }),
        client.nivelFidelidade.findMany({ select: { slug: true, nome: true, gastoMin: true, gastoMax: true }, orderBy: { ordem: 'asc' } }),
        client.cliente.findMany({ select: { totalGasto: true } }),
      ])
      const uses = rawUses as unknown as CouponUse[]
      const cashback = rawCashback as unknown as CashbackRow[]
      const levels = rawLevels as unknown as LoyaltyLevel[]
      const couponMap = new Map<string, { usos: number; desconto: ReturnType<typeof decimalValue>; receita: ReturnType<typeof decimalValue> }>()
      const series = new Map(listMetricBuckets(params).map(bucket => [bucket, { bucket, usosCupom: 0, descontoCupom: decimalValue(0), receitaCupom: decimalValue(0), creditosCashback: decimalValue(0), debitosCashback: decimalValue(0) }]))
      let discount = decimalValue(0)
      let couponRevenue = decimalValue(0)
      for (const use of uses) {
        const code = aggregateLabel(use.cupom.codigo, 'sem_codigo', true)
        const current = couponMap.get(code) ?? { usos: 0, desconto: decimalValue(0), receita: decimalValue(0) }
        current.usos += 1
        current.desconto = current.desconto.plus(decimalValue(use.valorDesconto))
        current.receita = current.receita.plus(decimalValue(use.valorPedido))
        couponMap.set(code, current)
        discount = discount.plus(decimalValue(use.valorDesconto))
        couponRevenue = couponRevenue.plus(decimalValue(use.valorPedido))
        const bucket = series.get(bucketForInstant(use.usadoEm, params.agrupar))!
        bucket.usosCupom += 1
        bucket.descontoCupom = bucket.descontoCupom.plus(decimalValue(use.valorDesconto))
        bucket.receitaCupom = bucket.receitaCupom.plus(decimalValue(use.valorPedido))
      }
      let credits = decimalValue(0)
      let debits = decimalValue(0)
      for (const row of cashback) {
        if (row.status === 'cancelado') continue
        const bucket = series.get(bucketForInstant(row.createdAt, params.agrupar))!
        if (row.tipo === 'credito') {
          credits = credits.plus(decimalValue(row.valor))
          bucket.creditosCashback = bucket.creditosCashback.plus(decimalValue(row.valor))
        }
        if (row.tipo === 'debito') {
          debits = debits.plus(decimalValue(row.valor))
          bucket.debitosCashback = bucket.debitosCashback.plus(decimalValue(row.valor))
        }
      }
      const balanceSums = (balances as unknown as { _sum: { cashbackSaldo: unknown; cashbackPendente: unknown } })._sum
      const spends = customerSpend as unknown as { totalGasto: number }[]
      const ranges = levels.map(level => ({
        slug: level.slug,
        nome: aggregateLabel(level.nome, level.slug, true),
        gastoMin: metricMoney(decimalValue(level.gastoMin)),
        gastoMax: level.gastoMax === null ? null : metricMoney(decimalValue(level.gastoMax)),
        clientes: spends.filter(customer => customer.totalGasto >= level.gastoMin && (level.gastoMax === null || customer.totalGasto <= level.gastoMax)).length,
      }))
      return {
        ...metricBase(params, {
          cupons: 'CupomUso.usadoEm no período: usos, Σ(valorDesconto) e Σ(valorPedido).',
          cashback: 'Movimento no período ignora status=cancelado; saldo atual soma Cliente.cashbackSaldo e Cliente.cashbackPendente.',
          fidelidade: 'Snapshot atual de clientes por faixas inclusivas NivelFidelidade.gastoMin/gastoMax usando Cliente.totalGasto.',
        }),
        cupons: {
          resumo: { usos: uses.length, desconto: metricMoney(discount), receita: metricMoney(couponRevenue) },
          porCupom: [...couponMap].map(([codigo, value]) => ({ codigo, usos: value.usos, desconto: metricMoney(value.desconto), receita: metricMoney(value.receita) })).sort((a, b) => a.codigo.localeCompare(b.codigo)),
        },
        cashback: {
          creditos: metricMoney(credits),
          debitos: metricMoney(debits),
          saldoMovimentacao: metricMoney(credits.minus(debits)),
          saldoDisponivelAtual: metricMoney(decimalValue(balanceSums.cashbackSaldo ?? 0)),
          saldoPendenteAtual: metricMoney(decimalValue(balanceSums.cashbackPendente ?? 0)),
        },
        fidelidade: { snapshotAtual: true as const, porFaixa: ranges },
        serie: [...series.values()].map(value => ({ bucket: value.bucket, usosCupom: value.usosCupom, descontoCupom: metricMoney(value.descontoCupom), receitaCupom: metricMoney(value.receitaCupom), creditosCashback: metricMoney(value.creditosCashback), debitosCashback: metricMoney(value.debitosCashback) })),
      }
    },
  }
}

type FreightOrder = { frete: unknown; fretePrazo: number | null; transportadora: string | null; freteTipo: string | null; custoFreteReal: unknown; createdAt: Date }
type ShippingEvent = { valor: number | null; dados: unknown; createdAt: Date }

function shippingTier(dados: unknown): string {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return 'nao_informada'
  return safeShippingLabel((dados as Record<string, unknown>).shipping_tier, 'nao_informada')
}

const SAFE_SHIPPING_LABELS = new Set([
  'normal', 'expresso', 'expressa', 'economico', 'econômico', 'retirada', 'frete gratis', 'frete grátis',
  'correios', 'sedex', 'pac', 'braspress', 'jadlog', 'loggi', 'melhor envio', 'total express',
  'azul cargo', 'latam cargo', 'j&t express',
])

function safeShippingLabel(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim().slice(0, 200)
  return SAFE_SHIPPING_LABELS.has(trimmed.toLocaleLowerCase('pt-BR')) ? trimmed : 'outra'
}

export function createFreteMetric(options: StoreMetricOptions = {}): MetricDefinition<Record<string, unknown> & {
  selecoesTracked: { total: number; valorCarrinho: string; porOpcao: Array<{ opcao: string; selecoes: number; valorCarrinho: string }> }
  pedidosPagos: { resumo: { pedidos: number; freteCobrado: string; custoRealConhecido: string | null; prazoMedioDiasUteis: number | null }; porTransportadora: Array<{ transportadora: string; pedidos: number; freteCobrado: string; prazoMedioDiasUteis: number | null }>; porTipo: Array<{ tipo: string; pedidos: number; freteCobrado: string }> }
  serie: Array<{ bucket: string; selecoesTracked: number; pedidosPagos: number; freteCobrado: string; custoRealConhecido: string | null }>
  limitacoes: string
}> {
  return {
    slug: 'frete',
    scope: 'read:financeiro',
    schema: { type: 'object', required: ['timezone', 'periodo', 'definicoes', 'selecoesTracked', 'pedidosPagos', 'limitacoes'] },
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const [rawOrders, rawEvents] = await Promise.all([
        client.pedido.findMany({
          where: { createdAt: { gte: params.from, lt: params.toExclusive }, status: { in: STATUS_PAGO_TODOS } },
          select: { frete: true, fretePrazo: true, transportadora: true, freteTipo: true, custoFreteReal: true, createdAt: true },
        }),
        client.eventoTracking.findMany({
          where: { tipo: 'add_shipping_info', createdAt: { gte: params.from, lt: params.toExclusive } },
          select: { valor: true, dados: true, createdAt: true },
        }),
      ])
      const orders = rawOrders as unknown as FreightOrder[]
      const events = rawEvents as unknown as ShippingEvent[]
      let freight = decimalValue(0)
      let cost = decimalValue(0)
      let allCostKnown = true
      let prazoSum = 0
      let prazoCount = 0
      const carriers = new Map<string, { count: number; freight: ReturnType<typeof decimalValue>; prazoSum: number; prazoCount: number }>()
      const types = new Map<string, { count: number; freight: ReturnType<typeof decimalValue> }>()
      const series = new Map(listMetricBuckets(params).map(bucket => [bucket, { bucket, selections: 0, orders: 0, freight: decimalValue(0), cost: decimalValue(0), allCostKnown: true }]))
      for (const order of orders) {
        const charged = decimalValue(order.frete)
        freight = freight.plus(charged)
        const realCost = decimalOrNull(order.custoFreteReal)
        if (realCost === null) allCostKnown = false
        else cost = cost.plus(realCost)
        if (order.fretePrazo !== null) { prazoSum += order.fretePrazo; prazoCount += 1 }
        const carrierName = safeShippingLabel(order.transportadora, 'nao_informada')
        const carrier = carriers.get(carrierName) ?? { count: 0, freight: decimalValue(0), prazoSum: 0, prazoCount: 0 }
        carrier.count += 1
        carrier.freight = carrier.freight.plus(charged)
        if (order.fretePrazo !== null) { carrier.prazoSum += order.fretePrazo; carrier.prazoCount += 1 }
        carriers.set(carrierName, carrier)
        const typeName = safeShippingLabel(order.freteTipo, 'nao_informado')
        const type = types.get(typeName) ?? { count: 0, freight: decimalValue(0) }
        type.count += 1
        type.freight = type.freight.plus(charged)
        types.set(typeName, type)
        const bucket = series.get(bucketForInstant(order.createdAt, params.agrupar))!
        bucket.orders += 1
        bucket.freight = bucket.freight.plus(charged)
        if (realCost === null) bucket.allCostKnown = false
        else bucket.cost = bucket.cost.plus(realCost)
      }
      const selectionMap = new Map<string, { count: number; value: ReturnType<typeof decimalValue> }>()
      let selectionValue = decimalValue(0)
      for (const event of events) {
        const value = decimalValue(event.valor ?? 0)
        selectionValue = selectionValue.plus(value)
        const option = shippingTier(event.dados)
        const selected = selectionMap.get(option) ?? { count: 0, value: decimalValue(0) }
        selected.count += 1
        selected.value = selected.value.plus(value)
        selectionMap.set(option, selected)
        series.get(bucketForInstant(event.createdAt, params.agrupar))!.selections += 1
      }
      return {
        ...metricBase(params, {
          selecao: 'EventoTracking add_shipping_info consentido; valor representa o valor do carrinho no momento da seleção, não o preço isolado do frete.',
          pedidosPagos: 'Pedido pago criado no período; frete é valor cobrado, custoFreteReal é custo interno e null permanece desconhecido.',
          prazo: 'Média simples de Pedido.fretePrazo não nulo, em dias úteis.',
        }),
        selecoesTracked: {
          total: events.length,
          valorCarrinho: metricMoney(selectionValue),
          porOpcao: [...selectionMap].map(([opcao, value]) => ({ opcao, selecoes: value.count, valorCarrinho: metricMoney(value.value) })).sort((a, b) => a.opcao.localeCompare(b.opcao)),
        },
        pedidosPagos: {
          resumo: { pedidos: orders.length, freteCobrado: metricMoney(freight), custoRealConhecido: allCostKnown ? metricMoney(cost) : null, prazoMedioDiasUteis: prazoCount ? prazoSum / prazoCount : null },
          porTransportadora: [...carriers].map(([transportadora, value]) => ({ transportadora, pedidos: value.count, freteCobrado: metricMoney(value.freight), prazoMedioDiasUteis: value.prazoCount ? value.prazoSum / value.prazoCount : null })).sort((a, b) => a.transportadora.localeCompare(b.transportadora)),
          porTipo: [...types].map(([tipo, value]) => ({ tipo, pedidos: value.count, freteCobrado: metricMoney(value.freight) })).sort((a, b) => a.tipo.localeCompare(b.tipo)),
        },
        serie: [...series.values()].map(value => ({ bucket: value.bucket, selecoesTracked: value.selections, pedidosPagos: value.orders, freteCobrado: metricMoney(value.freight), custoRealConhecido: value.allCostKnown ? metricMoney(value.cost) : null })),
        limitacoes: 'As cotações ofertadas não são persistidas; esta métrica mede seleção tracked e o frete consolidado nos pedidos pagos.',
      }
    },
  }
}

type ReviewRow = { nota: number; aprovada: boolean; destaque: boolean; respostaEm: Date | null; createdAt: Date; produtoId: string; produto: { nome: string } }

export function createAvaliacoesMetric(options: StoreMetricOptions = {}): MetricDefinition<Record<string, unknown> & {
  resumo: { avaliacoes: number; aprovadas: number; pendentes: number; destaques: number; respondidas: number; mediaNota: number }
  porNota: Array<{ nota: number; avaliacoes: number }>
  porProduto: Array<{ produtoId: string; produto: string; avaliacoes: number; aprovadas: number; mediaNota: number }>
  serie: Array<{ bucket: string; avaliacoes: number; aprovadas: number; mediaNota: number }>
}> {
  return {
    slug: 'avaliacoes',
    scope: 'read:analytics',
    schema: { type: 'object', required: ['timezone', 'periodo', 'definicoes', 'resumo', 'porNota', 'porProduto'] },
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const rows = await client.avaliacao.findMany({
        where: { createdAt: { gte: params.from, lt: params.toExclusive } },
        select: { nota: true, aprovada: true, destaque: true, respostaEm: true, createdAt: true, produtoId: true, produto: { select: { nome: true } } },
      }) as unknown as ReviewRow[]
      const ratings = new Map<number, number>()
      const products = new Map<string, { produtoId: string; produto: string; count: number; approved: number; score: number }>()
      const series = new Map(listMetricBuckets(params).map(bucket => [bucket, { bucket, count: 0, approved: 0, score: 0 }]))
      for (const row of rows) {
        ratings.set(row.nota, (ratings.get(row.nota) ?? 0) + 1)
        const product = products.get(row.produtoId) ?? { produtoId: row.produtoId, produto: aggregateLabel(row.produto.nome, 'produto_sem_nome', true), count: 0, approved: 0, score: 0 }
        product.count += 1
        product.approved += row.aprovada ? 1 : 0
        product.score += row.nota
        products.set(row.produtoId, product)
        const bucket = series.get(bucketForInstant(row.createdAt, params.agrupar))!
        bucket.count += 1
        bucket.approved += row.aprovada ? 1 : 0
        bucket.score += row.nota
      }
      const score = rows.reduce((sum, row) => sum + row.nota, 0)
      return {
        ...metricBase(params, { periodo: 'Avaliação.createdAt no período BRT; nenhum nome, e-mail, comentário ou conteúdo de resposta é selecionado.', mediaNota: 'Σ(nota) ÷ quantidade de avaliações.' }),
        resumo: {
          avaliacoes: rows.length,
          aprovadas: rows.filter(row => row.aprovada).length,
          pendentes: rows.filter(row => !row.aprovada).length,
          destaques: rows.filter(row => row.destaque).length,
          respondidas: rows.filter(row => row.respostaEm !== null).length,
          mediaNota: rows.length ? score / rows.length : 0,
        },
        porNota: [...ratings].map(([nota, avaliacoes]) => ({ nota, avaliacoes })).sort((a, b) => a.nota - b.nota),
        porProduto: [...products.values()].map(product => ({ produtoId: product.produtoId, produto: product.produto, avaliacoes: product.count, aprovadas: product.approved, mediaNota: product.score / product.count })).sort((a, b) => a.produtoId.localeCompare(b.produtoId)),
        serie: [...series.values()].map(value => ({ bucket: value.bucket, avaliacoes: value.count, aprovadas: value.approved, mediaNota: value.count ? value.score / value.count : 0 })),
      }
    },
  }
}

type StockProduct = {
  ativo: boolean
  categoria: string
  estoque: number
  temVariacoes: boolean
  preco: unknown
  precoPromocional: unknown
  variacoes: Array<{ ativo: boolean; estoque: number; preco: unknown }>
}

export function createEstoqueCatalogoMetric(options: StoreMetricOptions = {}): MetricDefinition<Record<string, unknown> & {
  resumo: { produtos: number; ativos: number; inativos: number; semEstoque: number; estoqueCritico: number; unidadesDisponiveis: number; valorVendaEstoque: string }
  porCategoria: Array<{ categoria: string; produtos: number; ativos: number; unidadesDisponiveis: number; valorVendaEstoque: string }>
}> {
  return {
    slug: 'estoque-catalogo',
    scope: 'read:analytics',
    schema: { type: 'object', required: ['timezone', 'periodo', 'definicoes', 'resumo', 'porCategoria'] },
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const products = await client.produto.findMany({
        select: { ativo: true, categoria: true, estoque: true, temVariacoes: true, preco: true, precoPromocional: true, variacoes: { select: { ativo: true, estoque: true, preco: true } } },
      }) as unknown as StockProduct[]
      const categories = new Map<string, { products: number; active: number; units: number; value: ReturnType<typeof decimalValue> }>()
      let active = 0
      let units = 0
      let saleValue = decimalValue(0)
      let outOfStock = 0
      let critical = 0
      for (const product of products) {
        const categoryName = aggregateLabel(product.categoria, 'sem_categoria', true)
        const category = categories.get(categoryName) ?? { products: 0, active: 0, units: 0, value: decimalValue(0) }
        category.products += 1
        if (product.ativo) {
          active += 1
          category.active += 1
          const basePrice = decimalOrNull(product.precoPromocional) ?? decimalValue(product.preco)
          let productUnits = 0
          let productValue = decimalValue(0)
          if (product.temVariacoes) {
            for (const variation of product.variacoes.filter(item => item.ativo)) {
              productUnits += variation.estoque
              productValue = productValue.plus((decimalOrNull(variation.preco) ?? basePrice).mul(variation.estoque))
            }
          } else {
            productUnits = product.estoque
            productValue = basePrice.mul(product.estoque)
          }
          units += productUnits
          saleValue = saleValue.plus(productValue)
          category.units += productUnits
          category.value = category.value.plus(productValue)
          if (productUnits === 0) outOfStock += 1
          else if (productUnits <= 5) critical += 1
        }
        categories.set(categoryName, category)
      }
      return {
        ...metricBase(params, {
          snapshot: 'Snapshot atual do catálogo; de/ate/agrupar mantêm contrato uniforme, mas estoque não possui série histórica.',
          unidades: 'Produto sem variação usa Produto.estoque; produto com variações soma apenas VariacaoProduto ativa, sem duplicar Produto.estoque.',
          valorVendaEstoque: 'Σ(unidades × preço efetivo); preço da variação prevalece, senão promocional do produto, senão preço cheio. Não usa custo interno.',
          estoqueCritico: 'Produto ativo com 1 a 5 unidades; sem estoque é contado separadamente.',
        }),
        resumo: { produtos: products.length, ativos: active, inativos: products.length - active, semEstoque: outOfStock, estoqueCritico: critical, unidadesDisponiveis: units, valorVendaEstoque: metricMoney(saleValue) },
        porCategoria: [...categories].map(([categoria, value]) => ({ categoria, produtos: value.products, ativos: value.active, unidadesDisponiveis: value.units, valorVendaEstoque: metricMoney(value.value) })).sort((a, b) => a.categoria.localeCompare(b.categoria)),
      }
    },
  }
}
