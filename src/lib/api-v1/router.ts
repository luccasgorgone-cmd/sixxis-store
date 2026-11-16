import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { hasScope } from './auth'
import { API_BASE_PATH, API_QUERY_TIMEOUT_MS, API_VERSION } from './constants'
import { iso, itemEnvelope, listEnvelope } from './format'
import { createStoreMetricRegistry, type MetricRegistry } from './metricas/registry'
import { withApiV1, type ApiV1Options } from './pipeline'
import { problem } from './problem'
import { ApiQueryError, parseExpand, parseListQuery } from './query'
import { createResourceRegistry, type ResourceRegistry } from './registry'
import { executeItem, executeList, withQueryTimeout, type FieldSchema, type ResourceDefinition } from './resource'
import { createAnalyticsResources } from './resources/analytics'
import { createCatalogResources, SAFE_CONFIGURATION_KEYS } from './resources/catalogo'
import { createCustomerResources } from './resources/clientes'
import { createMarketingResources } from './resources/marketing'
import { createCommerceResources } from './resources/vendas'
import type { ApiContext, ApiScope, JsonValue, ListQuery } from './types'

const ALLOW = 'GET, HEAD, OPTIONS'
const DEFAULT_META_CONCURRENCY = 4

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
    })
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

function finalizePublic(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Request-Id', requestId)
  for (const key of [...headers.keys()]) if (key.startsWith('access-control-')) headers.delete(key)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
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

async function concurrentMap<T, U>(items: readonly T[], concurrency: number, task: (item: T) => Promise<U>): Promise<U[]> {
  const output = new Array<U>(items.length)
  let next = 0
  let stopped = false
  const worker = async () => {
    while (!stopped) {
      const index = next++
      if (index >= items.length) return
      try {
        output[index] = await task(items[index])
      } catch (error) {
        stopped = true
        throw error
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return output
}

async function resourceMetadata(registry: ResourceRegistry, context: ApiContext, timeoutMs: number): Promise<Record<string, unknown>[]> {
  const authorized = registry.list(context.identity ?? undefined)
  return concurrentMap(authorized, DEFAULT_META_CONCURRENCY, async definition => {
    const stats = await withQueryTimeout(
      () => definition.countAndLastUpdate!((context)),
      timeoutMs,
    )
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
      deprecated: definition.deprecated ?? false,
      ...(definition.description ? { description: definition.description } : {}),
    }
  })
}

async function defaultHealthCheck(): Promise<void> {
  const { prisma } = await import('../prisma')
  await withQueryTimeout(() => prisma.$queryRaw`SELECT 1`)
}

function defaultOpenApiDocument(): Record<string, unknown> {
  return { openapi: '3.1.0', info: { title: 'Sixxis Store API de Leitura', version: API_VERSION }, paths: {} }
}

function docsResponse(): Response {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Sixxis Store API v1</title></head><body><main><h1>Sixxis Store API v1</h1><p><a href="${API_BASE_PATH}/openapi.json">OpenAPI 3.1</a></p></main></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

async function dispatchGet(request: Request, segments: readonly string[], deps: RouterDeps): Promise<Response> {
  const exact = (...expected: string[]) => segments.length === expected.length && expected.every((segment, index) => segments[index] === segment)
  if (segments.length === 0) {
    const requestId = randomUUID()
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
    try {
      await (deps.healthCheck ?? defaultHealthCheck)()
      const env = deps.env ?? process.env
      const commit = env.RAILWAY_GIT_COMMIT_SHA || env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      const time = iso((deps.now ?? (() => new Date()))())
      return finalizePublic(jsonResponse({ status: 'ok', version: API_VERSION, commit, time }), requestId)
    } catch {
      return finalizePublic(problem(503, 'Serviço indisponível', 'Banco de dados temporariamente indisponível.', requestId), requestId)
    }
  }
  if (exact('openapi.json')) {
    const requestId = randomUUID()
    try {
      const document = await (deps.openApiDocument ?? defaultOpenApiDocument)()
      return finalizePublic(jsonResponse(document), requestId)
    } catch {
      return finalizePublic(problem(500, 'Erro interno', 'Não foi possível processar a requisição.', requestId), requestId)
    }
  }
  if (exact('docs')) {
    const requestId = randomUUID()
    return finalizePublic(docsResponse(), requestId)
  }

  if (exact('me')) {
    return protectedHandler((_request, context) => {
      const key = context.identity!
      return jsonResponse(itemEnvelope({
        nome: key.nome,
        prefixo: key.prefixo,
        escopos: [...key.scopes].sort(),
        expiraEm: key.expiraEm ? iso(key.expiraEm) : null,
        rateLimit: {
          limit: context.rateLimit.limit,
          remaining: context.rateLimit.remaining,
          reset: Math.ceil(context.rateLimit.reset / 1000),
        },
      }, context.requestId))
    }, { auditRoute: `${API_BASE_PATH}/me` }, deps)(request)
  }

  if (exact('meta', 'recursos')) {
    return protectedHandler(async (_request, context) => {
      const data = await resourceMetadata(resources(deps), context, deps.metaTimeoutMs ?? API_QUERY_TIMEOUT_MS)
      return jsonResponse(listEnvelope(data, { hasMore: false, nextCursor: null }, context.requestId))
    }, { auditRoute: `${API_BASE_PATH}/meta/recursos` }, deps)(request)
  }

  if (segments.length === 2 && segments[0] === 'metricas') {
    const definition = metrics(deps).get(segments[1])
    if (definition) {
      return protectedHandler(async (_request, context) => {
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
