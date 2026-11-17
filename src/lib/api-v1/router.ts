import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { hasScope } from './auth'
import { API_BASE_PATH, API_MAX_LIMIT, API_QUERY_TIMEOUT_MS, API_VERSION } from './constants'
import { iso, itemEnvelope, listEnvelope } from './format'
import { createStoreMetricRegistry, type MetricRegistry } from './metricas/registry'
import { buildOpenApi } from './openapi'
import { withApiV1, type ApiV1Options } from './pipeline'
import { problem } from './problem'
import { ApiQueryError, parseExpand, parseListQuery } from './query'
import { rateLimitApiPublic } from './rate-limit'
import { createResourceRegistry, type ResourceRegistry } from './registry'
import { executeItem, executeList, withQueryTimeout, type FieldSchema, type ResourceDefinition } from './resource'
import { createAnalyticsResources } from './resources/analytics'
import { createCatalogResources, SAFE_CONFIGURATION_KEYS } from './resources/catalogo'
import { createCustomerResources } from './resources/clientes'
import { createMarketingResources } from './resources/marketing'
import { createCommerceResources } from './resources/vendas'
import { safeClientIp } from './audit'
import type { ApiContext, ApiScope, JsonValue, ListQuery, RateLimitResult } from './types'

const ALLOW = 'GET, HEAD, OPTIONS'
const DEFAULT_META_CONCURRENCY = 2
const STATIC_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'
const HEALTH_CACHE_MS = 5_000
const META_CACHE_MS = 60_000

type Env = Record<string, string | undefined>
type StatsDelegate = {
  count(args?: { where: Record<string, unknown> }): Promise<number>
  findFirst(args: { where?: Record<string, unknown>; orderBy: Record<string, 'desc'>; select: Record<string, true> }): Promise<Record<string, unknown> | null>
}

export type StoreResourceRegistryOptions = { prisma?: PrismaClient }
export type RouterDeps = {
  resources?: ResourceRegistry
  metrics?: MetricRegistry
  pipelineDeps?: ApiV1Options['deps']
  healthCheck?: () => Promise<unknown>
  publicRateLimit?: (id: string) => Promise<RateLimitResult>
  openApiDocument?: () => Promise<unknown> | unknown
  env?: Env
  now?: () => Date
  cursorSecret?: string
  metaTimeoutMs?: number
}

function statsHook(
  prisma: PrismaClient | undefined,
  scope: ApiScope,
  delegate: (client: PrismaClient) => StatsDelegate,
  field: string,
  where?: Record<string, unknown>,
): ResourceDefinition['countAndLastUpdate'] {
  return async ctx => {
    if (!ctx.identity || !hasScope(ctx.identity, scope)) throw new ApiQueryError(403, 'Escopo necessário não autorizado.')
    return withQueryTimeout(async () => {
      const client = prisma ?? (await import('../prisma')).prisma
      const model = delegate(client)
      const [count, latest] = await Promise.all([
        model.count(where ? { where } : undefined),
        model.findFirst({ ...(where ? { where } : {}), orderBy: { [field]: 'desc' }, select: { [field]: true } }),
      ])
      const value = latest?.[field]
      return { count, ultimaAtualizacao: value === null || value === undefined ? null : iso(value as Date) }
    }, API_QUERY_TIMEOUT_MS, { drain: true })
  }
}

/**
 * Static model wiring only. The URL is resolved against ResourceRegistry first and
 * never becomes a Prisma property name.
 */
