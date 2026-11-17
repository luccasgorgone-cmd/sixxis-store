import { API_BASE_PATH, API_DEFAULT_LIMIT, API_MAX_LIMIT, API_SCOPES, API_TIMEZONE, API_VERSION } from './constants'
import type { MetricRegistry } from './metricas/registry'
import type { FieldSchema, ResourceDefinition } from './resource'
import type { ResourceRegistry } from './registry'

type Schema = Record<string, unknown>
type Operation = Record<string, any>
export type OpenApiDocument = {
  openapi: '3.1.0'
  info: Record<string, unknown>
  servers: Array<{ url: string; description: string }>
  tags: Array<{ name: string; description: string }>
  paths: Record<string, Record<string, Operation>>
  components: { securitySchemes: Record<string, unknown>; schemas: Record<string, Schema>; parameters: Record<string, Schema>; headers: Record<string, Schema>; responses: Record<string, Schema> }
}

const text = (description = 'Texto UTF-8.') => ({ type: 'string', description })
const integer = (description = 'Quantidade inteira.') => ({ type: 'integer', minimum: 0, description })
const number = (description = 'Valor numérico.') => ({ type: 'number', description })
const money = (nullable = false) => ({ type: nullable ? ['string', 'null'] : 'string', pattern: '^-?\\d+\\.\\d{2}$', example: '1234.50', description: 'Valor monetário decimal em BRL; nunca número de ponto flutuante.' })
const array = (items: Schema, description = 'Coleção ordenada.') => ({ type: 'array', items, description })
const object = (properties: Record<string, Schema>, required = Object.keys(properties), description = 'Objeto estruturado.') => ({ type: 'object', properties, required, additionalProperties: false, description })
const row = (properties: Record<string, Schema>, description?: string) => object(properties, Object.keys(properties), description)

const baseMetric = {
  timezone: { type: 'string', const: API_TIMEZONE, description: 'Fuso usado para fronteiras e agrupamentos civis.' },
  periodo: object({
    de: { type: 'string', format: 'date', example: '2026-01-01', description: 'Primeiro dia civil inclusivo.' },
    ate: { type: 'string', format: 'date', example: '2026-01-31', description: 'Último dia civil inclusivo.' },
    agrupar: { type: 'string', enum: ['dia', 'semana', 'mes'], description: 'Granularidade; semana começa na segunda-feira.' },
  }, ['de', 'ate', 'agrupar'], 'Período interpretado em America/Sao_Paulo.'),
  definicoes: { type: 'object', additionalProperties: { type: 'string' }, description: 'Fórmulas e ressalvas exatas aplicadas ao payload.' },
}
const bucket = { type: 'string', description: 'Dia YYYY-MM-DD, segunda-feira da semana ou mês YYYY-MM, conforme agrupar.' }
const countMoney = (label: string) => row({ [label]: integer(), valor: money() })
const salesAccumulator = {
  pedidosPagos: integer('Pedidos com status pago, enviado ou entregue.'), receitaBruta: money(), receitaLiquidaComercial: money(), lucroLiquidoConhecido: money(true), ticketMedio: money(),
}

