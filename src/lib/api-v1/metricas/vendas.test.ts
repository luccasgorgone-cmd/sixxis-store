import { Prisma } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import type { ApiContext } from '../types'
import { parseMetricParams } from './tempo'
import { createVendasMetric } from './vendas'

const D = (value: string) => new Prisma.Decimal(value)
const context = { requestId: 'req-metricas', identity: null, ip: '127.0.0.1', startedAt: 0, rateLimit: { success: true, limit: 600, remaining: 599, reset: 0 } } satisfies ApiContext
const params = parseMetricParams(new URLSearchParams({ de: '2026-11-16', ate: '2026-11-16', agrupar: 'dia' }))

function saleRows() {
  return [
    {
      id: 'pedido-1', clienteId: 'cliente-1', status: 'pago', total: D('100'), createdAt: new Date('2026-11-16T12:00:00Z'),
      mpTaxaReal: D('5'), custoFreteReal: D('10'), gclid: 'pedido-gclid', gbraid: null, wbraid: null, fbc: null,
      itens: [{ id: 'item-1', produtoId: 'produto-1', quantidade: 2, precoUnitario: D('40'), custoUnitario: D('20'), variacaoId: 'var-1', variacaoNome: '220V', produto: { nome: 'Climatizador' } }],
      garantias: [
        { produtoId: 'produto-1', pedidoItemId: 'item-1', valorPago: D('5'), produto: { nome: 'Climatizador' } },
        { produtoId: 'produto-1', pedidoItemId: null, valorPago: D('5'), produto: { nome: 'Climatizador' } },
      ], pagamentos: [{ mpStatus: 'rejected', metodo: 'credit_card', valor: 10000 }, { mpStatus: 'approved', metodo: 'pix', valor: 10000 }],
      endereco: { estado: 'SP', cidade: 'Araçatuba' },
    },
    {
      id: 'pedido-2', clienteId: 'cliente-2', status: 'ENVIADO', total: D('200'), createdAt: new Date('2026-11-16T16:00:00Z'),
      mpTaxaReal: null, custoFreteReal: D('20'), gclid: null, gbraid: null, wbraid: null, fbc: 'fb.1.click',
      itens: [{ id: 'item-2', produtoId: 'produto-2', quantidade: 1, precoUnitario: D('200'), custoUnitario: D('100'), variacaoId: null, variacaoNome: null, produto: { nome: 'Bike' } }],
      garantias: [], pagamentos: [{ mpStatus: 'approved', metodo: 'credit_card', valor: 20000 }],
      endereco: { estado: 'RJ', cidade: 'Rio de Janeiro' },
    },
  ]
}

function metric(overrides: { orders?: ReturnType<typeof saleRows>; events?: unknown[] } = {}) {
  const pedidoFindMany = vi.fn().mockResolvedValue(overrides.orders ?? saleRows())
  const eventoFindMany = vi.fn().mockResolvedValue(overrides.events ?? [{
    sessaoId: 'sessao-1', dados: { transaction_id: 'pedido-1' },
    sessao: { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'pmax', gclid: 'session-gclid', gbraid: null, wbraid: null },
  }])
  const definition = createVendasMetric({ prisma: { pedido: { findMany: pedidoFindMany }, eventoTracking: { findMany: eventoFindMany } } as never })
  return { definition, pedidoFindMany, eventoFindMany }
}