function attachStoreStats(definitions: ResourceDefinition[], prisma?: PrismaClient): void {
  const hooks: Record<string, ResourceDefinition['countAndLastUpdate']> = {
    clientes: statsHook(prisma, 'read:clientes', client => client.cliente as unknown as StatsDelegate, 'updatedAt'),
    enderecos: statsHook(prisma, 'read:clientes', client => client.endereco as unknown as StatsDelegate, 'updatedAt'),
    'historico-pontos': statsHook(prisma, 'read:clientes', client => client.historicoPontos as unknown as StatsDelegate, 'createdAt'),
    'pontos-clientes': statsHook(prisma, 'read:clientes', client => client.pontosCliente as unknown as StatsDelegate, 'updatedAt'),
    'cashback-transacoes': statsHook(prisma, 'read:clientes', client => client.cashbackTransacao as unknown as StatsDelegate, 'updatedAt'),
    'niveis-fidelidade': statsHook(prisma, 'read:clientes', client => client.nivelFidelidade as unknown as StatsDelegate, 'updatedAt'),
    produtos: statsHook(prisma, 'read:catalogo', client => client.produto as unknown as StatsDelegate, 'updatedAt'),
    avaliacoes: statsHook(prisma, 'read:catalogo', client => client.avaliacao as unknown as StatsDelegate, 'updatedAt'),
    'avaliacoes-fotos': statsHook(prisma, 'read:catalogo', client => client.avaliacaoFoto as unknown as StatsDelegate, 'createdAt'),
    banners: statsHook(prisma, 'read:catalogo', client => client.banner as unknown as StatsDelegate, 'updatedAt'),
    configuracoes: statsHook(prisma, 'read:configuracoes', client => client.configuracao as unknown as StatsDelegate, 'updatedAt', { chave: { in: [...SAFE_CONFIGURATION_KEYS] } }),
    'formas-pagamento': statsHook(prisma, 'read:catalogo', client => client.formaPagamento as unknown as StatsDelegate, 'updatedAt'),
    'produtos-destaques': statsHook(prisma, 'read:catalogo', client => client.produtoDestaque as unknown as StatsDelegate, 'createdAt'),
    'variacoes-produto': statsHook(prisma, 'read:catalogo', client => client.variacaoProduto as unknown as StatsDelegate, 'updatedAt'),
    'frete-regras': statsHook(prisma, 'read:catalogo', client => client.freteRegra as unknown as StatsDelegate, 'atualizadoEm'),
    'email-templates': statsHook(prisma, 'read:configuracoes', client => client.emailTemplate as unknown as StatsDelegate, 'updatedAt'),
    'avaliacoes-parceiros': statsHook(prisma, 'read:catalogo', client => client.avaliacaoParceiro as unknown as StatsDelegate, 'updatedAt'),
    'popup-inicial': statsHook(prisma, 'read:catalogo', client => client.popupInicial as unknown as StatsDelegate, 'updatedAt'),
    pedidos: statsHook(prisma, 'read:pedidos', client => client.pedido as unknown as StatsDelegate, 'updatedAt'),
    'garantias-estendidas': statsHook(prisma, 'read:pedidos', client => client.garantiaEstendida as unknown as StatsDelegate, 'updatedAt'),
    pagamentos: statsHook(prisma, 'read:pedidos', client => client.pagamento as unknown as StatsDelegate, 'updatedAt'),
    'tentativas-multimetodo': statsHook(prisma, 'read:pedidos', client => client.tentativaMultiMetodo as unknown as StatsDelegate, 'updatedAt'),
    'itens-pedido': statsHook(prisma, 'read:pedidos', client => client.itemPedido as unknown as StatsDelegate, 'updatedAt'),
    carrinhos: statsHook(prisma, 'read:pedidos', client => client.carrinho as unknown as StatsDelegate, 'createdAt'),
    'itens-carrinho': statsHook(prisma, 'read:pedidos', client => client.itemCarrinho as unknown as StatsDelegate, 'updatedAt'),
    cupons: statsHook(prisma, 'read:pedidos', client => client.cupom as unknown as StatsDelegate, 'updatedAt'),
    'cupons-usos': statsHook(prisma, 'read:pedidos', client => client.cupomUso as unknown as StatsDelegate, 'usadoEm'),
    'carrinhos-clientes': statsHook(prisma, 'read:pedidos', client => client.carrinhoCliente as unknown as StatsDelegate, 'atualizadoEm'),
    'lista-espera': statsHook(prisma, 'read:marketing', client => client.listaEspera as unknown as StatsDelegate, 'updatedAt'),
    campanhas: statsHook(prisma, 'read:marketing', client => client.campanha as unknown as StatsDelegate, 'updatedAt'),
    'campanhas-destinatarios': statsHook(prisma, 'read:marketing', client => client.campanhaDestinatario as unknown as StatsDelegate, 'updatedAt'),
    'whatsapp-numeros': statsHook(prisma, 'read:configuracoes', client => client.whatsappNumero as unknown as StatsDelegate, 'updatedAt'),
    'envios-logs': statsHook(prisma, 'read:marketing', client => client.envioLog as unknown as StatsDelegate, 'createdAt'),
    'luna-conversas': statsHook(prisma, 'read:mensagens', client => client.lunaConversa as unknown as StatsDelegate, 'updatedAt'),
    'luna-mensagens': statsHook(prisma, 'read:mensagens', client => client.lunaMensagem as unknown as StatsDelegate, 'createdAt'),
    'solicitacoes-parceiros': statsHook(prisma, 'read:marketing', client => client.solicitacaoParceiro as unknown as StatsDelegate, 'updatedAt'),
    'mensagens-contato': statsHook(prisma, 'read:mensagens', client => client.mensagemContato as unknown as StatsDelegate, 'updatedAt'),
  }
  for (const definition of definitions) {
    if (!definition.countAndLastUpdate) definition.countAndLastUpdate = hooks[definition.slug]
    if (!definition.countAndLastUpdate) throw new TypeError(`Missing metadata stats for ${definition.slug}`)
  }
}