function detailedMetricSchema(slug: string): Schema {
  const schemas: Record<string, Schema> = {
    vendas: object({ ...baseMetric,
      resumo: row({ ...salesAccumulator, pedidosComLucroConhecido: integer(), pedidosComCustoPendente: integer() }),
      serie: array(row({ bucket, ...salesAccumulator })),
      porStatusPagamento: array(row({ status: text('Status retornado pelo provedor.'), pagamentos: integer(), valor: money() })),
      porMetodoPagamento: array(row({ metodo: text('Método real aprovado/capturado.'), pagamentos: integer(), valor: money() })),
      porProduto: array(row({ produtoId: text('Identificador interno do produto.'), produto: text('Nome comercial sanitizado.'), quantidade: integer(), receitaBruta: money() })),
      porVariacao: array(row({ produtoId: text(), variacaoId: { type: ['string', 'null'], description: 'Identificador da variação ou null.' }, variacao: text(), quantidade: integer(), receitaBruta: money() })),
      porUf: array(row({ uf: text(), pedidos: integer(), receitaLiquidaComercial: money() })),
      porCidade: array(row({ uf: text(), cidade: text('Dimensão sanitizada.'), pedidos: integer(), receitaLiquidaComercial: money() })),
      porAtribuicao: array(row({ origem: text(), meio: text(), campanha: text(), canalClickId: { type: 'string', enum: ['gclid', 'gbraid', 'wbraid', 'fbc', 'sem_click_id'], description: 'Canal; o click-id bruto nunca é exposto.' }, pedidos: integer(), receitaLiquidaComercial: money() })),
    }),
    funil: object({ ...baseMetric, tracked: { type: 'boolean', const: true, description: 'Cobertura limitada a eventos consentidos.' },
      etapas: array(row({ etapa: { type: 'string', enum: ['sessoes', 'view_item', 'add_to_cart', 'begin_checkout', 'pagamento_submit', 'purchase'], description: 'Etapa cumulativa.' }, sessoes: integer(), taxaDaAnterior: number('Percentual 0–100.'), taxaDaSessao: number('Percentual 0–100.') })),
      abandonoCheckout: row({ comercial: integer(), tecnico: integer(), emAndamento: integer() }),
      serie: array(row({ bucket, sessoes: integer(), viewItem: integer(), addToCart: integer(), beginCheckout: integer(), pagamentoSubmit: integer(), purchase: integer() })),
    }),
    carrinhos: object({ ...baseMetric,
      persistentes: object({
        resumo: row({ carrinhos: integer(), ativos: integer(), convertidos: integer(), abandonadosComerciais: integer(), valorTotal: money(), valorAbandonadoComercial: money() }),
        porEtapa: array(row({ etapa: integer(), carrinhos: integer(), valorTotal: money() })),
        porStatus: array(row({ status: text(), carrinhos: integer(), valorTotal: money() })),
        serie: array(row({ bucket, carrinhos: integer(), abandonadosComerciais: integer(), valorTotal: money() })),
      }),
      checkoutTracked: row({ tracked: { type: 'boolean', const: true, description: 'Eventos com consentimento.' }, abandono: row({ comercial: integer(), tecnico: integer(), emAndamento: integer() }) }),
    }),
    'cupons-cashback-fidelidade': object({ ...baseMetric,
      cupons: object({ resumo: row({ usos: integer(), desconto: money(), receita: money() }), porCupom: array(row({ codigo: text(), usos: integer(), desconto: money(), receita: money() })) }),
      cashback: row({ creditos: money(), debitos: money(), saldoMovimentacao: money(), saldoDisponivelAtual: money(), saldoPendenteAtual: money() }),
      fidelidade: object({ snapshotAtual: { type: 'boolean', const: true, description: 'Snapshot no momento da consulta.' }, porFaixa: array(row({ slug: text(), nome: text(), gastoMin: money(), gastoMax: money(true), clientes: integer() })) }),
      serie: array(row({ bucket, usosCupom: integer(), descontoCupom: money(), receitaCupom: money(), creditosCashback: money(), debitosCashback: money() })),
    }),
    frete: object({ ...baseMetric,
      selecoesTracked: object({ total: integer(), valorCarrinho: money(), porOpcao: array(row({ opcao: text(), selecoes: integer(), valorCarrinho: money() })) }),
      pedidosPagos: object({ resumo: row({ pedidos: integer(), freteCobrado: money(), custoRealConhecido: money(true), prazoMedioDiasUteis: { type: ['number', 'null'], description: 'Média simples ou null.' } }), porTransportadora: array(row({ transportadora: text(), pedidos: integer(), freteCobrado: money(), prazoMedioDiasUteis: { type: ['number', 'null'], description: 'Média simples ou null.' } })), porTipo: array(row({ tipo: text(), pedidos: integer(), freteCobrado: money() })) }),
      serie: array(row({ bucket, selecoesTracked: integer(), pedidosPagos: integer(), freteCobrado: money(), custoRealConhecido: money(true) })), limitacoes: text('Limitações de cobertura.'),
    }),
    avaliacoes: object({ ...baseMetric,
      resumo: row({ avaliacoes: integer(), aprovadas: integer(), pendentes: integer(), destaques: integer(), respondidas: integer(), mediaNota: number() }),
      porNota: array(row({ nota: integer(), avaliacoes: integer() })), porProduto: array(row({ produtoId: text(), produto: text(), avaliacoes: integer(), aprovadas: integer(), mediaNota: number() })), serie: array(row({ bucket, avaliacoes: integer(), aprovadas: integer(), mediaNota: number() })),
    }),
    'estoque-catalogo': object({ ...baseMetric,
      resumo: row({ produtos: integer(), ativos: integer(), inativos: integer(), semEstoque: integer(), estoqueCritico: integer(), unidadesDisponiveis: integer(), valorVendaEstoque: money() }),
      porCategoria: array(row({ categoria: text(), produtos: integer(), ativos: integer(), unidadesDisponiveis: integer(), valorVendaEstoque: money() })),
    }),
    clientes: object({ ...baseMetric,
      resumo: row({ clientesCompradores: integer(), novos: integer(), recorrentes: integer(), ltvMedio: money(), receitaHistorica: money() }),
      serie: array(row({ bucket, clientesCompradores: integer(), novos: integer(), recorrentes: integer() })),
    }),
  }
  const schema = schemas[slug]
  if (!schema) throw new TypeError(`Missing detailed metric schema: ${slug}`)
  return schema
}

