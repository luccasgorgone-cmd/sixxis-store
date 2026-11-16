import { Prisma } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import type { ApiContext } from '../types'
import { createAvaliacoesMetric, createCarrinhosMetric, createCuponsCashbackFidelidadeMetric, createEstoqueCatalogoMetric, createFreteMetric } from './operacao'
import { parseMetricParams } from './tempo'

const D = (value: string) => new Prisma.Decimal(value)
const context = { requestId: 'req-operacao', identity: null, ip: '127.0.0.1', startedAt: 0, rateLimit: { success: true, limit: 600, remaining: 599, reset: 0 } } satisfies ApiContext
const params = parseMetricParams(new URLSearchParams({ de: '2026-11-16', ate: '2026-11-16', agrupar: 'dia' }))

describe('metricas/carrinhos', () => {
  it('derives persistent commercial abandonment and separates tracked checkout failures', async () => {
    const definition = createCarrinhosMetric({
      prisma: {
        carrinhoCliente: { findMany: vi.fn().mockResolvedValue([
          { status: 'ativo', etapaAtual: 4, valorTotal: 300, itens: [{ produtoId: 'p1' }], atualizadoEm: new Date('2026-11-16T15:00:00Z') },
          { status: 'ativo', etapaAtual: 2, valorTotal: 100, itens: [{ produtoId: 'p2' }], atualizadoEm: new Date('2026-11-16T17:30:00Z') },
          { status: 'convertido', etapaAtual: 5, valorTotal: 200, itens: [], atualizadoEm: new Date('2026-11-16T16:00:00Z') },
        ]) },
        eventoTracking: { findMany: vi.fn().mockResolvedValue([
          { sessaoId: 'tech', tipo: 'begin_checkout', dados: null, createdAt: new Date('2026-11-16T15:00:00Z') },
          { sessaoId: 'tech', tipo: 'checkout_payment_outcome', dados: { outcome: 'rejected' }, createdAt: new Date('2026-11-16T15:10:00Z') },
        ]), groupBy: vi.fn().mockResolvedValue([{ sessaoId: 'tech', _max: { createdAt: new Date('2026-11-16T15:10:00Z') } }]) },
      } as never,
      now: () => new Date('2026-11-16T18:00:00Z'),
    })

    const result = await definition.query(context, params)

    expect(result.persistentes.resumo).toEqual({ carrinhos: 3, ativos: 1, convertidos: 1, abandonadosComerciais: 1, valorTotal: '600.00', valorAbandonadoComercial: '300.00' })
    expect(result.persistentes.porEtapa).toEqual(expect.arrayContaining([{ etapa: 4, carrinhos: 1, valorTotal: '300.00' }]))
    expect(result.checkoutTracked.abandono).toEqual({ comercial: 0, tecnico: 1, emAndamento: 0 })
  })

  it('uses recent non-funnel activity to avoid false commercial abandonment', async () => {
    const eventoFindMany = vi.fn().mockResolvedValue([{ sessaoId: 'active', tipo: 'begin_checkout', dados: null, createdAt: new Date('2026-11-16T15:00:00Z') }])
    const groupBy = vi.fn().mockResolvedValue([{ sessaoId: 'active', _max: { createdAt: new Date('2026-11-16T17:30:00Z') } }])
    const definition = createCarrinhosMetric({ prisma: {
      carrinhoCliente: { findMany: vi.fn().mockResolvedValue([]) },
      eventoTracking: { findMany: eventoFindMany, groupBy },
    } as never, now: () => new Date('2026-11-16T18:00:00Z') })

    const result = await definition.query(context, params)

    expect(result.checkoutTracked.abandono).toEqual({ comercial: 0, tecnico: 0, emAndamento: 1 })
    expect(eventoFindMany.mock.calls[0][0].where.tipo.in).toContain('begin_checkout')
    expect(groupBy.mock.calls[0][0]).toMatchObject({ by: ['sessaoId'], _max: { createdAt: true } })
    expect(groupBy.mock.calls[0][0]).not.toHaveProperty('select')
    expect(eventoFindMany).toHaveBeenCalledTimes(1)
  })
})