export function createStoreResourceRegistry(options: StoreResourceRegistryOptions = {}): ResourceRegistry {
  const definitions: ResourceDefinition[] = []
  const resolve = (slug: string): ResourceDefinition => {
    const definition = definitions.find(item => item.slug === slug)
    if (!definition) throw new TypeError(`Unregistered expansion resource: ${slug}`)
    return definition
  }
  definitions.push(
    ...createCustomerResources({ prisma: options.prisma, resolve }),
    ...createCatalogResources({ prisma: options.prisma, resolve }),
    ...createCommerceResources({ prisma: options.prisma, resolve }),
    ...createMarketingResources({ prisma: options.prisma, resolve }),
    ...createAnalyticsResources({ prisma: options.prisma, resolve }),
  )
  attachStoreStats(definitions, options.prisma)
  const registry = createResourceRegistry(definitions)
  if (registry.size !== 49) throw new TypeError('Store API registry must contain exactly 49 business resources')
  return registry
}

let defaultResources: ResourceRegistry | undefined
let defaultMetrics: MetricRegistry | undefined
function resources(deps: RouterDeps): ResourceRegistry {
  return deps.resources ?? (defaultResources ??= createStoreResourceRegistry())
}
function metrics(deps: RouterDeps): MetricRegistry {
  return deps.metrics ?? (defaultMetrics ??= createStoreMetricRegistry())
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}

function finalizePublic(response: Response, requestId: string, cacheControl = 'no-store', rateLimit?: RateLimitResult): Response {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', cacheControl)
  headers.set('X-Request-Id', requestId)
  if (rateLimit) {
    headers.set('X-RateLimit-Limit', String(rateLimit.limit))
    headers.set('X-RateLimit-Remaining', String(Math.max(0, rateLimit.remaining)))
    headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.reset / 1000)))
  }
  for (const key of [...headers.keys()]) if (key.startsWith('access-control-')) headers.delete(key)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function guardPublic(request: Request, requestId: string, deps: RouterDeps): Promise<RateLimitResult | Response> {
  let result: RateLimitResult
  try {
    result = await (deps.publicRateLimit ?? rateLimitApiPublic)(safeClientIp(request))
  } catch {
    return finalizePublic(problem(503, 'Serviço indisponível', 'Controle de tráfego temporariamente indisponível.', requestId), requestId)
  }
  if (result.success) return result
  const response = problem(429, 'Muitas requisições', 'Limite de requisições excedido.', requestId)
  response.headers.set('Retry-After', String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))))
  return finalizePublic(response, requestId, 'no-store', result)
}