function fieldSchema(field: FieldSchema, description?: string, example?: unknown): Schema {
  const type = field.nullable ? [field.type, 'null'] : field.type
  const schema: Schema = { type, description: description || 'Campo nominal allowlisted do recurso.' }
  if (field.format === 'decimal') Object.assign(schema, { type: field.nullable ? ['string', 'null'] : 'string', pattern: '^-?\\d+(?:\\.\\d+)?$', description: description || 'Decimal serializado como string.' })
  else if (field.format) schema.format = field.format
  if (field.enum) schema.enum = [...field.enum, ...(field.nullable ? [null] : [])]
  if (field.items) schema.items = fieldSchema(field.items)
  if (field.properties) schema.properties = Object.fromEntries(Object.entries(field.properties).map(([name, child]) => [name, fieldSchema(child)]))
  if (field.required) schema.required = [...field.required]
  if (field.type === 'object' && !field.properties) schema.additionalProperties = true
  if (example !== undefined) schema.example = example
  return schema
}

const responseHeaders = { 'X-Request-Id': { $ref: 'urn:sixxis:api-v1:header:request-id' }, 'X-RateLimit-Limit': { $ref: 'urn:sixxis:api-v1:header:rate-limit' }, 'X-RateLimit-Remaining': { $ref: 'urn:sixxis:api-v1:header:rate-remaining' }, 'X-RateLimit-Reset': { $ref: 'urn:sixxis:api-v1:header:rate-reset' } }
function responses(success: Schema, item = false): Record<string, Schema> {
  const output: Record<string, Schema> = { '200': { description: 'Sucesso.', headers: responseHeaders, content: { 'application/json': { schema: success } } } }
  for (const status of ['400', '401', '403', ...(item ? ['404'] : []), '429', '500', '503']) output[status] = { $ref: `urn:sixxis:api-v1:response:${status}` }
  if (!output['404']) output['404'] = { $ref: 'urn:sixxis:api-v1:response:404' }
  return output
}

function queryParameter(name: string, schema: Schema, description: string, example?: unknown): Schema {
  return { name, in: 'query', required: false, description, schema, ...(example === undefined ? {} : { example }) }
}

