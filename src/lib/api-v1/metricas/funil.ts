import type { PrismaClient } from '@prisma/client'
import { ApiQueryError } from '../query'
import type { ApiContext } from '../types'
import type { MetricDefinition, StoreMetricOptions } from './registry'
import { API_METRIC_MAX_ROWS, API_METRIC_TAKE, boundedMetricRows, bucketForInstant, listMetricBuckets, metricBase, type MetricParams } from './tempo'

export type FunnelEvent = { sessaoId: string; tipo: string; dados: unknown; createdAt: Date }
type TrackedSession = { sessaoId: string; createdAt: Date }
type FunnelStageName = 'view_item' | 'add_to_cart' | 'begin_checkout' | 'pagamento_submit' | 'purchase'
const TECHNICAL_OUTCOMES = new Set(['rejected', 'api_error', 'brick_error'])
const FUNNEL_EVENT_TYPES = ['view_item', 'add_to_cart', 'begin_checkout', 'checkout_payment_outcome', 'purchase'] as const
const FOLLOWUP_EVENT_TYPES = ['checkout_payment_outcome', 'purchase'] as const
const SESSION_BATCH_SIZE = 200
const ACTIVITY_PAGE_SIZE = 500
const FOLLOWUP_HORIZON_MS = 7 * 24 * 60 * 60 * 1000
type ActivityRow = { id: string; sessaoId: string; createdAt: Date }
type LoadedFunnelEvents = {
  periodEvents: FunnelEvent[]
  classificationEvents: FunnelEvent[]
  activeSessionsByBucket: Map<string, Set<string>>
}

async function db(options: StoreMetricOptions): Promise<PrismaClient> {
  return options.prisma ?? (await import('../../prisma')).prisma
}

export function checkoutOutcome(dados: unknown): string | null {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return null
  const outcome = (dados as Record<string, unknown>).outcome
  return typeof outcome === 'string' ? outcome : null
}

export function summarizeCheckoutAbandonment(events: readonly FunnelEvent[], now: Date) {
  const begin = new Set<string>()
  const purchased = new Set<string>()
  const technical = new Set<string>()
  const latest = new Map<string, number>()
  for (const event of events) {
    latest.set(event.sessaoId, Math.max(latest.get(event.sessaoId) ?? Number.NEGATIVE_INFINITY, event.createdAt.getTime()))
    if (event.tipo === 'begin_checkout') begin.add(event.sessaoId)
    if (event.tipo === 'purchase') purchased.add(event.sessaoId)
    if (event.tipo === 'checkout_payment_outcome' && TECHNICAL_OUTCOMES.has(checkoutOutcome(event.dados) ?? '')) technical.add(event.sessaoId)
  }
  const cutoff = now.getTime() - 60 * 60 * 1000
  let comercial = 0
  let tecnico = 0
  let emAndamento = 0
  for (const sessionId of begin) {
    if (purchased.has(sessionId)) continue
    if (technical.has(sessionId)) tecnico += 1
    else if ((latest.get(sessionId) ?? Number.POSITIVE_INFINITY) <= cutoff) comercial += 1
    else emAndamento += 1
  }
  return { comercial, tecnico, emAndamento }
}