function noBody(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(null, { status: response.status, statusText: response.statusText, headers })
}

function queryProblem(error: ApiQueryError, requestId: string): Response {
  const titles: Record<ApiQueryError['status'], string> = {
    400: 'Requisição inválida',
    403: 'Acesso negado',
    404: 'Não encontrado',
    503: 'Serviço indisponível',
  }
  return problem(error.status, titles[error.status], error.message, requestId)
}

function protectedHandler(
  handler: (request: Request, context: ApiContext) => Promise<Response> | Response,
  options: Omit<ApiV1Options, 'deps'>,
  deps: RouterDeps,
): (request: Request) => Promise<Response> {
  return withApiV1(async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof ApiQueryError) return queryProblem(error, context.requestId)
      throw error
    }
  }, { ...options, deps: deps.pipelineDeps })
}

function csv(value: string, max: number): string[] {
  const values = [...new Set(value.split(',').map(part => part.trim()))].sort()
  if (!values.length || values.length > max || values.some(part => !part || part.length > 500)) throw new ApiQueryError(400)
  return values
}

function parseItemQuery(request: Request, definition: ResourceDefinition): Pick<ListQuery, 'fields' | 'expand'> {
  const params = new URL(request.url).searchParams
  for (const key of params.keys()) if (!['fields', 'expand'].includes(key) || params.getAll(key).length !== 1) throw new ApiQueryError(400)
  const query: Pick<ListQuery, 'fields' | 'expand'> = {}
  if (params.has('fields')) {
    query.fields = [...new Set(['id', ...csv(params.get('fields')!, definition.fields.length)])].sort()
    if (query.fields.some(name => !definition.fields.some(field => field.name === name))) throw new ApiQueryError(400)
  }
  if (params.has('expand')) query.expand = parseExpand(params.get('expand')!, definition)
  return query
}

function assertQueryParams(request: Request, allowed: readonly string[] = []): void {
  const params = new URL(request.url).searchParams
  const names = new Set(allowed)
  for (const key of params.keys()) {
    if (!names.has(key) || params.getAll(key).length !== 1) throw new ApiQueryError(400, 'Parâmetros de consulta inválidos.')
  }
}

function safeSchema(schema: FieldSchema): Record<string, JsonValue> {
  const output: Record<string, JsonValue> = { type: schema.type }
  if (schema.format) output.format = schema.format
  if (schema.nullable !== undefined) output.nullable = schema.nullable
  if (schema.enum) output.enum = [...schema.enum]
  if (schema.items) output.items = safeSchema(schema.items)
  if (schema.properties) output.properties = Object.fromEntries(Object.entries(schema.properties).map(([name, child]) => [name, safeSchema(child)]))
  if (schema.required) output.required = [...schema.required]
  return output
}

async function deadlineMap<T, U>(items: readonly T[], concurrency: number, timeoutMs: number, task: (item: T) => Promise<U>): Promise<U[]> {
  const output = new Array<U>(items.length)
  let expired = false
  const timer = setTimeout(() => { expired = true }, timeoutMs)
  try {
    for (let offset = 0; offset < items.length; offset += concurrency) {
      if (expired) throw new ApiQueryError(503, 'Consulta temporariamente indisponível.')
      const batch = items.slice(offset, offset + concurrency)
      // No later batch starts after expiry; already-started Prisma work drains
      // because cancellation is not available on Prisma promises.
      const settled = await Promise.allSettled(batch.map(item => task(item)))
      if (expired) throw new ApiQueryError(503, 'Consulta temporariamente indisponível.')
      const rejected = settled.find(result => result.status === 'rejected')
      if (rejected?.status === 'rejected') throw rejected.reason
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') output[offset + index] = result.value
      })
    }
    return output
  } finally {
    clearTimeout(timer)
  }
}

