import type { Prisma, PrismaClient } from '@prisma/client'
import { z } from 'zod'
import type { ResourceDefinition } from '../resource'
import type { ApiContext } from '../types'
import { hasScope } from '../auth'
import { maskName } from '../redact'
import { amount, safeRecord, timestamp, type ResourceResolver, type ResourceRow } from './shared'
import { money } from '../format'
import { STATUS_PAGO_TODOS, STATUS_PENDENTE_TODOS, STATUS_CANCELADO_TODOS } from '../../pedido-status'

const orderStatuses = [...STATUS_PAGO_TODOS, ...STATUS_PENDENTE_TODOS, ...STATUS_CANCELADO_TODOS]
const cartPublicJsonFields = { itens: ['nome'] } as const
// Contracts mirror the persisted application shapes, not arbitrary JsonValue objects.
const warrantyClaimSchema = z.array(z.object({ data: z.string(), descricao: z.string(), autor: z.string().optional() }))
const persistedCartItemsSchema = z.array(z.object({
  produtoId: z.string(), slug: z.string().optional(), nome: z.string(), variacao: z.string().nullable().optional(),
  qtd: z.number().int().positive(), preco: z.number().nonnegative(),
}))
function warrantyClaims(value: unknown, ctx: ApiContext): ResourceRow[] | null {
  if (value === null) return null
  const parsed = warrantyClaimSchema.safeParse(value)
  if (!parsed.success) throw new TypeError('Invalid warranty claims JSON')
  return parsed.data.map(claim => {
    const date = new Date(claim.data)
    const record: ResourceRow = {
      data: Number.isFinite(date.getTime()) ? timestamp(date) : null,
      // Warranty operational notes are not conversations/campaign message content.
      descricao: claim.descricao,
    }
    if (claim.autor !== undefined) record.autor = ctx.identity && hasScope(ctx.identity, 'read:pii') ? claim.autor : maskName(claim.autor)
    return safeRecord(record, ctx)
  })
}
function persistedCartItems(value: unknown): ResourceRow[] {
  const parsed = persistedCartItemsSchema.safeParse(value)
  if (!parsed.success) throw new TypeError('Invalid persisted cart items JSON')
  return parsed.data.map(item => {
    const record: ResourceRow = {
      produtoId: item.produtoId,
      nome: item.nome,
      variacao: item.variacao ?? null,
      qtd: item.qtd,
      preco: amount(item.preco),
    }
    if (item.slug !== undefined) record.slug = item.slug
    return record
  })
}

export type CommerceResourceOptions = { prisma?: Pick<PrismaClient, 'pedido' | 'garantiaEstendida' | 'pagamento' | 'tentativaMultiMetodo' | 'itemPedido' | 'carrinho' | 'itemCarrinho' | 'cupom' | 'cupomUso' | 'carrinhoCliente'>; resolve?: ResourceResolver }

