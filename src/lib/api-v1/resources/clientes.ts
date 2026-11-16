import type { Prisma, PrismaClient } from '@prisma/client'
import type { ResourceDefinition } from '../resource'
import { amount, safeRecord, timestamp, type ResourceResolver, type ResourceRow } from './shared'

export type CustomerResourceOptions = { prisma?: Pick<PrismaClient, 'cliente' | 'endereco' | 'historicoPontos' | 'pontosCliente' | 'cashbackTransacao' | 'nivelFidelidade'>; resolve?: ResourceResolver }

export function createCustomerResources(deps: CustomerResourceOptions = {}): ResourceDefinition[] {
  const resolve: ResourceResolver = slug => {
    const definition = definitions.find(item => item.slug === slug) ?? deps.resolve?.(slug)
    if (!definition) throw new TypeError(`Unregistered expansion resource: ${slug}`)
    return definition
  }
  const definitions: ResourceDefinition[] = [
    {
      slug: 'clientes', model: 'Cliente', scope: 'read:clientes',
      scalarFields: ['id', 'nome', 'email', 'cpf', 'cnpj', 'razaoSocial', 'inscricaoEstadual', 'indicadorIE', 'telefone', 'erpClienteId', 'createdAt', 'bloqueado', 'motivoBloqueio', 'bloqueadoEm', 'cashbackSaldo', 'cashbackPendente', 'totalGasto', 'totalPedidos', 'ultimaCompra', 'carrinhoAbandon', 'dataNascimento', 'genero', 'avatar', 'avatarGradiente', 'notifEmail', 'notifWhatsapp', 'updatedAt'],
      select: { id: true, nome: true, email: true, cpf: true, cnpj: true, razaoSocial: true, inscricaoEstadual: true, indicadorIE: true, telefone: true, erpClienteId: true, createdAt: true, bloqueado: true, motivoBloqueio: true, bloqueadoEm: true, cashbackSaldo: true, cashbackPendente: true, totalGasto: true, totalPedidos: true, ultimaCompra: true, carrinhoAbandon: true, dataNascimento: true, genero: true, avatar: true, avatarGradiente: true, notifEmail: true, notifWhatsapp: true, updatedAt: true } as const satisfies Prisma.ClienteSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'nome', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'cpf', type: 'string', nullable: true },
        { name: 'cnpj', type: 'string', nullable: true },
        { name: 'razaoSocial', type: 'string', nullable: true },
        { name: 'inscricaoEstadual', type: 'string', nullable: true },
        { name: 'indicadorIE', type: 'integer', nullable: true },
        { name: 'telefone', type: 'string', nullable: true },
        { name: 'erpClienteId', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'bloqueado', type: 'boolean' },
        { name: 'motivoBloqueio', type: 'string', nullable: true },
        { name: 'bloqueadoEm', type: 'string', format: 'date-time', nullable: true },
        { name: 'cashbackSaldo', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'cashbackPendente', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'totalGasto', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'totalPedidos', type: 'integer' },
        { name: 'ultimaCompra', type: 'string', format: 'date-time', nullable: true },
        { name: 'carrinhoAbandon', type: 'object', nullable: true },
        { name: 'dataNascimento', type: 'string', format: 'date-time', nullable: true },
        { name: 'genero', type: 'string', nullable: true },
        { name: 'avatar', type: 'string', nullable: true },
        { name: 'avatarGradiente', type: 'string', nullable: true },
        { name: 'notifEmail', type: 'boolean' },
        { name: 'notifWhatsapp', type: 'boolean' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'enderecos', many: true, resource: () => resolve('enderecos') },
        { name: 'pedidos', many: true, resource: () => resolve('pedidos') },
        { name: 'pontos', many: false, resource: () => resolve('pontos-clientes') },
        { name: 'cashback', many: true, resource: () => resolve('cashback-transacoes') },
      ],
      sorts: ['id', 'updatedAt', 'nome'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      searchFields: ['nome', 'email', 'razaoSocial', 'erpClienteId'],
      filters: {
        clienteId: { type: 'string', field: 'id' },
        email: { type: 'string' },
        cpf: { type: 'string' },
        cnpj: { type: 'string' },
        bloqueado: { type: 'boolean' },
        erpClienteId: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cliente.findMany(args as Prisma.ClienteFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cliente.findFirst(args as Prisma.ClienteFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        nome: row.nome,
        email: row.email,
        cpf: row.cpf,
        cnpj: row.cnpj,
        razaoSocial: row.razaoSocial,
        inscricaoEstadual: row.inscricaoEstadual,
        indicadorIE: row.indicadorIE,
        telefone: row.telefone,
        erpClienteId: row.erpClienteId,
        createdAt: timestamp(row.createdAt),
        bloqueado: row.bloqueado,
        motivoBloqueio: row.motivoBloqueio,
        bloqueadoEm: timestamp(row.bloqueadoEm),
        cashbackSaldo: amount(row.cashbackSaldo),
        cashbackPendente: amount(row.cashbackPendente),
        totalGasto: amount(row.totalGasto),
        totalPedidos: row.totalPedidos,
        ultimaCompra: timestamp(row.ultimaCompra),
        carrinhoAbandon: row.carrinhoAbandon,
        dataNascimento: timestamp(row.dataNascimento),
        genero: row.genero,
        avatar: row.avatar,
        avatarGradiente: row.avatarGradiente,
        notifEmail: row.notifEmail,
        notifWhatsapp: row.notifWhatsapp,
        updatedAt: timestamp(row.updatedAt),
      }, ctx, [], [], ['dataNascimento', 'genero', 'avatar']),
    },
    {
      slug: 'enderecos', model: 'Endereco', scope: 'read:clientes',
      scalarFields: ['id', 'clienteId', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'principal', 'createdAt', 'updatedAt'],
      select: { id: true, clienteId: true, cep: true, logradouro: true, numero: true, complemento: true, bairro: true, cidade: true, estado: true, principal: true, createdAt: true, updatedAt: true } as const satisfies Prisma.EnderecoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string' },
        { name: 'cep', type: 'string' },
        { name: 'logradouro', type: 'string' },
        { name: 'numero', type: 'string' },
        { name: 'complemento', type: 'string', nullable: true },
        { name: 'bairro', type: 'string' },
        { name: 'cidade', type: 'string' },
        { name: 'estado', type: 'string' },
        { name: 'principal', type: 'boolean' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
        { name: 'pedidos', many: true, resource: () => resolve('pedidos') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        clienteId: { type: 'string' },
        uf: { type: 'string', field: 'estado' },
        cidade: { type: 'string' },
        principal: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.endereco.findMany(args as Prisma.EnderecoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.endereco.findFirst(args as Prisma.EnderecoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        clienteId: row.clienteId,
        cep: row.cep,
        logradouro: row.logradouro,
        numero: row.numero,
        complemento: row.complemento,
        bairro: row.bairro,
        cidade: row.cidade,
        estado: row.estado,
        principal: row.principal,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx, [], [], ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado']),
    },
    {
      slug: 'historico-pontos', model: 'HistoricoPontos', scope: 'read:clientes',
      scalarFields: ['id', 'clienteId', 'pontos', 'tipo', 'descricao', 'pedidoId', 'createdAt'],
      select: { id: true, clienteId: true, pontos: true, tipo: true, descricao: true, pedidoId: true, createdAt: true } as const satisfies Prisma.HistoricoPontosSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string' },
        { name: 'pontos', type: 'integer' },
        { name: 'tipo', type: 'string' },
        { name: 'descricao', type: 'string', nullable: true },
        { name: 'pedidoId', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
      ],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt',
      dateFields: { created: 'createdAt' },
      filters: {
        clienteId: { type: 'string' },
        pedidoId: { type: 'string' },
        tipo: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.historicoPontos.findMany(args as Prisma.HistoricoPontosFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.historicoPontos.findFirst(args as Prisma.HistoricoPontosFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        clienteId: row.clienteId,
        pontos: row.pontos,
        tipo: row.tipo,
        descricao: row.descricao,
        pedidoId: row.pedidoId,
        createdAt: timestamp(row.createdAt),
      }, ctx),
    },
    {
      slug: 'pontos-clientes', model: 'PontosCliente', scope: 'read:clientes',
      scalarFields: ['id', 'clienteId', 'pontos', 'updatedAt'],
      select: { id: true, clienteId: true, pontos: true, updatedAt: true } as const satisfies Prisma.PontosClienteSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string' },
        { name: 'pontos', type: 'integer' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { updated: 'updatedAt' },
      filters: {
        clienteId: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.pontosCliente.findMany(args as Prisma.PontosClienteFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.pontosCliente.findFirst(args as Prisma.PontosClienteFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        clienteId: row.clienteId,
        pontos: row.pontos,
        updatedAt: timestamp(row.updatedAt),
      }, ctx),
    },
    {
      slug: 'cashback-transacoes', model: 'CashbackTransacao', scope: 'read:clientes',
      scalarFields: ['id', 'clienteId', 'tipo', 'status', 'valor', 'descricao', 'pedidoId', 'createdAt', 'updatedAt'],
      select: { id: true, clienteId: true, tipo: true, status: true, valor: true, descricao: true, pedidoId: true, createdAt: true, updatedAt: true } as const satisfies Prisma.CashbackTransacaoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string' },
        { name: 'tipo', type: 'string', enum: ['credito', 'debito'] },
        { name: 'status', type: 'string', enum: ['pendente', 'disponivel', 'cancelado'] },
        { name: 'valor', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'descricao', type: 'string', nullable: true },
        { name: 'pedidoId', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        clienteId: { type: 'string' },
        pedidoId: { type: 'string' },
        tipo: { type: 'string', values: ['credito', 'debito'] },
        status: { type: 'string', values: ['pendente', 'disponivel', 'cancelado'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cashbackTransacao.findMany(args as Prisma.CashbackTransacaoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cashbackTransacao.findFirst(args as Prisma.CashbackTransacaoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        clienteId: row.clienteId,
        tipo: row.tipo,
        status: row.status,
        valor: amount(row.valor),
        descricao: row.descricao,
        pedidoId: row.pedidoId,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx),
    },
    {
      slug: 'niveis-fidelidade', model: 'NivelFidelidade', scope: 'read:clientes',
      scalarFields: ['id', 'slug', 'nome', 'iconeUrl', 'iconeLucide', 'cor', 'gastoMin', 'gastoMax', 'cashbackPc', 'ordem', 'createdAt', 'updatedAt'],
      publicFields: ['nome'],
      select: { id: true, slug: true, nome: true, iconeUrl: true, iconeLucide: true, cor: true, gastoMin: true, gastoMax: true, cashbackPc: true, ordem: true, createdAt: true, updatedAt: true } as const satisfies Prisma.NivelFidelidadeSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'slug', type: 'string' },
        { name: 'nome', type: 'string' },
        { name: 'iconeUrl', type: 'string', nullable: true },
        { name: 'iconeLucide', type: 'string', nullable: true },
        { name: 'cor', type: 'string' },
        { name: 'gastoMin', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'gastoMax', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true },
        { name: 'cashbackPc', type: 'number', description: 'Percentual de cashback, não valor monetário.' },
        { name: 'ordem', type: 'integer' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt', 'nome', 'ordem'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      searchFields: ['nome'],
      filters: {
        slug: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.nivelFidelidade.findMany(args as Prisma.NivelFidelidadeFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.nivelFidelidade.findFirst(args as Prisma.NivelFidelidadeFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        slug: row.slug,
        nome: row.nome,
        iconeUrl: row.iconeUrl,
        iconeLucide: row.iconeLucide,
        cor: row.cor,
        gastoMin: amount(row.gastoMin),
        gastoMax: amount(row.gastoMax),
        cashbackPc: row.cashbackPc,
        ordem: row.ordem,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx, ['nome']),
    },
  ]
  return definitions
}
