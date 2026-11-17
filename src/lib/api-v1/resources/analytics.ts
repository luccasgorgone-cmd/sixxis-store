import type { Prisma, PrismaClient } from '@prisma/client'
import { hasScope } from '../auth'
import { API_QUERY_TIMEOUT_MS } from '../constants'
import { ApiQueryError } from '../query'
import { withQueryTimeout as queryTimeout, type ResourceDefinition } from '../resource'
import { amount, safeRecord, timestamp, type ResourceResolver, type ResourceRow } from './shared'

const withQueryTimeout = <T>(work: () => Promise<T>) => queryTimeout(work, API_QUERY_TIMEOUT_MS, { drain: true })

export type AnalyticsResourceOptions = { prisma?: Pick<PrismaClient, 'cookieConsent' | 'eventoAnalitico' | 'clienteInsight' | 'sessaoVisitante' | 'eventoTracking' | 'relatorioVendaHora' | 'tentativaLogin' | 'bloqueioIp' | 'auditLog' | 'presenca' | 'trafegoBruto' | 'bloqueioFraude'>; resolve?: ResourceResolver }

/** The ISO parameters select inclusive stored BRT day labels, not an instant range.
 * Only definition-owned `dia` predicates are converted; cursors already contain day strings. */
function calendarWhere(where: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(where).map(([key, value]) => {
    if (key === 'dia' && value && typeof value === 'object' && !Array.isArray(value)) {
      return [key, Object.fromEntries(Object.entries(value).map(([operator, bound]) => [operator, bound instanceof Date ? bound.toISOString().slice(0, 10) : bound]))]
    }
    if (Array.isArray(value)) return [key, value.map(child => child && typeof child === 'object' ? calendarWhere(child as Record<string, unknown>) : child)]
    return [key, value]
  }))
}

/** Day-level freshness only: a dia index cannot promise createdAt precision.
 * Find the first actual instant of the civil day, including old DST midnight gaps. */
function businessDayStart(day: unknown): string {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new TypeError('Invalid business day')
  const midnight = new Date(`${day}T00:00:00Z`)
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== day) throw new TypeError('Invalid business day')
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
  const dayAt = (instant: number) => {
    const parts = formatter.formatToParts(instant)
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-')
  }
  let low = midnight.getTime() - 86_400_000, high = midnight.getTime() + 86_400_000
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (dayAt(middle) < day) low = middle + 1
    else high = middle
  }
  return timestamp(new Date(low))!
}