export function createCommerceResources(deps: CommerceResourceOptions = {}): ResourceDefinition[] {
  const resolve: ResourceResolver = slug => {
    const definition = definitions.find(item => item.slug === slug) ?? deps.resolve?.(slug)
    if (!definition) throw new TypeError(`Unregistered expansion resource: ${slug}`)
    return definition
  }
  const definitions: ResourceDefinition[] = [
    {
      slug: 'pedidos', model: 'Pedido', scope: 'read:pedidos',
      scalarFields: ['id', 'clienteId', 'status', 'total', 'frete', 'formaPagamento', 'mpPaymentId', 'enderecoId', 'erpPedidoId', 'createdAt', 'pagoEm', 'codigoRastreio', 'cupomCodigo', 'desconto', 'cashbackUsado', 'freteTipo', 'fretePrazo', 'transportadora', 'linkRastreio', 'notaFiscal', 'dataNotaFiscal', 'nfeRef', 'nfeChave', 'nfeStatus', 'nfeNumero', 'nfeSerie', 'nfeDanfeUrl', 'nfeXmlUrl', 'nfeMensagemErro', 'nfeAmbiente', 'crmSincronizadoEm', 'crmLeadId', 'custoFreteReal', 'mpTaxaReal', 'enviadoEm', 'entregueEm', 'canceladoEm', 'canceladoMotivo', 'fbp', 'fbc', 'clientIp', 'clientUserAgent', 'capiPurchaseEnviadoEm', 'gaClientId', 'gaSessionId', 'gclid', 'gbraid', 'wbraid', 'ga4PurchaseEnviadoEm', 'multiMetodoStatus', 'mpOrderId', 'updatedAt'],
      select: { id: true, clienteId: true, status: true, total: true, frete: true, formaPagamento: true, mpPaymentId: true, enderecoId: true, erpPedidoId: true, createdAt: true, pagoEm: true, codigoRastreio: true, cupomCodigo: true, desconto: true, cashbackUsado: true, freteTipo: true, fretePrazo: true, transportadora: true, linkRastreio: true, notaFiscal: true, dataNotaFiscal: true, nfeRef: true, nfeChave: true, nfeStatus: true, nfeNumero: true, nfeSerie: true, nfeDanfeUrl: true, nfeXmlUrl: true, nfeMensagemErro: true, nfeAmbiente: true, crmSincronizadoEm: true, crmLeadId: true, custoFreteReal: true, mpTaxaReal: true, enviadoEm: true, entregueEm: true, canceladoEm: true, canceladoMotivo: true, fbp: true, fbc: true, clientIp: true, clientUserAgent: true, capiPurchaseEnviadoEm: true, gaClientId: true, gaSessionId: true, gclid: true, gbraid: true, wbraid: true, ga4PurchaseEnviadoEm: true, multiMetodoStatus: true, mpOrderId: true, updatedAt: true } as const satisfies Prisma.PedidoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string' },
        { name: 'status', type: 'string', enum: orderStatuses, description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'total', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'frete', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'formaPagamento', type: 'string', enum: ['pix', 'credit_card', 'debit_card', 'boleto', 'dois_cartoes', 'pix_mais_cartao', 'cashback', 'cartao', 'credito', 'debito', 'mercado_pago'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'mpPaymentId', type: 'string', nullable: true },
        { name: 'enderecoId', type: 'string' },
        { name: 'erpPedidoId', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'pagoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'codigoRastreio', type: 'string', nullable: true },
        { name: 'cupomCodigo', type: 'string', nullable: true },
        { name: 'desconto', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'cashbackUsado', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'freteTipo', type: 'string', nullable: true, enum: ['normal', 'expresso', 'a_combinar'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'fretePrazo', type: 'integer', nullable: true },
        { name: 'transportadora', type: 'string', nullable: true },
        { name: 'linkRastreio', type: 'string', nullable: true },
        { name: 'notaFiscal', type: 'string', nullable: true },
        { name: 'dataNotaFiscal', type: 'string', nullable: true, format: 'date-time' },
        { name: 'nfeRef', type: 'string', nullable: true },
        { name: 'nfeChave', type: 'string', nullable: true },
        { name: 'nfeStatus', type: 'string', nullable: true, enum: ['autorizado', 'erro', 'processando', 'cancelado'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'nfeNumero', type: 'integer', nullable: true },
        { name: 'nfeSerie', type: 'integer', nullable: true },
        { name: 'nfeDanfeUrl', type: 'string', nullable: true },
        { name: 'nfeXmlUrl', type: 'string', nullable: true },
        { name: 'nfeMensagemErro', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'nfeAmbiente', type: 'string', nullable: true, enum: ['homologacao', 'producao'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'crmSincronizadoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'crmLeadId', type: 'string', nullable: true },
        { name: 'custoFreteReal', type: 'string', nullable: true, format: 'decimal', description: 'Valor monetário em BRL.', scope: 'read:financeiro' },
        { name: 'mpTaxaReal', type: 'string', nullable: true, format: 'decimal', description: 'Valor monetário em BRL.', scope: 'read:financeiro' },
        { name: 'enviadoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'entregueEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'canceladoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'canceladoMotivo', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'fbp', type: 'string', nullable: true },
        { name: 'fbc', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'clientIp', type: 'string', nullable: true },
        { name: 'clientUserAgent', type: 'string', nullable: true },
        { name: 'capiPurchaseEnviadoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'gaClientId', type: 'string', nullable: true },
        { name: 'gaSessionId', type: 'string', nullable: true },
        { name: 'gclid', type: 'string', nullable: true },
        { name: 'gbraid', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'wbraid', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'ga4PurchaseEnviadoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'multiMetodoStatus', type: 'string', nullable: true, enum: ['aguardando_pix', 'aguardando_pagamento_restante', 'falhou', 'cancelado'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'mpOrderId', type: 'string', nullable: true },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
        { name: 'endereco', many: false, resource: () => resolve('enderecos') },
        { name: 'itens', many: true, resource: () => resolve('itens-pedido') },
        { name: 'pagamentos', many: true, resource: () => resolve('pagamentos') },
        { name: 'garantias', many: true, resource: () => resolve('garantias-estendidas') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        pedidoId: { type: 'string', field: 'id' },
        clienteId: { type: 'string' },
        enderecoId: { type: 'string' },
        erpPedidoId: { type: 'string' },
        status: { type: 'string', values: orderStatuses },
        formaPagamento: { type: 'string', values: ['pix', 'credit_card', 'debit_card', 'boleto', 'dois_cartoes', 'pix_mais_cartao', 'cashback', 'cartao', 'credito', 'debito', 'mercado_pago'] },
        mpPaymentId: { type: 'string' },
        multiMetodoStatus: { type: 'string', values: ['aguardando_pix', 'aguardando_pagamento_restante', 'falhou', 'cancelado'] },
        nfeStatus: { type: 'string', values: ['autorizado', 'erro', 'processando', 'cancelado'] },
        nfeAmbiente: { type: 'string', values: ['homologacao', 'producao'] },
        cupom: { type: 'string', field: 'cupomCodigo' },
        cupomCodigo: { type: 'string' },
        uf: { type: 'string', field: 'endereco.estado' },
        cidade: { type: 'string', field: 'endereco.cidade' },
        produtoId: { type: 'string', field: 'itens.some.produtoId' },
        variacaoId: { type: 'string', field: 'itens.some.variacaoId' },
        pagamentoStatus: { type: 'string', field: 'pagamentos.some.mpStatus' },
        metodo: { type: 'string', field: 'pagamentos.some.metodo' },
        gclid: { type: 'string', scope: 'read:pii' },
        gbraid: { type: 'string', scope: 'read:pii' },
        wbraid: { type: 'string', scope: 'read:pii' },
        fbc: { type: 'string', scope: 'read:pii' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.pedido.findMany(args as Prisma.PedidoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.pedido.findFirst(args as Prisma.PedidoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          clienteId: row.clienteId,
          status: row.status,
          total: amount(row.total),
          frete: amount(row.frete),
          formaPagamento: row.formaPagamento,
          mpPaymentId: row.mpPaymentId,
          enderecoId: row.enderecoId,
          erpPedidoId: row.erpPedidoId,
          createdAt: timestamp(row.createdAt),
          pagoEm: timestamp(row.pagoEm),
          codigoRastreio: row.codigoRastreio,
          cupomCodigo: row.cupomCodigo,
          desconto: amount(row.desconto),
          cashbackUsado: amount(row.cashbackUsado),
          freteTipo: row.freteTipo,
          fretePrazo: row.fretePrazo,
          transportadora: row.transportadora,
          linkRastreio: row.linkRastreio,
          notaFiscal: row.notaFiscal,
          dataNotaFiscal: timestamp(row.dataNotaFiscal),
          nfeRef: row.nfeRef,
          nfeChave: row.nfeChave,
          nfeStatus: row.nfeStatus,
          nfeNumero: row.nfeNumero,
          nfeSerie: row.nfeSerie,
          nfeDanfeUrl: row.nfeDanfeUrl,
          nfeXmlUrl: row.nfeXmlUrl,
          nfeMensagemErro: row.nfeMensagemErro,
          nfeAmbiente: row.nfeAmbiente,
          crmSincronizadoEm: timestamp(row.crmSincronizadoEm),
          crmLeadId: row.crmLeadId,
          custoFreteReal: amount(row.custoFreteReal),
          mpTaxaReal: amount(row.mpTaxaReal),
          enviadoEm: timestamp(row.enviadoEm),
          entregueEm: timestamp(row.entregueEm),
          canceladoEm: timestamp(row.canceladoEm),
          canceladoMotivo: row.canceladoMotivo,
          fbp: row.fbp,
          fbc: row.fbc,
          clientIp: row.clientIp,
          clientUserAgent: row.clientUserAgent,
          capiPurchaseEnviadoEm: timestamp(row.capiPurchaseEnviadoEm),
          gaClientId: row.gaClientId,
          gaSessionId: row.gaSessionId,
          gclid: row.gclid,
          gbraid: row.gbraid,
          wbraid: row.wbraid,
          ga4PurchaseEnviadoEm: timestamp(row.ga4PurchaseEnviadoEm),
          multiMetodoStatus: row.multiMetodoStatus,
          mpOrderId: row.mpOrderId,
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], ['custoFreteReal', 'mpTaxaReal'], ['clientUserAgent', 'gaClientId', 'gaSessionId', 'nfeChave', 'nfeDanfeUrl', 'nfeXmlUrl'])
      },
    },
    {
      slug: 'garantias-estendidas', model: 'GarantiaEstendida', scope: 'read:pedidos',
      scalarFields: ['id', 'pedidoId', 'pedidoItemId', 'produtoId', 'mesesAdicionais', 'valorPago', 'inicioVigencia', 'fimVigencia', 'status', 'acionamentos', 'createdAt', 'updatedAt'],
      select: { id: true, pedidoId: true, pedidoItemId: true, produtoId: true, mesesAdicionais: true, valorPago: true, inicioVigencia: true, fimVigencia: true, status: true, acionamentos: true, createdAt: true, updatedAt: true } as const satisfies Prisma.GarantiaEstendidaSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'pedidoId', type: 'string' },
        { name: 'pedidoItemId', type: 'string', nullable: true },
        { name: 'produtoId', type: 'string' },
        { name: 'mesesAdicionais', type: 'integer' },
        { name: 'valorPago', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'inicioVigencia', type: 'string', format: 'date-time' },
        { name: 'fimVigencia', type: 'string', format: 'date-time' },
        { name: 'status', type: 'string', enum: ['ativa', 'acionada', 'expirada', 'cancelada'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'acionamentos', type: 'array', nullable: true, items: { type: 'object', properties: { data: { type: 'string', format: 'date-time', nullable: true }, descricao: { type: 'string' }, autor: { type: 'string' } }, required: ['data', 'descricao'] } },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'pedido', many: false, resource: () => resolve('pedidos') },
        { name: 'produto', many: false, resource: () => resolve('produtos') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        pedidoId: { type: 'string' },
        pedidoItemId: { type: 'string' },
        produtoId: { type: 'string' },
        status: { type: 'string', values: ['ativa', 'acionada', 'expirada', 'cancelada'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.garantiaEstendida.findMany(args as Prisma.GarantiaEstendidaFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.garantiaEstendida.findFirst(args as Prisma.GarantiaEstendidaFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          pedidoId: row.pedidoId,
          pedidoItemId: row.pedidoItemId,
          produtoId: row.produtoId,
          mesesAdicionais: row.mesesAdicionais,
          valorPago: amount(row.valorPago),
          inicioVigencia: timestamp(row.inicioVigencia),
          fimVigencia: timestamp(row.fimVigencia),
          status: row.status,
          acionamentos: warrantyClaims(row.acionamentos, ctx),
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'pagamentos', model: 'Pagamento', scope: 'read:pedidos',
      scalarFields: ['id', 'pedidoId', 'mpPaymentId', 'mpPreferenceId', 'mpStatus', 'mpStatusDetail', 'metodo', 'valor', 'pixExpiraEm', 'parcelas', 'bandeira', 'ultimosDigitos', 'payerEmail', 'payerCpf', 'payerNome', 'createdAt', 'updatedAt', 'aprovadoEm', 'rejeitadoEm', 'tentativaMultiMetodoId', 'perna', 'estornoStatus', 'estornoTentativas', 'estornoErro'],
      select: { id: true, pedidoId: true, mpPaymentId: true, mpPreferenceId: true, mpStatus: true, mpStatusDetail: true, metodo: true, valor: true, pixExpiraEm: true, parcelas: true, bandeira: true, ultimosDigitos: true, payerEmail: true, payerCpf: true, payerNome: true, createdAt: true, updatedAt: true, aprovadoEm: true, rejeitadoEm: true, tentativaMultiMetodoId: true, perna: true, estornoStatus: true, estornoTentativas: true, estornoErro: true } as const satisfies Prisma.PagamentoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'pedidoId', type: 'string' },
        { name: 'mpPaymentId', type: 'string', nullable: true },
        { name: 'mpPreferenceId', type: 'string', nullable: true },
        { name: 'mpStatus', type: 'string', enum: ['pending', 'pending_waiting_transfer', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'mpStatusDetail', type: 'string', nullable: true },
        { name: 'metodo', type: 'string', enum: ['pix', 'credit_card', 'debit_card', 'boleto', 'account_money'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'valor', type: 'string', format: 'decimal', description: 'Valor em BRL; armazenado em centavos e convertido na resposta.' },
        { name: 'pixExpiraEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'parcelas', type: 'integer', nullable: true },
        { name: 'bandeira', type: 'string', nullable: true },
        { name: 'ultimosDigitos', type: 'string', nullable: true },
        { name: 'payerEmail', type: 'string', nullable: true },
        { name: 'payerCpf', type: 'string', nullable: true },
        { name: 'payerNome', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
        { name: 'aprovadoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'rejeitadoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'tentativaMultiMetodoId', type: 'string', nullable: true },
        { name: 'perna', type: 'string', nullable: true, enum: ['A', 'B', 'pix', 'restante'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'estornoStatus', type: 'string', nullable: true, enum: ['nao_aplicavel', 'pendente', 'estornado', 'cancelado', 'falhou_estorno'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'estornoTentativas', type: 'integer' },
        { name: 'estornoErro', type: 'string', nullable: true, scope: 'read:pii' },
      ],
      expands: [
        { name: 'pedido', many: false, resource: () => resolve('pedidos') },
        { name: 'tentativaMultiMetodo', many: false, resource: () => resolve('tentativas-multimetodo') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      filters: {
        pedidoId: { type: 'string' },
        mpPaymentId: { type: 'string' },
        mpStatus: { type: 'string', values: ['pending', 'pending_waiting_transfer', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'] },
        metodo: { type: 'string', values: ['pix', 'credit_card', 'debit_card', 'boleto', 'account_money'] },
        tentativaMultiMetodoId: { type: 'string' },
        perna: { type: 'string', values: ['A', 'B', 'pix', 'restante'] },
        estornoStatus: { type: 'string', values: ['nao_aplicavel', 'pendente', 'estornado', 'cancelado', 'falhou_estorno'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.pagamento.findMany(args as Prisma.PagamentoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.pagamento.findFirst(args as Prisma.PagamentoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          pedidoId: row.pedidoId,
          mpPaymentId: row.mpPaymentId,
          mpPreferenceId: row.mpPreferenceId,
          mpStatus: row.mpStatus,
          mpStatusDetail: row.mpStatusDetail,
          metodo: row.metodo,
          valor: money(row.valor as number, true),
          pixExpiraEm: timestamp(row.pixExpiraEm),
          parcelas: row.parcelas,
          bandeira: row.bandeira,
          ultimosDigitos: row.ultimosDigitos,
          payerEmail: row.payerEmail,
          payerCpf: row.payerCpf,
          payerNome: row.payerNome,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
          aprovadoEm: timestamp(row.aprovadoEm),
          rejeitadoEm: timestamp(row.rejeitadoEm),
          tentativaMultiMetodoId: row.tentativaMultiMetodoId,
          perna: row.perna,
          estornoStatus: row.estornoStatus,
          estornoTentativas: row.estornoTentativas,
          estornoErro: row.estornoErro,
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'tentativas-multimetodo', model: 'TentativaMultiMetodo', scope: 'read:pedidos',
      scalarFields: ['id', 'pedidoId', 'tipo', 'status', 'totalCentavos', 'prazoExpiracao', 'erro', 'detalhe', 'createdAt', 'updatedAt'],
      select: { id: true, pedidoId: true, tipo: true, status: true, totalCentavos: true, prazoExpiracao: true, erro: true, detalhe: true, createdAt: true, updatedAt: true } as const satisfies Prisma.TentativaMultiMetodoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'pedidoId', type: 'string' },
        { name: 'tipo', type: 'string', enum: ['dois_cartoes', 'pix_mais_cartao'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'status', type: 'string', enum: ['em_andamento', 'aguardando_confirmacao', 'aguardando_pix', 'aguardando_pagamento_restante', 'pago', 'falhou', 'cancelado'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'totalCentavos', type: 'integer', description: 'Total inteiro em centavos (não BRL); unidade explícita no nome.' },
        { name: 'prazoExpiracao', type: 'string', nullable: true, format: 'date-time' },
        { name: 'erro', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'detalhe', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'pedido', many: false, resource: () => resolve('pedidos') },
        { name: 'pagamentos', many: true, resource: () => resolve('pagamentos') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      filters: {
        pedidoId: { type: 'string' },
        tipo: { type: 'string', values: ['dois_cartoes', 'pix_mais_cartao'] },
        status: { type: 'string', values: ['em_andamento', 'aguardando_confirmacao', 'aguardando_pix', 'aguardando_pagamento_restante', 'pago', 'falhou', 'cancelado'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.tentativaMultiMetodo.findMany(args as Prisma.TentativaMultiMetodoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.tentativaMultiMetodo.findFirst(args as Prisma.TentativaMultiMetodoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          pedidoId: row.pedidoId,
          tipo: row.tipo,
          status: row.status,
          totalCentavos: row.totalCentavos,
          prazoExpiracao: timestamp(row.prazoExpiracao),
          erro: row.erro,
          detalhe: row.detalhe,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'itens-pedido', model: 'ItemPedido', scope: 'read:pedidos',
      scalarFields: ['id', 'pedidoId', 'produtoId', 'quantidade', 'precoUnitario', 'custoUnitario', 'variacaoId', 'variacaoNome', 'createdAt', 'updatedAt'],
      publicFields: ['variacaoNome'],
      select: { id: true, pedidoId: true, produtoId: true, quantidade: true, precoUnitario: true, custoUnitario: true, variacaoId: true, variacaoNome: true, createdAt: true, updatedAt: true } as const satisfies Prisma.ItemPedidoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'pedidoId', type: 'string' },
        { name: 'produtoId', type: 'string' },
        { name: 'quantidade', type: 'integer' },
        { name: 'precoUnitario', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'custoUnitario', type: 'string', nullable: true, format: 'decimal', description: 'Valor monetário em BRL.', scope: 'read:financeiro' },
        { name: 'variacaoId', type: 'string', nullable: true },
        { name: 'variacaoNome', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'pedido', many: false, resource: () => resolve('pedidos') },
        { name: 'produto', many: false, resource: () => resolve('produtos') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        pedidoId: { type: 'string' },
        produtoId: { type: 'string' },
        variacaoId: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.itemPedido.findMany(args as Prisma.ItemPedidoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.itemPedido.findFirst(args as Prisma.ItemPedidoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          pedidoId: row.pedidoId,
          produtoId: row.produtoId,
          quantidade: row.quantidade,
          precoUnitario: amount(row.precoUnitario),
          custoUnitario: amount(row.custoUnitario),
          variacaoId: row.variacaoId,
          variacaoNome: row.variacaoNome,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, ['variacaoNome'], ['custoUnitario'], [])
      },
    },
    {
      slug: 'carrinhos', model: 'Carrinho', scope: 'read:pedidos',
      scalarFields: ['id', 'clienteId', 'sessionId', 'createdAt'],
      select: { id: true, clienteId: true, sessionId: true, createdAt: true } as const satisfies Prisma.CarrinhoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string', nullable: true },
        { name: 'sessionId', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
        { name: 'itens', many: true, resource: () => resolve('itens-carrinho') },
      ],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt',
      dateFields: { created: 'createdAt' },
      filters: {
        clienteId: { type: 'string' },
        sessionId: { type: 'string', scope: 'read:pii' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.carrinho.findMany(args as Prisma.CarrinhoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.carrinho.findFirst(args as Prisma.CarrinhoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          clienteId: row.clienteId,
          sessionId: row.sessionId,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'itens-carrinho', model: 'ItemCarrinho', scope: 'read:pedidos',
      scalarFields: ['id', 'carrinhoId', 'produtoId', 'quantidade', 'createdAt', 'updatedAt'],
      select: { id: true, carrinhoId: true, produtoId: true, quantidade: true, createdAt: true, updatedAt: true } as const satisfies Prisma.ItemCarrinhoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'carrinhoId', type: 'string' },
        { name: 'produtoId', type: 'string' },
        { name: 'quantidade', type: 'integer' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'carrinho', many: false, resource: () => resolve('carrinhos') },
        { name: 'produto', many: false, resource: () => resolve('produtos') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        carrinhoId: { type: 'string' },
        produtoId: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.itemCarrinho.findMany(args as Prisma.ItemCarrinhoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.itemCarrinho.findFirst(args as Prisma.ItemCarrinhoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          carrinhoId: row.carrinhoId,
          produtoId: row.produtoId,
          quantidade: row.quantidade,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'cupons', model: 'Cupom', scope: 'read:pedidos',
      scalarFields: ['id', 'codigo', 'tipo', 'valor', 'usoMaximo', 'totalUsos', 'pedidoMinimo', 'validade', 'ativo', 'descricao', 'primeiraCompra', 'produtoIds', 'unidadeUnica', 'createdAt', 'updatedAt'],
      publicFields: ['codigo'],
      select: { id: true, codigo: true, tipo: true, valor: true, usoMaximo: true, totalUsos: true, pedidoMinimo: true, validade: true, ativo: true, descricao: true, primeiraCompra: true, produtoIds: true, unidadeUnica: true, createdAt: true, updatedAt: true } as const satisfies Prisma.CupomSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'codigo', type: 'string' },
        { name: 'tipo', type: 'string', enum: ['PERCENTUAL', 'VALOR_FIXO', 'FRETE_GRATIS', 'percentual', 'valor_fixo', 'frete_gratis'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'valor', type: 'string', format: 'decimal', description: 'Percentual quando tipo=PERCENTUAL; BRL quando tipo=VALOR_FIXO; sem efeito em FRETE_GRATIS.' },
        { name: 'usoMaximo', type: 'integer', nullable: true },
        { name: 'totalUsos', type: 'integer' },
        { name: 'pedidoMinimo', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'validade', type: 'string', nullable: true, format: 'date-time' },
        { name: 'ativo', type: 'boolean' },
        { name: 'descricao', type: 'string', nullable: true },
        { name: 'primeiraCompra', type: 'boolean' },
        { name: 'produtoIds', type: 'string', nullable: true },
        { name: 'unidadeUnica', type: 'boolean', description: 'Quando true, o cupom só vale com 1 unidade no carrinho (mutuamente exclusivo com a promo da 2ª unidade).' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'usos', many: true, resource: () => resolve('cupons-usos') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        codigo: { type: 'string' },
        tipo: { type: 'string', values: ['PERCENTUAL', 'VALOR_FIXO', 'FRETE_GRATIS', 'percentual', 'valor_fixo', 'frete_gratis'] },
        ativo: { type: 'boolean' },
        primeiraCompra: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cupom.findMany(args as Prisma.CupomFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cupom.findFirst(args as Prisma.CupomFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          codigo: row.codigo,
          tipo: row.tipo,
          valor: amount(row.valor),
          usoMaximo: row.usoMaximo,
          totalUsos: row.totalUsos,
          pedidoMinimo: amount(row.pedidoMinimo),
          validade: timestamp(row.validade),
          ativo: row.ativo,
          descricao: row.descricao,
          primeiraCompra: row.primeiraCompra,
          produtoIds: row.produtoIds,
          unidadeUnica: row.unidadeUnica,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, ['codigo'], [], [])
      },
    },
    {
      slug: 'cupons-usos', model: 'CupomUso', scope: 'read:pedidos',
      scalarFields: ['id', 'cupomId', 'clienteId', 'pedidoId', 'emailCliente', 'nomeCliente', 'valorDesconto', 'valorPedido', 'usadoEm'],
      select: { id: true, cupomId: true, clienteId: true, pedidoId: true, emailCliente: true, nomeCliente: true, valorDesconto: true, valorPedido: true, usadoEm: true } as const satisfies Prisma.CupomUsoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'cupomId', type: 'string' },
        { name: 'clienteId', type: 'string', nullable: true },
        { name: 'pedidoId', type: 'string', nullable: true },
        { name: 'emailCliente', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'nomeCliente', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'valorDesconto', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'valorPedido', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'usadoEm', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cupom', many: false, resource: () => resolve('cupons') },
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
      ],
      sorts: ['id', 'usadoEm'], defaultSort: 'usadoEm',
      dateFields: { created: 'usadoEm' },
      filters: {
        cupomId: { type: 'string' },
        clienteId: { type: 'string' },
        pedidoId: { type: 'string' },
        emailCliente: { type: 'string', scope: 'read:pii' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cupomUso.findMany(args as Prisma.CupomUsoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cupomUso.findFirst(args as Prisma.CupomUsoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          cupomId: row.cupomId,
          clienteId: row.clienteId,
          pedidoId: row.pedidoId,
          emailCliente: row.emailCliente,
          nomeCliente: row.nomeCliente,
          valorDesconto: amount(row.valorDesconto),
          valorPedido: amount(row.valorPedido),
          usadoEm: timestamp(row.usadoEm),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'carrinhos-clientes', model: 'CarrinhoCliente', scope: 'read:pedidos',
      scalarFields: ['id', 'clienteId', 'itens', 'valorTotal', 'etapaAtual', 'status', 'atualizadoEm', 'criadoEm'],
      publicJsonFields: cartPublicJsonFields,
      select: { id: true, clienteId: true, itens: true, valorTotal: true, etapaAtual: true, status: true, atualizadoEm: true, criadoEm: true } as const satisfies Prisma.CarrinhoClienteSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string' },
        { name: 'itens', type: 'array', items: { type: 'object', properties: { produtoId: { type: 'string' }, slug: { type: 'string' }, nome: { type: 'string' }, variacao: { type: 'string', nullable: true }, qtd: { type: 'integer' }, preco: { type: 'string', format: 'decimal' } }, required: ['produtoId', 'nome', 'variacao', 'qtd', 'preco'] } },
        { name: 'valorTotal', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'etapaAtual', type: 'integer' },
        { name: 'status', type: 'string', enum: ['ativo', 'convertido', 'abandonado', 'recuperado'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'atualizadoEm', type: 'string', format: 'date-time' },
        { name: 'criadoEm', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
      ],
      sorts: ['id', 'atualizadoEm'], defaultSort: 'atualizadoEm',
      dateFields: { created: 'criadoEm', updated: 'atualizadoEm' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      filters: {
        clienteId: { type: 'string' },
        status: { type: 'string', values: ['ativo', 'convertido', 'abandonado', 'recuperado'] },
        etapaAtual: { type: 'number' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.carrinhoCliente.findMany(args as Prisma.CarrinhoClienteFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.carrinhoCliente.findFirst(args as Prisma.CarrinhoClienteFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          clienteId: row.clienteId,
          itens: persistedCartItems(row.itens),
          valorTotal: amount(row.valorTotal),
          etapaAtual: row.etapaAtual,
          status: row.status,
          atualizadoEm: timestamp(row.atualizadoEm),
          criadoEm: timestamp(row.criadoEm),
        }
        return safeRecord(record, ctx, [], [], ['clienteId'], cartPublicJsonFields)
      },
    },
  ]
  return definitions
}