export async function loadPeriodAndFollowupEvents(
  client: PrismaClient,
  params: MetricParams,
  now: Date,
): Promise<LoadedFunnelEvents> {
  const activeSessionsByBucket = new Map<string, Set<string>>()
  const latestActivity = new Map<string, Date>()
  const scanActivity = async () => {
    let cursorId: string | undefined
    let scanned = 0
    while (true) {
      const rawPage = await client.eventoTracking.findMany({
        where: { createdAt: { gte: params.from, lt: params.toExclusive } },
        select: { id: true, sessaoId: true, createdAt: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: ACTIVITY_PAGE_SIZE,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      })
      const page = rawPage as unknown as ActivityRow[]
      scanned += page.length
      if (scanned > API_METRIC_MAX_ROWS) throw new ApiQueryError(503, 'Métrica temporariamente indisponível para este volume de dados.')
      for (const row of page) {
        const bucketName = bucketForInstant(row.createdAt, params.agrupar)
        const sessions = activeSessionsByBucket.get(bucketName) ?? new Set<string>()
        sessions.add(row.sessaoId)
        activeSessionsByBucket.set(bucketName, sessions)
        const latest = latestActivity.get(row.sessaoId)
        if (!latest || row.createdAt > latest) latestActivity.set(row.sessaoId, row.createdAt)
      }
      if (page.length < ACTIVITY_PAGE_SIZE) break
      cursorId = page[page.length - 1].id
    }
  }
  const [rawStageEvents] = await Promise.all([
    client.eventoTracking.findMany({
      where: { createdAt: { gte: params.from, lt: params.toExclusive }, tipo: { in: [...FUNNEL_EVENT_TYPES] } },
      select: { sessaoId: true, tipo: true, dados: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: API_METRIC_TAKE,
    }),
    scanActivity(),
  ])
  const stageEvents = boundedMetricRows(rawStageEvents as unknown as FunnelEvent[])
  const activityEvents = [...latestActivity].map(([sessaoId, createdAt]) => ({ sessaoId, tipo: 'activity', dados: null, createdAt }))
  const periodEvents = [...stageEvents, ...activityEvents]
  const checkoutSessions = [...new Set(stageEvents.filter(event => event.tipo === 'begin_checkout').map(event => event.sessaoId))]
  const followupEnd = new Date(Math.min(now.getTime(), params.toExclusive.getTime() + FOLLOWUP_HORIZON_MS))
  if (checkoutSessions.length === 0 || followupEnd.getTime() <= params.toExclusive.getTime()) return { periodEvents, classificationEvents: periodEvents, activeSessionsByBucket }

  const followup: FunnelEvent[] = []
  for (let index = 0; index < checkoutSessions.length; index += SESSION_BATCH_SIZE) {
    const sessionIds = checkoutSessions.slice(index, index + SESSION_BATCH_SIZE)
    const [rawOutcomes, rawFollowupActivity] = await Promise.all([
      client.eventoTracking.findMany({
        where: {
          sessaoId: { in: sessionIds },
          tipo: { in: [...FOLLOWUP_EVENT_TYPES] },
          createdAt: { gte: params.toExclusive, lt: followupEnd },
        },
        select: { sessaoId: true, tipo: true, dados: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: API_METRIC_TAKE,
      }),
      client.eventoTracking.groupBy({
        by: ['sessaoId'],
        where: { sessaoId: { in: sessionIds }, createdAt: { gte: params.toExclusive, lt: followupEnd } },
        _max: { createdAt: true },
      }),
    ])
    followup.push(...boundedMetricRows(rawOutcomes as unknown as FunnelEvent[]))
    if (followup.length > API_METRIC_MAX_ROWS) throw new ApiQueryError(503, 'Métrica temporariamente indisponível para este volume de dados.')
    for (const row of rawFollowupActivity as unknown as Array<{ sessaoId: string; _max: { createdAt: Date | null } }>) {
      if (row._max.createdAt) followup.push({ sessaoId: row.sessaoId, tipo: 'activity', dados: null, createdAt: row._max.createdAt })
    }
  }
  return { periodEvents, classificationEvents: [...periodEvents, ...followup], activeSessionsByBucket }
}

function percentage(value: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((value / denominator) * 10_000) / 100
}

export function createFunilMetric(options: StoreMetricOptions = {}): MetricDefinition<{
  timezone: string
  periodo: MetricParams['periodo']
  definicoes: Record<string, string>
  tracked: true
  etapas: Array<{ etapa: string; sessoes: number; taxaDaAnterior: number; taxaDaSessao: number }>
  abandonoCheckout: { comercial: number; tecnico: number; emAndamento: number }
  serie: Array<{ bucket: string; sessoes: number; viewItem: number; addToCart: number; beginCheckout: number; pagamentoSubmit: number; purchase: number }>
}> {
  return {
    slug: 'funil',
    scope: 'read:analytics',
    schema: { type: 'object', required: ['timezone', 'periodo', 'definicoes', 'tracked', 'etapas', 'abandonoCheckout', 'serie'] },
    async query(_ctx: ApiContext, params: MetricParams) {
      const client = await db(options)
      const now = options.now?.() ?? new Date()
      const [rawSessions, loadedEvents] = await Promise.all([
        client.sessaoVisitante.findMany({
          where: { createdAt: { gte: params.from, lt: params.toExclusive } },
          select: { sessaoId: true, createdAt: true },
          take: API_METRIC_TAKE,
        }),
        loadPeriodAndFollowupEvents(client, params, now),
      ])
      const sessions = boundedMetricRows(rawSessions as unknown as TrackedSession[])
      const events = loadedEvents.periodEvents
      const stages = {
        sessoes: new Set(sessions.map(session => session.sessaoId)),
        view_item: new Set<string>(),
        add_to_cart: new Set<string>(),
        begin_checkout: new Set<string>(),
        pagamento_submit: new Set<string>(),
        purchase: new Set<string>(),
      }
      const progress = new Map<string, number>()
      const progression = new Map<FunnelEvent, FunnelStageName>()
      for (const event of [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
        stages.sessoes.add(event.sessaoId)
        const state = progress.get(event.sessaoId) ?? 0
        let next: FunnelStageName | null = null
        if (state === 0 && event.tipo === 'view_item') next = 'view_item'
        else if (state === 1 && event.tipo === 'add_to_cart') next = 'add_to_cart'
        else if (state === 2 && event.tipo === 'begin_checkout') next = 'begin_checkout'
        else if (state === 3 && event.tipo === 'checkout_payment_outcome' && checkoutOutcome(event.dados) === 'submit') next = 'pagamento_submit'
        else if (state === 4 && event.tipo === 'purchase') next = 'purchase'
        if (next) {
          progress.set(event.sessaoId, state + 1)
          stages[next].add(event.sessaoId)
          progression.set(event, next)
        }
      }
      const ordered = [
        ['sessoes', stages.sessoes.size],
        ['view_item', stages.view_item.size],
        ['add_to_cart', stages.add_to_cart.size],
        ['begin_checkout', stages.begin_checkout.size],
        ['pagamento_submit', stages.pagamento_submit.size],
        ['purchase', stages.purchase.size],
      ] as const
      const series = new Map(listMetricBuckets(params).map(bucket => [bucket, {
        bucket, sessoes: new Set<string>(), viewItem: new Set<string>(), addToCart: new Set<string>(), beginCheckout: new Set<string>(), pagamentoSubmit: new Set<string>(), purchase: new Set<string>(),
      }]))
      for (const session of sessions) series.get(bucketForInstant(session.createdAt, params.agrupar))?.sessoes.add(session.sessaoId)
      for (const [bucketName, activeSessions] of loadedEvents.activeSessionsByBucket) {
        const bucket = series.get(bucketName)
        if (bucket) for (const sessionId of activeSessions) bucket.sessoes.add(sessionId)
      }
      for (const event of events) {
        const bucket = series.get(bucketForInstant(event.createdAt, params.agrupar))
        if (!bucket) continue
        bucket.sessoes.add(event.sessaoId)
        const reached = progression.get(event)
        if (reached === 'view_item') bucket.viewItem.add(event.sessaoId)
        if (reached === 'add_to_cart') bucket.addToCart.add(event.sessaoId)
        if (reached === 'begin_checkout') bucket.beginCheckout.add(event.sessaoId)
        if (reached === 'purchase') bucket.purchase.add(event.sessaoId)
        if (reached === 'pagamento_submit') bucket.pagamentoSubmit.add(event.sessaoId)
      }
      const definicoes = {
        funil: 'Sessões distintas tracked criadas ou ativas em cada bucket: atividade é paginada serialmente por (createdAt,id), sem JSON; sessão → view_item → add_to_cart → begin_checkout → checkout_payment_outcome.outcome=submit → purchase.',
        abandonoComercial: 'Sessão com begin_checkout, sem purchase e sem outcome técnico, inativa por >= 1h; atividade posterior é observada por até 7 dias após o período, em lotes de 200 sessões.',
        abandonoTecnico: 'Sessão sem purchase com checkout_payment_outcome em rejected|api_error|brick_error; prevalece sobre abandono comercial.',
        cobertura: 'tracked=true: EventoTracking e SessaoVisitante dependem de consentimento analítico; não representam tráfego sem consentimento.',
      }
      return {
        ...metricBase(params, definicoes),
        tracked: true as const,
        etapas: ordered.map(([etapa, count], index) => ({
          etapa,
          sessoes: count,
          taxaDaAnterior: percentage(count, index === 0 ? count : ordered[index - 1][1]),
          taxaDaSessao: percentage(count, ordered[0][1]),
        })),
        abandonoCheckout: summarizeCheckoutAbandonment(loadedEvents.classificationEvents, now),
        serie: [...series.values()].map(value => ({
          bucket: value.bucket,
          sessoes: value.sessoes.size,
          viewItem: value.viewItem.size,
          addToCart: value.addToCart.size,
          beginCheckout: value.beginCheckout.size,
          pagamentoSubmit: value.pagamentoSubmit.size,
          purchase: value.purchase.size,
        })),
      }
    },
  }
}