export function createAnalyticsResources(deps: AnalyticsResourceOptions = {}): ResourceDefinition[] {
  const resolve: ResourceResolver = slug => {
    const definition = definitions.find(item => item.slug === slug) ?? deps.resolve?.(slug)
    if (!definition) throw new TypeError(`Unregistered expansion resource: ${slug}`)
    return definition
  }
  const definitions: ResourceDefinition[] = [
    {
      slug: 'cookies-consentimentos', model: 'CookieConsent', scope: 'read:analytics',
      scalarFields: ['id', 'sessionId', 'ip', 'userAgent', 'aceitou', 'categorias', 'createdAt'],
      select: { id: true, sessionId: true, ip: true, userAgent: true, aceitou: true, categorias: true, createdAt: true } as const satisfies Prisma.CookieConsentSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'sessionId', type: 'string', scope: 'read:pii' },
        { name: 'ip', type: 'string', nullable: true },
        { name: 'userAgent', type: 'string', nullable: true },
        { name: 'aceitou', type: 'boolean' },
        { name: 'categorias', type: 'string' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt', maxLimit: 200,
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte' },
      filters: {
        sessionId: { type: 'string', scope: 'read:pii' },
        aceitou: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cookieConsent.findMany(args as Prisma.CookieConsentFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.cookieConsent.findFirst(args as Prisma.CookieConsentFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          sessionId: row.sessionId,
          ip: row.ip,
          userAgent: row.userAgent,
          aceitou: row.aceitou,
          categorias: row.categorias,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.cookieConsent.count(), db.cookieConsent.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.createdAt) : null }
        })
      },
    },
    {
      slug: 'eventos-analiticos', model: 'EventoAnalitico', scope: 'read:analytics',
      deprecated: true, description: 'Sistema B descontinuado: histórico preservado; novos eventos usam EventoTracking/SessaoVisitante.',
      scalarFields: ['id', 'sessionId', 'userId', 'tipo', 'dados', 'pagina', 'createdAt'],
      select: { id: true, sessionId: true, userId: true, tipo: true, dados: true, pagina: true, createdAt: true } as const satisfies Prisma.EventoAnaliticoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'sessionId', type: 'string', scope: 'read:pii' },
        { name: 'userId', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'tipo', type: 'string' },
        { name: 'dados', type: 'string' },
        { name: 'pagina', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt', maxLimit: 200,
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte' },
      filters: {
        sessionId: { type: 'string', scope: 'read:pii' },
        userId: { type: 'string', scope: 'read:pii' },
        tipo: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.eventoAnalitico.findMany(args as Prisma.EventoAnaliticoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.eventoAnalitico.findFirst(args as Prisma.EventoAnaliticoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          sessionId: row.sessionId,
          userId: row.userId,
          tipo: row.tipo,
          dados: row.dados,
          pagina: row.pagina,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], ['pagina'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.eventoAnalitico.count(), db.eventoAnalitico.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.createdAt) : null }
        })
      },
    },
    {
      slug: 'clientes-insights', model: 'ClienteInsight', scope: 'read:analytics',
      safeKeyFields: ['cookieCategs'],
      deprecated: true, description: 'Sistema B descontinuado: histórico preservado; novos eventos usam EventoTracking/SessaoVisitante.',
      scalarFields: ['id', 'sessionId', 'userId', 'primeiraVisita', 'ultimaVisita', 'totalVisitas', 'totalPaginas', 'carrinhosAbertos', 'comprasFeitas', 'totalGasto', 'produtosVistos', 'buscas', 'dispositivo', 'cidade', 'fonte', 'cookieCategs'],
      select: { id: true, sessionId: true, userId: true, primeiraVisita: true, ultimaVisita: true, totalVisitas: true, totalPaginas: true, carrinhosAbertos: true, comprasFeitas: true, totalGasto: true, produtosVistos: true, buscas: true, dispositivo: true, cidade: true, fonte: true, cookieCategs: true } as const satisfies Prisma.ClienteInsightSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'sessionId', type: 'string', scope: 'read:pii' },
        { name: 'userId', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'primeiraVisita', type: 'string', format: 'date-time' },
        { name: 'ultimaVisita', type: 'string', format: 'date-time' },
        { name: 'totalVisitas', type: 'integer' },
        { name: 'totalPaginas', type: 'integer' },
        { name: 'carrinhosAbertos', type: 'integer' },
        { name: 'comprasFeitas', type: 'integer' },
        { name: 'totalGasto', type: 'string', format: 'decimal' },
        { name: 'produtosVistos', type: 'string' },
        { name: 'buscas', type: 'string' },
        { name: 'dispositivo', type: 'string', nullable: true },
        { name: 'cidade', type: 'string', nullable: true },
        { name: 'fonte', type: 'string', nullable: true },
        { name: 'cookieCategs', type: 'string' },
      ],
      expands: [],
      sorts: ['id', 'ultimaVisita'], defaultSort: 'ultimaVisita', maxLimit: 200,
      dateFields: { created: 'primeiraVisita', updated: 'ultimaVisita' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      filters: {
        sessionId: { type: 'string', scope: 'read:pii' },
        userId: { type: 'string', scope: 'read:pii' },
        dispositivo: { type: 'string' },
        fonte: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.clienteInsight.findMany(args as Prisma.ClienteInsightFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.clienteInsight.findFirst(args as Prisma.ClienteInsightFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          sessionId: row.sessionId,
          userId: row.userId,
          primeiraVisita: timestamp(row.primeiraVisita),
          ultimaVisita: timestamp(row.ultimaVisita),
          totalVisitas: row.totalVisitas,
          totalPaginas: row.totalPaginas,
          carrinhosAbertos: row.carrinhosAbertos,
          comprasFeitas: row.comprasFeitas,
          totalGasto: amount(row.totalGasto),
          produtosVistos: row.produtosVistos,
          buscas: row.buscas,
          dispositivo: row.dispositivo,
          cidade: row.cidade,
          fonte: row.fonte,
          cookieCategs: row.cookieCategs,
        }
        return safeRecord(record, ctx, [], [], ['cidade'], {}, ['cookieCategs'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.clienteInsight.count(), db.clienteInsight.findFirst({ orderBy: { ultimaVisita: 'desc' }, select: { ultimaVisita: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.ultimaVisita) : null }
        })
      },
    },
    {
      slug: 'sessoes-visitantes', model: 'SessaoVisitante', scope: 'read:analytics',
      scalarFields: ['id', 'sessaoId', 'userId', 'ip', 'pais', 'cidade', 'userAgent', 'dispositivo', 'browser', 'os', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm', 'gclid', 'gbraid', 'wbraid', 'referer', 'landingPage', 'totalPaginas', 'duracaoSegundos', 'converteu', 'createdAt', 'updatedAt'],
      select: { id: true, sessaoId: true, userId: true, ip: true, pais: true, cidade: true, userAgent: true, dispositivo: true, browser: true, os: true, utmSource: true, utmMedium: true, utmCampaign: true, utmContent: true, utmTerm: true, gclid: true, gbraid: true, wbraid: true, referer: true, landingPage: true, totalPaginas: true, duracaoSegundos: true, converteu: true, createdAt: true, updatedAt: true } as const satisfies Prisma.SessaoVisitanteSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'sessaoId', type: 'string', scope: 'read:pii' },
        { name: 'userId', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'ip', type: 'string', nullable: true },
        { name: 'pais', type: 'string', nullable: true },
        { name: 'cidade', type: 'string', nullable: true },
        { name: 'userAgent', type: 'string', nullable: true },
        { name: 'dispositivo', type: 'string', nullable: true },
        { name: 'browser', type: 'string', nullable: true },
        { name: 'os', type: 'string', nullable: true },
        { name: 'utmSource', type: 'string', nullable: true },
        { name: 'utmMedium', type: 'string', nullable: true },
        { name: 'utmCampaign', type: 'string', nullable: true },
        { name: 'utmContent', type: 'string', nullable: true },
        { name: 'utmTerm', type: 'string', nullable: true },
        { name: 'gclid', type: 'string', nullable: true },
        { name: 'gbraid', type: 'string', nullable: true },
        { name: 'wbraid', type: 'string', nullable: true },
        { name: 'referer', type: 'string', nullable: true },
        { name: 'landingPage', type: 'string', nullable: true },
        { name: 'totalPaginas', type: 'integer' },
        { name: 'duracaoSegundos', type: 'integer' },
        { name: 'converteu', type: 'boolean' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'eventos', many: true, resource: () => resolve('eventos-tracking') },
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt', maxLimit: 200,
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      filters: {
        sessaoId: { type: 'string', scope: 'read:pii' },
        userId: { type: 'string', scope: 'read:pii' },
        utmSource: { type: 'string' },
        utmMedium: { type: 'string' },
        utmCampaign: { type: 'string' },
        utmContent: { type: 'string' },
        utmTerm: { type: 'string' },
        dispositivo: { type: 'string' },
        browser: { type: 'string' },
        os: { type: 'string' },
        pais: { type: 'string' },
        converteu: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.sessaoVisitante.findMany(args as Prisma.SessaoVisitanteFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.sessaoVisitante.findFirst(args as Prisma.SessaoVisitanteFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          sessaoId: row.sessaoId,
          userId: row.userId,
          ip: row.ip,
          pais: row.pais,
          cidade: row.cidade,
          userAgent: row.userAgent,
          dispositivo: row.dispositivo,
          browser: row.browser,
          os: row.os,
          utmSource: row.utmSource,
          utmMedium: row.utmMedium,
          utmCampaign: row.utmCampaign,
          utmContent: row.utmContent,
          utmTerm: row.utmTerm,
          gclid: row.gclid,
          gbraid: row.gbraid,
          wbraid: row.wbraid,
          referer: row.referer,
          landingPage: row.landingPage,
          totalPaginas: row.totalPaginas,
          duracaoSegundos: row.duracaoSegundos,
          converteu: row.converteu,
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], ['cidade', 'referer', 'landingPage'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.sessaoVisitante.count(), db.sessaoVisitante.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.updatedAt) : null }
        })
      },
    },
    {
      slug: 'eventos-tracking', model: 'EventoTracking', scope: 'read:analytics',
      scalarFields: ['id', 'sessaoId', 'tipo', 'pagina', 'produtoId', 'produtoSlug', 'valor', 'dados', 'createdAt'],
      select: { id: true, sessaoId: true, tipo: true, pagina: true, produtoId: true, produtoSlug: true, valor: true, dados: true, createdAt: true } as const satisfies Prisma.EventoTrackingSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'sessaoId', type: 'string', scope: 'read:pii' },
        { name: 'tipo', type: 'string' },
        { name: 'pagina', type: 'string', nullable: true },
        { name: 'produtoId', type: 'string', nullable: true },
        { name: 'produtoSlug', type: 'string', nullable: true },
        { name: 'valor', type: 'string', format: 'decimal', nullable: true },
        { name: 'dados', type: 'object', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'sessao', many: false, resource: () => resolve('sessoes-visitantes') },
      ],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt', maxLimit: 200,
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte' },
      filters: {
        sessaoId: { type: 'string', scope: 'read:pii' },
        tipo: { type: 'string' },
        produtoId: { type: 'string' },
        produtoSlug: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.eventoTracking.findMany(args as Prisma.EventoTrackingFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.eventoTracking.findFirst(args as Prisma.EventoTrackingFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          sessaoId: row.sessaoId,
          tipo: row.tipo,
          pagina: row.pagina,
          produtoId: row.produtoId,
          produtoSlug: row.produtoSlug,
          valor: amount(row.valor),
          dados: row.dados,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], ['pagina'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.eventoTracking.count(), db.eventoTracking.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.createdAt) : null }
        })
      },
    },
    {
      slug: 'relatorios-venda-hora', model: 'RelatorioVendaHora', scope: 'read:analytics',
      scalarFields: ['id', 'data', 'hora', 'diaSemana', 'totalPedidos', 'totalReceita', 'totalItens', 'updatedAt'],
      select: { id: true, data: true, hora: true, diaSemana: true, totalPedidos: true, totalReceita: true, totalItens: true, updatedAt: true } as const satisfies Prisma.RelatorioVendaHoraSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'data', type: 'string', format: 'date-time' },
        { name: 'hora', type: 'integer' },
        { name: 'diaSemana', type: 'integer' },
        { name: 'totalPedidos', type: 'integer' },
        { name: 'totalReceita', type: 'string', format: 'decimal' },
        { name: 'totalItens', type: 'integer' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt', maxLimit: 200,
      dateFields: { created: 'data', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      filters: {
        hora: { type: 'number', integer: true, min: 0, max: 23 },
        diaSemana: { type: 'number', integer: true, min: 0, max: 6 },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.relatorioVendaHora.findMany(args as Prisma.RelatorioVendaHoraFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.relatorioVendaHora.findFirst(args as Prisma.RelatorioVendaHoraFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          data: timestamp(row.data),
          hora: row.hora,
          diaSemana: row.diaSemana,
          totalPedidos: row.totalPedidos,
          totalReceita: amount(row.totalReceita),
          totalItens: row.totalItens,
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.relatorioVendaHora.count(), db.relatorioVendaHora.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.updatedAt) : null }
        })
      },
    },
    {
      slug: 'tentativas-login', model: 'TentativaLogin', scope: 'read:auditoria',
      scalarFields: ['id', 'ip', 'userAgent', 'sucesso', 'rota', 'createdAt'],
      select: { id: true, ip: true, userAgent: true, sucesso: true, rota: true, createdAt: true } as const satisfies Prisma.TentativaLoginSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'ip', type: 'string', scope: 'read:pii' },
        { name: 'userAgent', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'sucesso', type: 'boolean' },
        { name: 'rota', type: 'string' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt', maxLimit: 200,
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte' },
      filters: {
        ip: { type: 'string', scope: 'read:pii' },
        sucesso: { type: 'boolean' },
        rota: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.tentativaLogin.findMany(args as Prisma.TentativaLoginFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.tentativaLogin.findFirst(args as Prisma.TentativaLoginFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          ip: row.ip,
          userAgent: row.userAgent,
          sucesso: row.sucesso,
          rota: row.rota,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:auditoria')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.tentativaLogin.count(), db.tentativaLogin.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.createdAt) : null }
        })
      },
    },
    {
      slug: 'bloqueios-ip', model: 'BloqueioIp', scope: 'read:auditoria',
      scalarFields: ['id', 'ip', 'motivo', 'bloqueadoAte', 'createdAt', 'updatedAt'],
      select: { id: true, ip: true, motivo: true, bloqueadoAte: true, createdAt: true, updatedAt: true } as const satisfies Prisma.BloqueioIpSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'ip', type: 'string', scope: 'read:pii' },
        { name: 'motivo', type: 'string', scope: 'read:pii' },
        { name: 'bloqueadoAte', type: 'string', format: 'date-time' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt', maxLimit: 200,
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      searchFields: ['motivo'],
      searchScope: 'read:pii',
      filters: {
        ip: { type: 'string', scope: 'read:pii' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.bloqueioIp.findMany(args as Prisma.BloqueioIpFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.bloqueioIp.findFirst(args as Prisma.BloqueioIpFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          ip: row.ip,
          motivo: row.motivo,
          bloqueadoAte: timestamp(row.bloqueadoAte),
          createdAt: timestamp(row.createdAt),
          updatedAt: timestamp(row.updatedAt),
        }
        return safeRecord(record, ctx, [], [], [])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:auditoria')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.bloqueioIp.count(), db.bloqueioIp.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.updatedAt) : null }
        })
      },
    },
    {
      slug: 'auditoria', model: 'AuditLog', scope: 'read:auditoria',
      scalarFields: ['id', 'actor', 'action', 'target', 'metadata', 'ip', 'userAgent', 'createdAt'],
      select: { id: true, actor: true, action: true, target: true, metadata: true, ip: true, userAgent: true, createdAt: true } as const satisfies Prisma.AuditLogSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'actor', type: 'string', scope: 'read:pii' },
        { name: 'action', type: 'string' },
        { name: 'target', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'metadata', type: 'object', nullable: true, scope: 'read:pii' },
        { name: 'ip', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'userAgent', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt', maxLimit: 200,
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte' },
      searchFields: ['action', 'target'],
      searchScope: 'read:pii',
      filters: {
        actor: { type: 'string', scope: 'read:pii' },
        action: { type: 'string' },
        target: { type: 'string', scope: 'read:pii' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.auditLog.findMany(args as Prisma.AuditLogFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.auditLog.findFirst(args as Prisma.AuditLogFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          actor: row.actor,
          action: row.action,
          target: row.target,
          metadata: row.metadata,
          ip: row.ip,
          userAgent: row.userAgent,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], ['actor', 'target'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:auditoria')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.auditLog.count(), db.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.createdAt) : null }
        })
      },
    },
    {
      slug: 'presencas', model: 'Presenca', scope: 'read:analytics',
      scalarFields: ['id', 'sessaoId', 'path', 'dispositivo', 'ultimoPing'],
      select: { id: true, sessaoId: true, path: true, dispositivo: true, ultimoPing: true } as const satisfies Prisma.PresencaSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'sessaoId', type: 'string', scope: 'read:pii' },
        { name: 'path', type: 'string', nullable: true },
        { name: 'dispositivo', type: 'string', nullable: true },
        { name: 'ultimoPing', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'ultimoPing'], defaultSort: 'ultimoPing', maxLimit: 200,
      dateFields: { updated: 'ultimoPing' },
      window: { from: 'atualizadoDesde', to: 'atualizadoAte' },
      filters: {
        sessaoId: { type: 'string', scope: 'read:pii' },
        dispositivo: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.presenca.findMany(args as Prisma.PresencaFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.presenca.findFirst(args as Prisma.PresencaFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          sessaoId: row.sessaoId,
          path: row.path,
          dispositivo: row.dispositivo,
          ultimoPing: timestamp(row.ultimoPing),
        }
        return safeRecord(record, ctx, [], [], ['path'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.presenca.count(), db.presenca.findFirst({ orderBy: { ultimoPing: 'desc' }, select: { ultimoPing: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.ultimoPing) : null }
        })
      },
    },
    {
      slug: 'trafego-bruto', model: 'TrafegoBruto', scope: 'read:analytics',
      description: 'dia: YYYY-MM-DD comercial de America/Sao_Paulo. criadoDesde/criadoAte usam a data UTC dos parâmetros ISO como rótulos dia inclusivos (não convertem instantes para BRT). ultimaAtualizacao tem granularidade diária: início do último dia comercial disponível em UTC, não timestamp da última inserção.',
      scalarFields: ['id', 'dia', 'hora', 'path', 'dispositivo', 'browser', 'os', 'pais', 'referrer', 'createdAt'],
      select: { id: true, dia: true, hora: true, path: true, dispositivo: true, browser: true, os: true, pais: true, referrer: true, createdAt: true } as const satisfies Prisma.TrafegoBrutoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'dia', type: 'string', format: 'date' },
        { name: 'hora', type: 'integer' },
        { name: 'path', type: 'string' },
        { name: 'dispositivo', type: 'string', nullable: true },
        { name: 'browser', type: 'string', nullable: true },
        { name: 'os', type: 'string', nullable: true },
        { name: 'pais', type: 'string', nullable: true },
        { name: 'referrer', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [],
      sorts: ['id', 'dia'], defaultSort: 'dia', maxLimit: 200,
      dateFields: { created: 'dia' },
      window: { from: 'criadoDesde', to: 'criadoAte' },
      filters: {
        dispositivo: { type: 'string' },
        browser: { type: 'string' },
        os: { type: 'string' },
        pais: { type: 'string' },
        path: { type: 'string' },
        referrer: { type: 'string' },
        hora: { type: 'number', integer: true, min: 0, max: 23 },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.trafegoBruto.findMany({ ...args, where: calendarWhere(args.where) } as Prisma.TrafegoBrutoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.trafegoBruto.findFirst({ ...args, where: calendarWhere(args.where) } as Prisma.TrafegoBrutoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          dia: row.dia,
          hora: row.hora,
          path: row.path,
          dispositivo: row.dispositivo,
          browser: row.browser,
          os: row.os,
          pais: row.pais,
          referrer: row.referrer,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], ['path', 'referrer'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:analytics')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.trafegoBruto.count(), db.trafegoBruto.findFirst({ orderBy: { dia: 'desc' }, select: { dia: true } })])
          return { count, ultimaAtualizacao: latest ? businessDayStart(latest.dia) : null }
        })
      },
    },
    {
      slug: 'bloqueios-fraude', model: 'BloqueioFraude', scope: 'read:auditoria',
      scalarFields: ['id', 'clienteId', 'acao', 'motivo', 'criadoPor', 'createdAt'],
      select: { id: true, clienteId: true, acao: true, motivo: true, criadoPor: true, createdAt: true } as const satisfies Prisma.BloqueioFraudeSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'clienteId', type: 'string' },
        { name: 'acao', type: 'string', enum: ['bloqueio', 'desbloqueio'], description: 'Valores conhecidos; valores desconhecidos permanecem strings e são auditados no rollout.' },
        { name: 'motivo', type: 'string', scope: 'read:pii' },
        { name: 'criadoPor', type: 'string', nullable: true, scope: 'read:pii' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
      ],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt', maxLimit: 200,
      dateFields: { created: 'createdAt' },
      window: { from: 'criadoDesde', to: 'criadoAte' },
      searchFields: ['motivo'],
      searchScope: 'read:pii',
      filters: {
        clienteId: { type: 'string' },
        acao: { type: 'string', values: ['bloqueio', 'desbloqueio'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.bloqueioFraude.findMany(args as Prisma.BloqueioFraudeFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.bloqueioFraude.findFirst(args as Prisma.BloqueioFraudeFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => {
        const record: ResourceRow = {
          id: row.id,
          clienteId: row.clienteId,
          acao: row.acao,
          motivo: row.motivo,
          criadoPor: row.criadoPor,
          createdAt: timestamp(row.createdAt),
        }
        return safeRecord(record, ctx, [], [], ['clienteId'])
      },
      countAndLastUpdate: async ctx => {
        if (!ctx.identity || !hasScope(ctx.identity, 'read:auditoria')) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
        return withQueryTimeout(async () => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const [count, latest] = await Promise.all([db.bloqueioFraude.count(), db.bloqueioFraude.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })])
          return { count, ultimaAtualizacao: latest ? timestamp(latest.createdAt) : null }
        })
      },
    },
  ]
  return definitions
}