describe('metricas/cupons-cashback-fidelidade', () => {
  it('aggregates coupon revenue, cashback movement/current balance and loyalty ranges', async () => {
    const definition = createCuponsCashbackFidelidadeMetric({ prisma: {
      cupomUso: { findMany: vi.fn().mockResolvedValue([
        { valorDesconto: 10, valorPedido: 100, usadoEm: new Date('2026-11-16T12:00:00Z'), cupom: { codigo: 'BEMVINDO' } },
        { valorDesconto: 20, valorPedido: 200, usadoEm: new Date('2026-11-16T13:00:00Z'), cupom: { codigo: 'BEMVINDO' } },
      ]) },
      cashbackTransacao: { findMany: vi.fn().mockResolvedValue([
        { tipo: 'credito', status: 'disponivel', valor: 30, createdAt: new Date('2026-11-16T12:00:00Z') },
        { tipo: 'debito', status: 'disponivel', valor: 5, createdAt: new Date('2026-11-16T13:00:00Z') },
        { tipo: 'credito', status: 'cancelado', valor: 99, createdAt: new Date('2026-11-16T14:00:00Z') },
      ]) },
      cliente: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { cashbackSaldo: 80, cashbackPendente: 15 } }),
        findMany: vi.fn().mockResolvedValue([{ totalGasto: 50 }, { totalGasto: 250 }, { totalGasto: 600 }]),
      },
      nivelFidelidade: { findMany: vi.fn().mockResolvedValue([
        { slug: 'bronze', nome: 'Bronze', gastoMin: 0, gastoMax: 199.99 },
        { slug: 'prata', nome: 'Prata', gastoMin: 200, gastoMax: 499.99 },
        { slug: 'ouro', nome: 'Ouro', gastoMin: 500, gastoMax: null },
      ]) },
    } as never })

    const result = await definition.query(context, params)

    expect(result.cupons.resumo).toEqual({ usos: 2, desconto: '30.00', receita: '300.00' })
    expect(result.cupons.porCupom).toEqual([{ codigo: 'BEMVINDO', usos: 2, desconto: '30.00', receita: '300.00' }])
    expect(result.cashback).toEqual({ creditos: '30.00', debitos: '5.00', saldoMovimentacao: '25.00', saldoDisponivelAtual: '80.00', saldoPendenteAtual: '15.00' })
    expect(result.fidelidade.porFaixa.map(item => [item.slug, item.clientes])).toEqual([['bronze', 1], ['prata', 1], ['ouro', 1]])
    expect(result.serie).toEqual([{ bucket: '2026-11-16', usosCupom: 2, descontoCupom: '30.00', receitaCupom: '300.00', creditosCashback: '30.00', debitosCashback: '5.00' }])
  })
})

describe('metricas/frete', () => {
  it('reports tracked shipping selection and persisted paid-order freight without inventing offered quotes', async () => {
    const pedidoFindMany = vi.fn().mockResolvedValue([
      { frete: D('25'), fretePrazo: 5, transportadora: 'Braspress', freteTipo: 'normal', custoFreteReal: D('20'), createdAt: new Date('2026-11-16T12:00:00Z') },
      { frete: D('0'), fretePrazo: 8, transportadora: 'Melhor Envio', freteTipo: 'normal', custoFreteReal: null, createdAt: new Date('2026-11-16T13:00:00Z') },
    ])
    const definition = createFreteMetric({ prisma: {
      pedido: { findMany: pedidoFindMany },
      eventoTracking: { findMany: vi.fn().mockResolvedValue([{ valor: 325, dados: { shipping_tier: 'Normal' }, createdAt: new Date('2026-11-16T11:00:00Z') }]) },
    } as never })

    const result = await definition.query(context, params)

    expect(result.selecoesTracked).toEqual({ total: 1, valorCarrinho: '325.00', porOpcao: [{ opcao: 'Normal', selecoes: 1, valorCarrinho: '325.00' }] })
    expect(result.pedidosPagos.resumo).toEqual({ pedidos: 2, freteCobrado: '25.00', custoRealConhecido: null, prazoMedioDiasUteis: 6.5 })
    expect(result.pedidosPagos.porTransportadora).toEqual(expect.arrayContaining([{ transportadora: 'Braspress', pedidos: 1, freteCobrado: '25.00', prazoMedioDiasUteis: 5 }]))
    expect(result.serie).toEqual([{ bucket: '2026-11-16', selecoesTracked: 1, pedidosPagos: 2, freteCobrado: '25.00', custoRealConhecido: null }])
    expect(result.limitacoes).toContain('cotações ofertadas não são persistidas')
    expect(pedidoFindMany.mock.calls[0][0].select).toEqual({ frete: true, fretePrazo: true, transportadora: true, freteTipo: true, custoFreteReal: true, createdAt: true })
  })

  it('keeps useful known labels but never emits PII from free-form shipping dimensions', async () => {
    const definition = createFreteMetric({ prisma: {
      pedido: { findMany: vi.fn().mockResolvedValue([
        { frete: D('10'), fretePrazo: 2, transportadora: 'Braspress', freteTipo: 'normal', custoFreteReal: D('8'), createdAt: new Date('2026-11-16T12:00:00Z') },
        { frete: D('20'), fretePrazo: 3, transportadora: 'Luccas Gorgone victim@example.com 11999998888', freteTipo: 'Maria Silva maria@example.com 11988887777', custoFreteReal: D('15'), createdAt: new Date('2026-11-16T13:00:00Z') },
      ]) },
      eventoTracking: { findMany: vi.fn().mockResolvedValue([
        { valor: 100, dados: { shipping_tier: 'Normal' }, createdAt: new Date('2026-11-16T11:00:00Z') },
        { valor: 200, dados: { shipping_tier: 'Maria Silva maria@example.com 11988887777' }, createdAt: new Date('2026-11-16T11:30:00Z') },
      ]) },
    } as never })

    const result = await definition.query(context, params)
    const serialized = JSON.stringify(result)

    expect(serialized).toContain('Braspress')
    expect(serialized).toContain('Normal')
    expect(serialized).not.toContain('Luccas')
    expect(serialized).not.toContain('Maria')
    expect(serialized).not.toContain('example.com')
    expect(serialized).not.toContain('11999998888')
    expect(serialized).not.toContain('11988887777')
  })
})

