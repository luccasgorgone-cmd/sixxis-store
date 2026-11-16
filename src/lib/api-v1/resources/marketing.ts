import type { Prisma, PrismaClient } from '@prisma/client'
import type { ResourceDefinition } from '../resource'
import { hasScope } from '../auth'
import { safeRecord, timestamp, type ResourceResolver, type ResourceRow } from './shared'
import { maskPhone } from '../redact'

export type MarketingResourceOptions = { prisma?: Pick<PrismaClient, 'listaEspera' | 'campanha' | 'campanhaDestinatario' | 'whatsappNumero' | 'envioLog' | 'lunaConversa' | 'lunaMensagem' | 'solicitacaoParceiro' | 'mensagemContato'>; resolve?: ResourceResolver }

export function createMarketingResources(deps: MarketingResourceOptions = {}): ResourceDefinition[] {
  const resolve: ResourceResolver = slug => {
    const definition = definitions.find(item => item.slug === slug) ?? deps.resolve?.(slug)
    if (!definition) throw new TypeError(`Unregistered expansion resource: ${slug}`)
    return definition
  }
  const definitions: ResourceDefinition[] = [
    {
      slug: 'lista-espera', model: 'ListaEspera', scope: 'read:marketing',
      scalarFields: ['id', 'produtoId', 'email', 'notificado', 'createdAt', 'updatedAt'],
      select: { id: true, produtoId: true, email: true, notificado: true, createdAt: true, updatedAt: true } as const satisfies Prisma.ListaEsperaSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'produtoId', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'notificado', type: 'boolean' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'produto', many: false, resource: () => resolve('produtos') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        produtoId: { type: 'string' },
        email: { type: 'string' },
        notificado: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.listaEspera.findMany(args as Prisma.ListaEsperaFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.listaEspera.findFirst(args as Prisma.ListaEsperaFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          produtoId: row.produtoId,
          email: row.email,
          notificado: row.notificado,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'campanhas', model: 'Campanha', scope: 'read:marketing',
      scalarFields: ['id', 'tipo', 'nome', 'assunto', 'mensagem', 'status', 'agendadoPara', 'enviadaEm', 'totalDestinatarios', 'totalEnviados', 'totalErros', 'taxaAbertura', 'filtroSegmento', 'whatsappNumeroId', 'publicoAlvo', 'tituloCopy', 'corpoCopy', 'ctaTexto', 'ctaUrl', 'produtoDestaqueId', 'cupomId', 'canais', 'emailAssunto', 'whatsappTexto', 'dataAgendamento', 'totalAlvo', 'totalAbertos', 'totalCliques', 'createdAt', 'updatedAt'],
      publicFields: ['nome'],
      select: { id: true, tipo: true, nome: true, assunto: true, mensagem: true, status: true, agendadoPara: true, enviadaEm: true, totalDestinatarios: true, totalEnviados: true, totalErros: true, taxaAbertura: true, filtroSegmento: true, whatsappNumeroId: true, publicoAlvo: true, tituloCopy: true, corpoCopy: true, ctaTexto: true, ctaUrl: true, produtoDestaqueId: true, cupomId: true, canais: true, emailAssunto: true, whatsappTexto: true, dataAgendamento: true, totalAlvo: true, totalAbertos: true, totalCliques: true, createdAt: true, updatedAt: true } as const satisfies Prisma.CampanhaSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'tipo', type: 'string', enum: ['promocional', 'sazonal', 'recuperacao', 'aniversario', 'lancamento', 'reengajamento', 'EMAIL', 'WHATSAPP'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'nome', type: 'string' },
        { name: 'assunto', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'mensagem', type: 'string', scope: 'read:mensagens' },
        { name: 'status', type: 'string', enum: ['rascunho', 'agendada', 'enviando', 'enviada', 'pausada', 'cancelada', 'erro', 'RASCUNHO', 'AGENDADA', 'ENVIANDO', 'ENVIADA', 'PAUSADA', 'CANCELADA', 'ERRO'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'agendadoPara', type: 'string', nullable: true, format: 'date-time' },
        { name: 'enviadaEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'totalDestinatarios', type: 'integer' },
        { name: 'totalEnviados', type: 'integer' },
        { name: 'totalErros', type: 'integer' },
        { name: 'taxaAbertura', type: 'number' },
        { name: 'filtroSegmento', type: 'object', nullable: true },
        { name: 'whatsappNumeroId', type: 'string', nullable: true },
        { name: 'publicoAlvo', type: 'object', nullable: true },
        { name: 'tituloCopy', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'corpoCopy', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'ctaTexto', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'ctaUrl', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'produtoDestaqueId', type: 'string', nullable: true },
        { name: 'cupomId', type: 'string', nullable: true },
        { name: 'canais', type: 'array', nullable: true, items: { type: 'string' } },
        { name: 'emailAssunto', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'whatsappTexto', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'dataAgendamento', type: 'string', nullable: true, format: 'date-time' },
        { name: 'totalAlvo', type: 'integer' },
        { name: 'totalAbertos', type: 'integer' },
        { name: 'totalCliques', type: 'integer' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'whatsappNumero', many: false, resource: () => resolve('whatsapp-numeros') },
        { name: 'destinatarios', many: true, resource: () => resolve('campanhas-destinatarios') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        tipo: { type: 'string', values: ['promocional', 'sazonal', 'recuperacao', 'aniversario', 'lancamento', 'reengajamento', 'EMAIL', 'WHATSAPP'] },
        status: { type: 'string', values: ['rascunho', 'agendada', 'enviando', 'enviada', 'pausada', 'cancelada', 'erro', 'RASCUNHO', 'AGENDADA', 'ENVIANDO', 'ENVIADA', 'PAUSADA', 'CANCELADA', 'ERRO'] },
        whatsappNumeroId: { type: 'string' },
        produtoDestaqueId: { type: 'string' },
        cupomId: { type: 'string' },
        canal: { type: 'string', field: 'canais', mode: 'arrayContains', values: ['email', 'whatsapp', 'EMAIL', 'WHATSAPP'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.campanha.findMany(args as Prisma.CampanhaFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.campanha.findFirst(args as Prisma.CampanhaFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          tipo: row.tipo,
          nome: row.nome,
          assunto: row.assunto,
          mensagem: row.mensagem,
          status: row.status,
          agendadoPara: timestamp(row.agendadoPara),
          enviadaEm: timestamp(row.enviadaEm),
          totalDestinatarios: row.totalDestinatarios,
          totalEnviados: row.totalEnviados,
          totalErros: row.totalErros,
          taxaAbertura: row.taxaAbertura,
          filtroSegmento: row.filtroSegmento,
          whatsappNumeroId: row.whatsappNumeroId,
          publicoAlvo: row.publicoAlvo,
          tituloCopy: row.tituloCopy,
          corpoCopy: row.corpoCopy,
          ctaTexto: row.ctaTexto,
          ctaUrl: row.ctaUrl,
          produtoDestaqueId: row.produtoDestaqueId,
          cupomId: row.cupomId,
          canais: row.canais,
          emailAssunto: row.emailAssunto,
          whatsappTexto: row.whatsappTexto,
          dataAgendamento: timestamp(row.dataAgendamento),
          totalAlvo: row.totalAlvo,
          totalAbertos: row.totalAbertos,
          totalCliques: row.totalCliques,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        if (!ctx.identity || !hasScope(ctx.identity, 'read:mensagens')) for (const field of ['assunto', 'mensagem', 'tituloCopy', 'corpoCopy', 'ctaTexto', 'ctaUrl', 'emailAssunto', 'whatsappTexto']) delete record[field]
        return safeRecord(record, ctx, ['nome'], [], [])
      },
    },
    {
      slug: 'campanhas-destinatarios', model: 'CampanhaDestinatario', scope: 'read:marketing',
      scalarFields: ['id', 'campanhaId', 'clienteId', 'nome', 'email', 'telefone', 'status', 'enviadoEm', 'erroMsg', 'createdAt', 'updatedAt'],
      select: { id: true, campanhaId: true, clienteId: true, nome: true, email: true, telefone: true, status: true, enviadoEm: true, erroMsg: true, createdAt: true, updatedAt: true } as const satisfies Prisma.CampanhaDestinatarioSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'campanhaId', type: 'string' },
        { name: 'clienteId', type: 'string', nullable: true },
        { name: 'nome', type: 'string' },
        { name: 'email', type: 'string', nullable: true },
        { name: 'telefone', type: 'string', nullable: true },
        { name: 'status', type: 'string', enum: ['PENDENTE', 'ENVIADO', 'ERRO', 'ABERTO', 'CLICADO', 'pendente', 'enviado', 'erro', 'aberto', 'clicado'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'enviadoEm', type: 'string', nullable: true, format: 'date-time' },
        { name: 'erroMsg', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'campanha', many: false, resource: () => resolve('campanhas') },
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte', maxDays: 31 },
      filters: {
        campanhaId: { type: 'string' },
        clienteId: { type: 'string' },
        email: { type: 'string' },
        telefone: { type: 'string' },
        status: { type: 'string', values: ['PENDENTE', 'ENVIADO', 'ERRO', 'ABERTO', 'CLICADO', 'pendente', 'enviado', 'erro', 'aberto', 'clicado'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.campanhaDestinatario.findMany(args as Prisma.CampanhaDestinatarioFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.campanhaDestinatario.findFirst(args as Prisma.CampanhaDestinatarioFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          campanhaId: row.campanhaId,
          clienteId: row.clienteId,
          nome: row.nome,
          email: row.email,
          telefone: row.telefone,
          status: row.status,
          enviadoEm: timestamp(row.enviadoEm),
          erroMsg: row.erroMsg,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'whatsapp-numeros', model: 'WhatsappNumero', scope: 'read:configuracoes',
      scalarFields: ['id', 'nome', 'numero', 'ativo', 'status', 'ehPadrao', 'totalEnviados', 'createdAt', 'updatedAt'],
      select: { id: true, nome: true, numero: true, ativo: true, status: true, ehPadrao: true, totalEnviados: true, createdAt: true, updatedAt: true } as const satisfies Prisma.WhatsappNumeroSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'nome', type: 'string' },
        { name: 'numero', type: 'string' },
        { name: 'ativo', type: 'boolean' },
        { name: 'status', type: 'string', enum: ['DESCONECTADO', 'CONECTADO', 'CONECTANDO', 'ERRO', 'desconectado', 'conectado', 'conectando', 'erro'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'ehPadrao', type: 'boolean' },
        { name: 'totalEnviados', type: 'integer' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'campanhas', many: true, resource: () => resolve('campanhas') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        ativo: { type: 'boolean' },
        status: { type: 'string', values: ['DESCONECTADO', 'CONECTADO', 'CONECTANDO', 'ERRO', 'desconectado', 'conectado', 'conectando', 'erro'] },
        ehPadrao: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.whatsappNumero.findMany(args as Prisma.WhatsappNumeroFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.whatsappNumero.findFirst(args as Prisma.WhatsappNumeroFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          nome: row.nome,
          numero: row.numero,
          ativo: row.ativo,
          status: row.status,
          ehPadrao: row.ehPadrao,
          totalEnviados: row.totalEnviados,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        if (!ctx.identity || !hasScope(ctx.identity, 'read:pii')) record.numero = maskPhone(record.numero)
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'envios-logs', model: 'EnvioLog', scope: 'read:marketing',
      scalarFields: ['id', 'campanhaId', 'tipo', 'destinatario', 'status', 'erroMsg', 'createdAt'],
      select: { id: true, campanhaId: true, tipo: true, destinatario: true, status: true, erroMsg: true, createdAt: true } as const satisfies Prisma.EnvioLogSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'campanhaId', type: 'string', nullable: true },
        { name: 'tipo', type: 'string', enum: ['EMAIL', 'WHATSAPP', 'email', 'whatsapp'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'destinatario', type: 'string' },
        { name: 'status', type: 'string', enum: ['ENVIADO', 'ERRO', 'enviado', 'erro', 'pendente', 'PENDENTE'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'erroMsg', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt',
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte', maxDays: 31 },
      filters: {
        campanhaId: { type: 'string' },
        tipo: { type: 'string', values: ['EMAIL', 'WHATSAPP', 'email', 'whatsapp'] },
        destinatario: { type: 'string' },
        status: { type: 'string', values: ['ENVIADO', 'ERRO', 'enviado', 'erro', 'pendente', 'PENDENTE'] },
        canal: { type: 'string', field: 'tipo', values: ['EMAIL', 'WHATSAPP', 'email', 'whatsapp'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.envioLog.findMany(args as Prisma.EnvioLogFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.envioLog.findFirst(args as Prisma.EnvioLogFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          campanhaId: row.campanhaId,
          tipo: row.tipo,
          destinatario: row.destinatario,
          status: row.status,
          erroMsg: row.erroMsg,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'luna-conversas', model: 'LunaConversa', scope: 'read:mensagens',
      scalarFields: ['id', 'sessaoId', 'paginaOrigem', 'userAgent', 'ip', 'clienteId', 'status', 'totalMensagens', 'primeiraMensagem', 'ultimaMensagem', 'duracaoSegundos', 'leadGerado', 'produtoInteresse', 'createdAt', 'updatedAt'],
      select: { id: true, sessaoId: true, paginaOrigem: true, userAgent: true, ip: true, clienteId: true, status: true, totalMensagens: true, primeiraMensagem: true, ultimaMensagem: true, duracaoSegundos: true, leadGerado: true, produtoInteresse: true, createdAt: true, updatedAt: true } as const satisfies Prisma.LunaConversaSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'sessaoId', type: 'string' },
        { name: 'paginaOrigem', type: 'string', nullable: true },
        { name: 'userAgent', type: 'string', nullable: true },
        { name: 'ip', type: 'string', nullable: true },
        { name: 'clienteId', type: 'string', nullable: true },
        { name: 'status', type: 'string', enum: ['ativa', 'encerrada', 'transferida', 'abandonada'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'totalMensagens', type: 'integer' },
        { name: 'primeiraMensagem', type: 'string', nullable: true, format: 'date-time' },
        { name: 'ultimaMensagem', type: 'string', nullable: true, format: 'date-time' },
        { name: 'duracaoSegundos', type: 'integer', nullable: true },
        { name: 'leadGerado', type: 'boolean' },
        { name: 'produtoInteresse', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'mensagens', many: true, resource: () => resolve('luna-mensagens') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte', maxDays: 31 },
      filters: {
        conversaId: { type: 'string', field: 'id' },
        sessaoId: { type: 'string' },
        clienteId: { type: 'string' },
        status: { type: 'string', values: ['ativa', 'encerrada', 'transferida', 'abandonada'] },
        leadGerado: { type: 'boolean' },
        produtoInteresse: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.lunaConversa.findMany(args as Prisma.LunaConversaFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.lunaConversa.findFirst(args as Prisma.LunaConversaFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          sessaoId: row.sessaoId,
          paginaOrigem: row.paginaOrigem,
          userAgent: row.userAgent,
          ip: row.ip,
          clienteId: row.clienteId,
          status: row.status,
          totalMensagens: row.totalMensagens,
          primeiraMensagem: timestamp(row.primeiraMensagem),
          ultimaMensagem: timestamp(row.ultimaMensagem),
          duracaoSegundos: row.duracaoSegundos,
          leadGerado: row.leadGerado,
          produtoInteresse: row.produtoInteresse,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], ['clienteId', 'paginaOrigem'])
      },
    },
    {
      slug: 'luna-mensagens', model: 'LunaMensagem', scope: 'read:mensagens',
      scalarFields: ['id', 'conversaId', 'role', 'conteudo', 'tokens', 'latenciaMs', 'createdAt'],
      select: { id: true, conversaId: true, role: true, conteudo: true, tokens: true, latenciaMs: true, createdAt: true } as const satisfies Prisma.LunaMensagemSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'conversaId', type: 'string' },
        { name: 'role', type: 'string', enum: ['user', 'assistant', 'system', 'tool'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'conteudo', type: 'string', scope: 'read:mensagens' },
        { name: 'tokens', type: 'integer', nullable: true },
        { name: 'latenciaMs', type: 'integer', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'conversa', many: false, resource: () => resolve('luna-conversas') },
      ],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt',
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte', maxDays: 31 },
      filters: {
        conversaId: { type: 'string' },
        role: { type: 'string', values: ['user', 'assistant', 'system', 'tool'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.lunaMensagem.findMany(args as Prisma.LunaMensagemFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.lunaMensagem.findFirst(args as Prisma.LunaMensagemFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          conversaId: row.conversaId,
          role: row.role,
          conteudo: row.conteudo,
          tokens: row.tokens,
          latenciaMs: row.latenciaMs,
          createdAt: timestamp(row.createdAt),
        }
        if (!ctx.identity || !hasScope(ctx.identity, 'read:mensagens')) for (const field of ['conteudo']) delete record[field]
        return safeRecord(record, ctx, [], [], [])
      },
    },
    {
      slug: 'solicitacoes-parceiros', model: 'SolicitacaoParceiro', scope: 'read:marketing',
      scalarFields: ['id', 'tipo', 'nome', 'email', 'telefone', 'cpf', 'cnpj', 'razaoSocial', 'nomeFantasia', 'cidade', 'estado', 'cep', 'endereco', 'segmento', 'mensagem', 'status', 'createdAt', 'updatedAt'],
      select: { id: true, tipo: true, nome: true, email: true, telefone: true, cpf: true, cnpj: true, razaoSocial: true, nomeFantasia: true, cidade: true, estado: true, cep: true, endereco: true, segmento: true, mensagem: true, status: true, createdAt: true, updatedAt: true } as const satisfies Prisma.SolicitacaoParceiroSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'tipo', type: 'string', enum: ['pj', 'pf'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'nome', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'telefone', type: 'string' },
        { name: 'cpf', type: 'string', nullable: true },
        { name: 'cnpj', type: 'string', nullable: true },
        { name: 'razaoSocial', type: 'string', nullable: true },
        { name: 'nomeFantasia', type: 'string', nullable: true },
        { name: 'cidade', type: 'string', nullable: true },
        { name: 'estado', type: 'string', nullable: true },
        { name: 'cep', type: 'string', nullable: true },
        { name: 'endereco', type: 'string', nullable: true },
        { name: 'segmento', type: 'string', nullable: true, enum: ['Varejo', 'Atacado', 'E-commerce', 'Distribuidor', 'Outro'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'mensagem', type: 'string', nullable: true, scope: 'read:mensagens' },
        { name: 'status', type: 'string', enum: ['novo', 'em_analise', 'aprovado', 'recusado'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        tipo: { type: 'string', values: ['pj', 'pf'] },
        status: { type: 'string', values: ['novo', 'em_analise', 'aprovado', 'recusado'] },
        email: { type: 'string' },
        telefone: { type: 'string' },
        cpf: { type: 'string' },
        cnpj: { type: 'string' },
        uf: { type: 'string', field: 'estado' },
        cidade: { type: 'string' },
        segmento: { type: 'string', values: ['Varejo', 'Atacado', 'E-commerce', 'Distribuidor', 'Outro'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.solicitacaoParceiro.findMany(args as Prisma.SolicitacaoParceiroFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.solicitacaoParceiro.findFirst(args as Prisma.SolicitacaoParceiroFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          tipo: row.tipo,
          nome: row.nome,
          email: row.email,
          telefone: row.telefone,
          cpf: row.cpf,
          cnpj: row.cnpj,
          razaoSocial: row.razaoSocial,
          nomeFantasia: row.nomeFantasia,
          cidade: row.cidade,
          estado: row.estado,
          cep: row.cep,
          endereco: row.endereco,
          segmento: row.segmento,
          mensagem: row.mensagem,
          status: row.status,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        if (!ctx.identity || !hasScope(ctx.identity, 'read:mensagens')) for (const field of ['mensagem']) delete record[field]
        return safeRecord(record, ctx, [], [], ['cidade', 'estado'])
      },
    },
    {
      slug: 'mensagens-contato', model: 'MensagemContato', scope: 'read:mensagens',
      scalarFields: ['id', 'nome', 'email', 'telefone', 'assunto', 'mensagem', 'status', 'createdAt', 'updatedAt'],
      select: { id: true, nome: true, email: true, telefone: true, assunto: true, mensagem: true, status: true, createdAt: true, updatedAt: true } as const satisfies Prisma.MensagemContatoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'nome', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'telefone', type: 'string', nullable: true },
        { name: 'assunto', type: 'string', scope: 'read:mensagens' },
        { name: 'mensagem', type: 'string', scope: 'read:mensagens' },
        { name: 'status', type: 'string', enum: ['novo', 'lido', 'respondido', 'arquivado'], description: 'Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte', maxDays: 31 },
      filters: {
        status: { type: 'string', values: ['novo', 'lido', 'respondido', 'arquivado'] },
        email: { type: 'string' },
        telefone: { type: 'string' },
        assunto: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.mensagemContato.findMany(args as Prisma.MensagemContatoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.mensagemContato.findFirst(args as Prisma.MensagemContatoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          nome: row.nome,
          email: row.email,
          telefone: row.telefone,
          assunto: row.assunto,
          mensagem: row.mensagem,
          status: row.status,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        if (!ctx.identity || !hasScope(ctx.identity, 'read:mensagens')) for (const field of ['assunto', 'mensagem']) delete record[field]
        return safeRecord(record, ctx, [], [], [])
      },
    },
  ]
  return definitions
}