async function resourceMetadata(registry: ResourceRegistry, context: ApiContext, timeoutMs: number): Promise<Record<string, unknown>[]> {
  const authorized = registry.list(context.identity ?? undefined)
  return deadlineMap(authorized, DEFAULT_META_CONCURRENCY, timeoutMs, async definition => {
    const stats = await definition.countAndLastUpdate!(context)
    const fields = definition.fields
      .filter(field => !field.scope || (context.identity && hasScope(context.identity, field.scope)))
      .map(field => ({
        name: field.name,
        ...safeSchema(field),
        ...(field.description ? { description: field.description } : {}),
        ...(field.scope ? { scope: field.scope } : {}),
      }))
    const expands = definition.expands.flatMap(expand => {
      const child = expand.resource()
      if (!context.identity || !hasScope(context.identity, child.scope) || (expand.scope && !hasScope(context.identity, expand.scope))) return []
      return [{
        name: expand.name,
        resource: child.slug,
        many: expand.many,
        ...(expand.scope ? { scope: expand.scope } : {}),
        ...(expand.description ? { description: expand.description } : {}),
      }]
    })
    return {
      slug: definition.slug,
      model: definition.model,
      scope: definition.scope,
      fields,
      expands,
      count: stats.count,
      ultimaAtualizacao: stats.ultimaAtualizacao,
      sync: syncContract(definition),
      deprecated: definition.deprecated ?? false,
      ...(definition.description ? { description: definition.description } : {}),
    }
  })
}

function syncContract(definition: ResourceDefinition): Record<string, unknown> {
  const windowFrom = definition.window?.from
  const updated = definition.dateFields?.updated
  const created = definition.dateFields?.created
  const watermarkField = windowFrom?.startsWith('atualizado') ? updated : windowFrom?.startsWith('criado') ? created : updated ?? created
  if (!watermarkField || !definition.sorts.includes(watermarkField)) throw new TypeError(`Missing sortable sync clock for ${definition.slug}`)
  const updatedClock = watermarkField === updated
  return {
    sort: watermarkField,
    watermarkField,
    from: updatedClock ? 'atualizadoDesde' : 'criadoDesde',
    to: updatedClock ? 'atualizadoAte' : 'criadoAte',
    maxDays: null,
    maxLimit: Math.min(API_MAX_LIMIT, definition.maxLimit ?? API_MAX_LIMIT),
  }
}

type CacheEntry<T> = { expiresAt: number; promise: Promise<T> }
const metadataCache = new WeakMap<ResourceRegistry, Map<string, CacheEntry<Record<string, unknown>[]>>>()
async function cachedResourceMetadata(registry: ResourceRegistry, context: ApiContext, timeoutMs: number): Promise<Record<string, unknown>[]> {
  const key = `${[...(context.identity?.scopes ?? [])].sort().join(',')}:${timeoutMs}`
  const entries = metadataCache.get(registry) ?? new Map<string, CacheEntry<Record<string, unknown>[]>>()
  metadataCache.set(registry, entries)
  const current = entries.get(key)
  if (current && current.expiresAt > Date.now()) return current.promise
  const promise = resourceMetadata(registry, context, timeoutMs)
  entries.set(key, { expiresAt: Date.now() + META_CACHE_MS, promise })
  promise.catch(() => { if (entries.get(key)?.promise === promise) entries.delete(key) })
  return promise
}

async function defaultHealthCheck(): Promise<void> {
  const { prisma } = await import('../prisma')
  await withQueryTimeout(() => prisma.$queryRaw`SELECT 1`)
}