describe('metricas/avaliacoes', () => {
  it('breaks reviews down by rating and product with approval/response totals', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { nota: 5, aprovada: true, destaque: true, respostaEm: new Date('2026-11-16T15:00:00Z'), createdAt: new Date('2026-11-16T12:00:00Z'), produtoId: 'p1', produto: { nome: 'Climatizador' } },
      { nota: 3, aprovada: false, destaque: false, respostaEm: null, createdAt: new Date('2026-11-16T13:00:00Z'), produtoId: 'p1', produto: { nome: 'Climatizador' } },
    ])
    const definition = createAvaliacoesMetric({ prisma: { avaliacao: { findMany } } as never })

    const result = await definition.query(context, params)

    expect(result.resumo).toEqual({ avaliacoes: 2, aprovadas: 1, pendentes: 1, destaques: 1, respondidas: 1, mediaNota: 4 })
    expect(result.porNota).toEqual([{ nota: 3, avaliacoes: 1 }, { nota: 5, avaliacoes: 1 }])
    expect(result.porProduto).toEqual([{ produtoId: 'p1', produto: 'Climatizador', avaliacoes: 2, aprovadas: 1, mediaNota: 4 }])
    expect(result.serie).toEqual([{ bucket: '2026-11-16', avaliacoes: 2, aprovadas: 1, mediaNota: 4 }])
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty('resposta')
    expect(findMany.mock.calls[0][0].select.respostaEm).toBe(true)
  })
})

describe('metricas/estoque-catalogo', () => {
  it('uses active variation stock and effective prices without double-counting product stock', async () => {
    const definition = createEstoqueCatalogoMetric({ prisma: { produto: { findMany: vi.fn().mockResolvedValue([
      { ativo: true, categoria: 'climatizadores', estoque: 99, temVariacoes: true, preco: D('100'), precoPromocional: D('90'), variacoes: [{ ativo: true, estoque: 2, preco: null }, { ativo: true, estoque: 1, preco: D('110') }, { ativo: false, estoque: 50, preco: D('1') }] },
      { ativo: false, categoria: 'spinning', estoque: 4, temVariacoes: false, preco: D('200'), precoPromocional: null, variacoes: [] },
      { ativo: true, categoria: 'aspiradores', estoque: 0, temVariacoes: false, preco: D('50'), precoPromocional: null, variacoes: [] },
    ]) } } as never })

    const result = await definition.query(context, params)

    expect(result.resumo).toEqual({ produtos: 3, ativos: 2, inativos: 1, semEstoque: 1, estoqueCritico: 1, unidadesDisponiveis: 3, valorVendaEstoque: '290.00' })
    expect(result.porCategoria).toEqual(expect.arrayContaining([{ categoria: 'climatizadores', produtos: 1, ativos: 1, unidadesDisponiveis: 3, valorVendaEstoque: '290.00' }]))
  })
})