describe('metricas/vendas', () => {
  it('applies the exact paid-order formulas and nulls aggregate profit when any known cost is missing', async () => {
    const { definition } = metric()

    const result = await definition.query(context, params)

    expect(result.resumo).toEqual({
      pedidosPagos: 2,
      receitaBruta: '290.00',
      receitaLiquidaComercial: '300.00',
      lucroLiquidoConhecido: null,
      pedidosComLucroConhecido: 1,
      pedidosComCustoPendente: 1,
      ticketMedio: '150.00',
    })
    expect(result.serie).toEqual([{ bucket: '2026-11-16', pedidosPagos: 2, receitaBruta: '290.00', receitaLiquidaComercial: '300.00', lucroLiquidoConhecido: null, ticketMedio: '150.00' }])
  })

  it('subtracts fee, real freight and item cost when every cost snapshot is known', async () => {
    const [known] = saleRows()
    const { definition } = metric({ orders: [known] })

    const result = await definition.query(context, params)

    expect(result.resumo.lucroLiquidoConhecido).toBe('45.00')
    expect(result.resumo.pedidosComCustoPendente).toBe(0)
  })

  it('returns every requested controlled breakdown without exposing raw click ids', async () => {
    const { definition, pedidoFindMany, eventoFindMany } = metric()

    const result = await definition.query(context, params)

    expect(result.porStatusPagamento).toEqual([
      { status: 'approved', pagamentos: 2, valor: '300.00' },
      { status: 'rejected', pagamentos: 1, valor: '100.00' },
    ])
    expect(result.porMetodoPagamento).toEqual([
      { metodo: 'credit_card', pagamentos: 1, valor: '200.00' },
      { metodo: 'pix', pagamentos: 1, valor: '100.00' },
    ])
    expect(result.porProduto).toEqual(expect.arrayContaining([
      { produtoId: 'produto-1', produto: 'Climatizador', quantidade: 2, receitaBruta: '90.00' },
      { produtoId: 'produto-2', produto: 'Bike', quantidade: 1, receitaBruta: '200.00' },
    ]))
    expect(result.porVariacao).toEqual(expect.arrayContaining([
      { produtoId: 'produto-1', variacaoId: 'var-1', variacao: '220V', quantidade: 2, receitaBruta: '85.00' },
      { produtoId: 'produto-1', variacaoId: null, variacao: 'garantia_nao_alocada', quantidade: 0, receitaBruta: '5.00' },
      { produtoId: 'produto-2', variacaoId: null, variacao: 'sem_variacao', quantidade: 1, receitaBruta: '200.00' },
    ]))
    expect(result.porUf).toEqual(expect.arrayContaining([{ uf: 'SP', pedidos: 1, receitaLiquidaComercial: '100.00' }]))
    expect(result.porCidade).toEqual(expect.arrayContaining([{ uf: 'RJ', cidade: 'Rio de Janeiro', pedidos: 1, receitaLiquidaComercial: '200.00' }]))
    expect(result.porAtribuicao).toEqual(expect.arrayContaining([
      { origem: 'google', meio: 'cpc', campanha: 'pmax', canalClickId: 'gclid', pedidos: 1, receitaLiquidaComercial: '100.00' },
      { origem: 'nao_atribuida', meio: 'nao_atribuido', campanha: 'nao_atribuida', canalClickId: 'fbc', pedidos: 1, receitaLiquidaComercial: '200.00' },
    ]))
    expect(JSON.stringify(result)).not.toContain('session-gclid')
    expect(JSON.stringify(result)).not.toContain('pedido-gclid')
    expect(result.porMetodoPagamento.reduce((sum, row) => sum + Number(row.valor), 0)).toBe(300)
    expect(result.porProduto.reduce((sum, row) => sum + Number(row.receitaBruta), 0)).toBe(Number(result.resumo.receitaBruta))
    expect(result.porVariacao.reduce((sum, row) => sum + Number(row.receitaBruta), 0)).toBe(Number(result.resumo.receitaBruta))

    const orderArgs = pedidoFindMany.mock.calls[0][0]
    expect(orderArgs.where.status.in).toContain('pago')
    expect(orderArgs.where.status.in).toContain('ENVIADO')
    expect(orderArgs.where.createdAt).toEqual({ gte: params.from, lt: params.toExclusive })
    expect(orderArgs.select).not.toHaveProperty('clientIp')
    expect(orderArgs.select.pagamentos.select).not.toHaveProperty('rawResponse')
    expect(eventoFindMany).toHaveBeenCalledTimes(1)
    expect(eventoFindMany.mock.calls[0][0].where).toEqual({ tipo: 'purchase', createdAt: { gte: params.from, lt: new Date('2026-11-24T03:00:00.000Z') } })
    expect(pedidoFindMany).toHaveBeenCalledTimes(1)
  })

  it('correlates purchase attribution by selected order ids across the BRT boundary', async () => {
    const rows = saleRows()
    const { definition, eventoFindMany } = metric({ orders: rows, events: [{
      sessaoId: 'late', dados: { transaction_id: 'pedido-1' },
      sessao: { utmSource: 'async', utmMedium: 'event', utmCampaign: 'boundary', gclid: null, gbraid: null, wbraid: null },
    }] })

    const result = await definition.query(context, params)

    expect(result.porAtribuicao).toContainEqual({ origem: 'async', meio: 'event', campanha: 'boundary', canalClickId: 'gclid', pedidos: 1, receitaLiquidaComercial: '100.00' })
    expect(eventoFindMany.mock.calls[0][0].where.createdAt).toEqual({ gte: params.from, lt: new Date('2026-11-24T03:00:00.000Z') })
  })

  it('uses one indexed attribution query even for more than 1000 paid orders', async () => {
    const template = saleRows()[0]
    const orders = Array.from({ length: 1001 }, (_, index) => ({ ...template, id: `pedido-${index}`, itens: [], garantias: [], pagamentos: [], total: D('1') }))
    let active = 0
    let peak = 0
    const eventoFindMany = vi.fn(async (args: unknown) => {
      void args
      active += 1
      peak = Math.max(peak, active)
      await Promise.resolve()
      active -= 1
      return []
    })
    const definition = createVendasMetric({ prisma: { pedido: { findMany: vi.fn().mockResolvedValue(orders) }, eventoTracking: { findMany: eventoFindMany } } as never })

    await definition.query(context, params)

    expect(eventoFindMany).toHaveBeenCalledTimes(1)
    expect(peak).toBe(1)
    expect((eventoFindMany.mock.calls[0][0] as { where: Record<string, unknown> }).where).not.toHaveProperty('OR')
  })

  it('includes explicit formulas, timezone and period in the payload', async () => {
    const { definition } = metric({ orders: [], events: [] })

    const result = await definition.query(context, params)

    expect(result.timezone).toBe('America/Sao_Paulo')
    expect(result.periodo).toEqual({ de: '2026-11-16', ate: '2026-11-16', agrupar: 'dia' })
    expect(result.definicoes.receitaBruta).toContain('precoUnitario')
    expect(result.definicoes.lucroLiquidoConhecido).toContain('null')
  })

  it('redacts PII accidentally entered in the free-form city field', async () => {
    const rows = saleRows()
    rows[1].endereco.cidade = 'victim@example.com'
    const { definition } = metric({ orders: rows })

    const result = await definition.query(context, params)

    expect(JSON.stringify(result)).not.toContain('victim@example.com')
    expect(result.porCidade.find(item => item.uf === 'RJ')?.cidade).toBe('v***@example.com')
  })
})