const healthCache = new WeakMap<() => Promise<unknown>, CacheEntry<unknown>>()
async function cachedHealthCheck(check: () => Promise<unknown>): Promise<void> {
  const current = healthCache.get(check)
  if (current && current.expiresAt > Date.now()) { await current.promise; return }
  const promise = Promise.resolve().then(check)
  healthCache.set(check, { expiresAt: Date.now() + HEALTH_CACHE_MS, promise })
  promise.catch(() => { if (healthCache.get(check)?.promise === promise) healthCache.delete(check) })
  await promise
}

let cachedOpenApiDocument: Record<string, unknown> | undefined
let cachedOpenApiBody: string | undefined
function defaultOpenApiDocument(): Record<string, unknown> {
  return cachedOpenApiDocument ??= buildOpenApi(resources({}), metrics({})) as unknown as Record<string, unknown>
}

function defaultOpenApiResponse(): Response {
  cachedOpenApiBody ??= JSON.stringify(defaultOpenApiDocument())
  return new Response(cachedOpenApiBody, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}

function docsResponse(): Response {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sixxis Store API v1</title></head><body><main><h1>Sixxis Store API v1</h1><p>API somente leitura para integrações autorizadas.</p><p><a href="${API_BASE_PATH}/openapi.json">Baixar especificação OpenAPI 3.1</a></p><p>Envie credenciais Bearer apenas no seu cliente de integração. Esta página não coleta credenciais.</p></main></body></html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function dispatchGet(request: Request, segments: readonly string[], deps: RouterDeps): Promise<Response> {
  const exact = (...expected: string[]) => segments.length === expected.length && expected.every((segment, index) => segments[index] === segment)
  if (segments.length === 0) {
    const requestId = randomUUID()
    try {
      assertQueryParams(request)
    } catch (error) {
      if (error instanceof ApiQueryError) return finalizePublic(queryProblem(error, requestId), requestId)
      throw error
    }
    return finalizePublic(jsonResponse(itemEnvelope({
      name: 'Sixxis Store API de Leitura',
      version: API_VERSION,
      links: {
        health: `${API_BASE_PATH}/health`,
        openapi: `${API_BASE_PATH}/openapi.json`,
        docs: `${API_BASE_PATH}/docs`,
        me: `${API_BASE_PATH}/me`,
        recursos: `${API_BASE_PATH}/meta/recursos`,
        recurso: `${API_BASE_PATH}/{recurso}`,
        metrica: `${API_BASE_PATH}/metricas/{metrica}`,
      },
    }, requestId)), requestId)
  }
  if (exact('health')) {
    const requestId = randomUUID()
    const publicLimit = await guardPublic(request, requestId, deps)
    if (publicLimit instanceof Response) return publicLimit
    try {
      assertQueryParams(request)
    } catch (error) {
      if (error instanceof ApiQueryError) return finalizePublic(queryProblem(error, requestId), requestId)
      throw error
    }
    try {
      await cachedHealthCheck(deps.healthCheck ?? defaultHealthCheck)
      const env = deps.env ?? process.env
      const commit = env.RAILWAY_GIT_COMMIT_SHA || env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      const time = iso((deps.now ?? (() => new Date()))())
      return finalizePublic(jsonResponse({ status: 'ok', version: API_VERSION, commit, time }), requestId, 'no-store', publicLimit)
    } catch {
      return finalizePublic(problem(503, 'Serviço indisponível', 'Banco de dados temporariamente indisponível.', requestId), requestId, 'no-store', publicLimit)
    }
  }
  if (exact('openapi.json')) {
    const requestId = randomUUID()
    const publicLimit = await guardPublic(request, requestId, deps)
    if (publicLimit instanceof Response) return publicLimit
    try {
      assertQueryParams(request)
      const response = deps.openApiDocument ? jsonResponse(await deps.openApiDocument()) : defaultOpenApiResponse()
      return finalizePublic(response, requestId, STATIC_CACHE_CONTROL, publicLimit)
    } catch (error) {
      if (error instanceof ApiQueryError) return finalizePublic(queryProblem(error, requestId), requestId, 'no-store', publicLimit)
      return finalizePublic(problem(500, 'Erro interno', 'Não foi possível processar a requisição.', requestId), requestId)
    }
  }
  if (exact('docs')) {
    const requestId = randomUUID()
    const publicLimit = await guardPublic(request, requestId, deps)
    if (publicLimit instanceof Response) return publicLimit
    try {
      assertQueryParams(request)
      return finalizePublic(docsResponse(), requestId, STATIC_CACHE_CONTROL, publicLimit)
    } catch (error) {
      if (error instanceof ApiQueryError) return finalizePublic(queryProblem(error, requestId), requestId)
      throw error
    }
  }

  if (exact('me')) {
    return protectedHandler((_request, context) => {
      assertQueryParams(request)
      const key = context.identity!
      return jsonResponse(itemEnvelope({
        nome: key.nome,
        prefixo: key.prefixo,
        escopos: [...key.scopes].sort(),
        expiraEm: key.expiraEm ? iso(key.expiraEm) : null,
        semLimite: true,
      }, context.requestId))
    }, { auditRoute: `${API_BASE_PATH}/me` }, deps)(request)
  }

  if (exact('meta', 'recursos')) {
    return protectedHandler(async (_request, context) => {
      assertQueryParams(request)
      const data = await cachedResourceMetadata(resources(deps), context, deps.metaTimeoutMs ?? API_QUERY_TIMEOUT_MS)
      return jsonResponse(listEnvelope(data, { hasMore: false, nextCursor: null }, context.requestId))
    }, { auditRoute: `${API_BASE_PATH}/meta/recursos` }, deps)(request)
  }

  if (segments.length === 2 && segments[0] === 'metricas') {
    const definition = metrics(deps).get(segments[1])
    if (definition) {
      return protectedHandler(async (_request, context) => {
        assertQueryParams(request, ['de', 'ate', 'agrupar'])
        const data = await metrics(deps).execute(definition.slug, context, new URL(request.url).searchParams)
        return jsonResponse(itemEnvelope(data, context.requestId))
      }, { scope: definition.scope, auditRoute: `${API_BASE_PATH}/metricas/${definition.slug}` }, deps)(request)
    }
  }

  if (segments.length === 1 || segments.length === 2) {
    const definition = resources(deps).get(segments[0])
    if (definition) {
      const auditRoute = `${API_BASE_PATH}/${definition.slug}${segments.length === 2 ? '/:id' : ''}`
      return protectedHandler(async (_request, context) => {
        if (segments.length === 1) {
          const query = parseListQuery(new URL(request.url), definition, { cursorSecret: deps.cursorSecret })
          return jsonResponse(await executeList(definition, context, query, { cursorSecret: deps.cursorSecret }))
        }
        return jsonResponse(await executeItem(definition, context, segments[1], parseItemQuery(request, definition)))
      }, { scope: definition.scope, auditRoute }, deps)(request)
    }
  }

  return protectedHandler((_request, context) => queryProblem(new ApiQueryError(404, 'Endpoint não encontrado.'), context.requestId), {}, deps)(request)
}

/** Single explicit dispatcher for both root and catch-all Next Route Handlers. */
export async function routeApiV1(request: Request, segments: readonly string[], deps: RouterDeps = {}): Promise<Response> {
  const method = request.method.toUpperCase()
  if (method === 'OPTIONS') {
    const requestId = randomUUID()
    return finalizePublic(new Response(null, { status: 204, headers: { Allow: ALLOW } }), requestId)
  }
  if (!['GET', 'HEAD'].includes(method)) {
    const requestId = randomUUID()
    const response = problem(405, 'Método não permitido', 'Somente GET, HEAD e OPTIONS são aceitos.', requestId)
    response.headers.set('Allow', ALLOW)
    return finalizePublic(response, requestId)
  }
  const response = await dispatchGet(request, segments, deps)
  return method === 'HEAD' ? noBody(response) : response
}