function resourceParameters(definition: ResourceDefinition): Schema[] {
  const parameters: Schema[] = [
    queryParameter('limit', { type: 'integer', minimum: 1, maximum: Math.min(API_MAX_LIMIT, definition.maxLimit ?? API_MAX_LIMIT), default: Math.min(API_DEFAULT_LIMIT, definition.maxLimit ?? API_MAX_LIMIT) }, 'Tamanho da página.'),
    queryParameter('cursor', { type: 'string', minLength: 1 }, 'Cursor opaco criptografado da página anterior.'),
    queryParameter('sort', { type: 'string', enum: definition.sorts.flatMap(name => [name, `-${name}`]), default: definition.defaultSort ?? definition.sorts[0] }, 'Ordenação determinística; id é desempate implícito.'),
    queryParameter('ids', { type: 'string' }, 'Até 100 IDs separados por vírgula.'),
    queryParameter('fields', { type: 'string' }, `Campos separados por vírgula: ${definition.fields.map(field => field.name).join(', ')}.`),
    queryParameter('expand', { type: 'string', enum: definition.expands.length ? definition.expands.map(item => item.name) : undefined }, `Até três relações: ${definition.expands.map(item => item.name).join(', ') || 'nenhuma'}.`),
  ]
  if (definition.searchFields?.length) parameters.push(queryParameter('q', { type: 'string', maxLength: 200 }, `Busca textual em ${definition.searchFields.join(', ')}.`))
  for (const [name, field] of [['criadoDesde', definition.dateFields?.created], ['criadoAte', definition.dateFields?.created], ['atualizadoDesde', definition.dateFields?.updated], ['atualizadoAte', definition.dateFields?.updated]] as const) if (field) parameters.push(queryParameter(name, { type: 'string', format: 'date-time' }, `Limite ${name.endsWith('Desde') ? 'inclusivo inicial' : 'inclusivo final'} em ${field}.`))
  for (const [name, filter] of Object.entries(definition.filters ?? {})) parameters.push(queryParameter(name, { type: 'string', ...(filter.values ? { enum: filter.values } : {}) }, filter.description ?? `Filtro natural por ${filter.field ?? name}; múltiplos valores separados por vírgula.`))
  return parameters
}

export function buildOpenApi(registry: ResourceRegistry, metrics: MetricRegistry): OpenApiDocument {
  if (registry.size !== 49 || metrics.size !== 8) throw new TypeError('OpenAPI requires the complete 49-resource/8-metric registry')
  const schemas: Record<string, Schema> = {}
  const paths: OpenApiDocument['paths'] = {}
  for (const definition of registry.list()) {
    const name = `Resource_${definition.model}`
    const properties: Record<string, Schema> = Object.fromEntries(definition.fields.map(field => [field.name, fieldSchema(field, field.description, field.example)]))
    for (const expand of definition.expands) {
      const child = expand.resource()
      properties[expand.name] = expand.many
        ? object({ data: array({ $ref: `urn:sixxis:api-v1:resource:${child.slug}` }), _meta: object({ hasMore: { type: 'boolean', description: 'Há mais de 50 filhos.' } }) }, ['data', '_meta'], expand.description ?? `Expansão de ${child.slug}.`)
        : { anyOf: [{ $ref: `urn:sixxis:api-v1:resource:${child.slug}` }, { type: 'null' }], description: expand.description ?? `Expansão de ${child.slug}.` }
    }
    schemas[name] = { $id: `urn:sixxis:api-v1:resource:${definition.slug}`, ...object(properties, ['id'], definition.description ?? `Recurso ${definition.slug}; campos scoped aparecem apenas quando autorizados.`), deprecated: definition.deprecated ?? false, 'x-scope': definition.scope }
    schemas[`List_${definition.slug}`] = { $id: `urn:sixxis:api-v1:list:${definition.slug}`, ...object({ data: array({ $ref: `urn:sixxis:api-v1:resource:${definition.slug}` }), meta: { $ref: 'urn:sixxis:api-v1:list-meta' } }) }
    schemas[`Item_${definition.slug}`] = { $id: `urn:sixxis:api-v1:item:${definition.slug}`, ...object({ data: { $ref: `urn:sixxis:api-v1:resource:${definition.slug}` }, meta: { $ref: 'urn:sixxis:api-v1:item-meta' } }) }
    paths[`${API_BASE_PATH}/${definition.slug}`] = { get: { tags: ['Recursos'], operationId: `listar_${definition.slug}`, summary: `Lista ${definition.slug}`, description: definition.description ?? `Lista paginada do model ${definition.model}.`, security: [{ bearerAuth: [] }], 'x-required-scope': definition.scope, parameters: resourceParameters(definition), responses: responses({ $ref: `urn:sixxis:api-v1:list:${definition.slug}` }) } }
    paths[`${API_BASE_PATH}/${definition.slug}/{id}`] = { get: { tags: ['Recursos'], operationId: `obter_${definition.slug}`, summary: `Detalha ${definition.slug}`, security: [{ bearerAuth: [] }], 'x-required-scope': definition.scope, parameters: [{ name: 'id', in: 'path', required: true, description: 'Identificador nominal do recurso.', schema: { type: 'string', minLength: 1, maxLength: 500 } }, queryParameter('fields', { type: 'string' }, 'Sparse fieldset.'), queryParameter('expand', { type: 'string' }, `Relações: ${definition.expands.map(item => item.name).join(', ') || 'nenhuma'}.`)], responses: responses({ $ref: `urn:sixxis:api-v1:item:${definition.slug}` }, true) } }
  }
  for (const metric of metrics.list()) {
    const schema = detailedMetricSchema(metric.slug)
    schemas[`Metric_${metric.slug}`] = { $id: `urn:sixxis:api-v1:metric:${metric.slug}`, ...schema }
    schemas[`MetricEnvelope_${metric.slug}`] = { $id: `urn:sixxis:api-v1:metric-envelope:${metric.slug}`, ...object({ data: { $ref: `urn:sixxis:api-v1:metric:${metric.slug}` }, meta: { $ref: 'urn:sixxis:api-v1:item-meta' } }) }
    paths[`${API_BASE_PATH}/metricas/${metric.slug}`] = { get: { tags: ['Métricas'], operationId: `metrica_${metric.slug}`, summary: `Métrica ${metric.slug}`, description: 'Agregado sem identificadores individuais; fórmulas completas constam em definicoes.', security: [{ bearerAuth: [] }], 'x-required-scope': metric.scope, parameters: [queryParameter('de', { type: 'string', format: 'date' }, 'Primeiro dia civil inclusivo.', '2026-01-01'), queryParameter('ate', { type: 'string', format: 'date' }, 'Último dia civil inclusivo; máximo de 366 dias.', '2026-01-31'), queryParameter('agrupar', { type: 'string', enum: ['dia', 'semana', 'mes'] }, 'Granularidade BRT.', 'dia')], responses: responses({ $ref: `urn:sixxis:api-v1:metric-envelope:${metric.slug}` }) } }
  }
  const meta = { $id: 'urn:sixxis:api-v1:item-meta', ...object({ requestId: text('Identificador da requisição.'), generatedAt: { type: 'string', format: 'date-time', description: 'Instante UTC de geração.' } }) }
  const listMeta = { $id: 'urn:sixxis:api-v1:list-meta', ...object({ requestId: text(), count: integer(), hasMore: { type: 'boolean', description: 'Existe página seguinte.' }, nextCursor: { type: ['string', 'null'], description: 'Cursor opaco ou null.' }, generatedAt: { type: 'string', format: 'date-time', description: 'Instante UTC.' }, apiVersion: { type: 'string', const: API_VERSION, description: 'Versão semântica da API.' } }) }
  const problem = { $id: 'urn:sixxis:api-v1:problem', ...object({ type: { type: 'string', format: 'uri', description: 'URI do tipo do problema.' }, title: text(), status: integer(), detail: text(), requestId: text() }) }
  Object.assign(schemas, { ItemMeta: meta, ListMeta: listMeta, Problem: problem })
  const document: OpenApiDocument = {
    openapi: '3.1.0',
    info: { title: 'Sixxis Store API de Leitura v1', version: API_VERSION, description: 'API server-to-server somente leitura. Datas em UTC, dinheiro em strings BRL, agrupamento de métricas em America/Sao_Paulo. Nenhum exemplo contém dado real.', license: { name: 'Proprietário — uso autorizado Sixxis' } },
    servers: [{ url: 'https://SEU-DOMINIO.example', description: 'Substitua pelo domínio autorizado da Loja.' }],
    tags: [{ name: 'Sistema', description: 'Saúde, contrato e identidade da chave.' }, { name: 'Recursos', description: '49 recursos de negócio com cursor e allowlists.' }, { name: 'Métricas', description: '8 agregados documentados.' }],
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'sxs_live_…', description: 'Chave server-to-server; nunca inclua em URL ou logs.' } }, schemas,
      parameters: {},
      headers: {
        RequestId: { $id: 'urn:sixxis:api-v1:header:request-id', description: 'Identificador único da requisição.', schema: { type: 'string' } },
        RateLimit: { $id: 'urn:sixxis:api-v1:header:rate-limit', description: 'Limite por minuto.', schema: { type: 'integer' } },
        RateRemaining: { $id: 'urn:sixxis:api-v1:header:rate-remaining', description: 'Saldo na janela.', schema: { type: 'integer' } },
        RateReset: { $id: 'urn:sixxis:api-v1:header:rate-reset', description: 'Reset em Unix seconds.', schema: { type: 'integer' } },
      },
      responses: Object.fromEntries(['400', '401', '403', '404', '429', '500', '503'].map(status => [status, { $id: `urn:sixxis:api-v1:response:${status}`, description: `Erro HTTP ${status}.`, headers: responseHeaders, content: { 'application/problem+json': { schema: { $ref: 'urn:sixxis:api-v1:problem' } } }, ...(status === '429' ? { headers: { ...responseHeaders, 'Retry-After': { description: 'Segundos até nova tentativa.', schema: { type: 'integer' } } } } : {}) }])),
    },
  }
  const systemPaths: OpenApiDocument['paths'] = {
    [API_BASE_PATH]: { get: { tags: ['Sistema'], operationId: 'raiz', summary: 'Descoberta da API', security: [], parameters: [], responses: responses({ type: 'object' }) } },
    [`${API_BASE_PATH}/health`]: { get: { tags: ['Sistema'], operationId: 'health', summary: 'Saúde e versão', security: [], parameters: [], responses: responses({ type: 'object' }) } },
    [`${API_BASE_PATH}/openapi.json`]: { get: { tags: ['Sistema'], operationId: 'openapi', summary: 'Contrato OpenAPI 3.1', security: [], parameters: [], responses: responses({ type: 'object' }) } },
    [`${API_BASE_PATH}/docs`]: { get: { tags: ['Sistema'], operationId: 'docs', summary: 'Scalar UI', security: [], parameters: [], responses: { '200': { description: 'HTML Scalar.', content: { 'text/html': { schema: { type: 'string' } } } }, '400': { $ref: 'urn:sixxis:api-v1:response:400' } } } },
    [`${API_BASE_PATH}/me`]: { get: { tags: ['Sistema'], operationId: 'me', summary: 'Metadados seguros da chave', security: [{ bearerAuth: [] }], parameters: [], responses: responses({ type: 'object' }) } },
    [`${API_BASE_PATH}/meta/recursos`]: { get: { tags: ['Sistema'], operationId: 'meta_recursos', summary: 'Dicionário e cardinalidade autorizados', security: [{ bearerAuth: [] }], parameters: [], responses: responses({ type: 'object' }) } },
  }
  document.paths = { ...systemPaths, ...document.paths }
  return document
}

export function buildPostmanCollection(document: OpenApiDocument): Record<string, any> {
  const items = Object.entries(document.paths).flatMap(([path, pathItem]) => Object.entries(pathItem).filter(([method]) => ['get', 'head', 'options'].includes(method)).map(([method, operation]) => {
    const parameters = (operation.parameters ?? []) as Array<Record<string, any>>
    const query = parameters.filter(parameter => parameter.in === 'query').map(parameter => ({ key: parameter.name, value: String(parameter.example ?? parameter.schema?.default ?? ''), disabled: parameter.example === undefined && parameter.schema?.default === undefined, description: parameter.description }))
    const rawPath = path.replace('{id}', 'EXEMPLO_ID')
    return { name: `${method.toUpperCase()} ${path}`, request: { method: method.toUpperCase(), header: operation.security?.length ? [{ key: 'Authorization', value: 'Bearer {{token}}', type: 'text' }] : [], url: { raw: `{{baseUrl}}${rawPath}`, host: ['{{baseUrl}}'], path: rawPath.split('/').filter(Boolean), query }, description: operation.description ?? operation.summary } }
  }))
  return { info: { name: 'Sixxis Store API de Leitura v1', description: 'Coleção gerada; exemplos sintéticos.', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, variable: [{ key: 'baseUrl', value: 'https://SEU-DOMINIO.example', type: 'string' }, { key: 'token', value: '', type: 'string' }], auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] }, item: items }
}

export const documentedScopes = [...API_SCOPES]
