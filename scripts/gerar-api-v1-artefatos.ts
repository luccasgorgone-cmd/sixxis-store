import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { stringify as toYaml } from 'yaml'
import { createStoreMetricRegistry } from '../src/lib/api-v1/metricas/registry'
import { buildOpenApi, buildPostmanCollection, type OpenApiDocument } from '../src/lib/api-v1/openapi'
import { createStoreResourceRegistry } from '../src/lib/api-v1/router'

type Schema = {
  $ref?: string
  $id?: string
  const?: unknown
  example?: unknown
  enum?: unknown[]
  anyOf?: Schema[]
  type?: string | string[]
  required?: string[]
  properties?: Record<string, Schema>
  format?: string
  pattern?: string
  minimum?: number
  [key: string]: unknown
}

const outputDirectory = resolve(process.cwd(), 'docs/api-v1')
const resources = createStoreResourceRegistry({ prisma: {} as never })
const metrics = createStoreMetricRegistry({ prisma: {} as never })
const openApi = buildOpenApi(resources, metrics)

const stableJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

function schemaSample(schema: Schema, document: OpenApiDocument): unknown {
  if (schema.$ref) {
    const resolved = Object.values(document.components.schemas).find(candidate => candidate.$id === schema.$ref)
    if (!resolved) throw new TypeError(`Schema reference not found: ${schema.$ref}`)
    return schemaSample(resolved, document)
  }
  if (schema.const !== undefined) return schema.const
  if (schema.example !== undefined) return schema.example
  if (schema.enum?.length) return schema.enum.find((value: unknown) => value !== null) ?? null
  if (schema.anyOf?.length) return schemaSample(schema.anyOf.find((candidate: Schema) => candidate.type !== 'null') ?? schema.anyOf[0], document)
  const type = Array.isArray(schema.type) ? schema.type.find((candidate: string) => candidate !== 'null') : schema.type
  if (type === 'object') {
    const required = new Set<string>(schema.required ?? [])
    return Object.fromEntries(Object.entries<Schema>(schema.properties ?? {}).filter(([name]) => required.has(name)).map(([name, child]) => [name, schemaSample(child, document)]))
  }
  if (type === 'array') return []
  if (type === 'integer' || type === 'number') return schema.minimum ?? 0
  if (type === 'boolean') return false
  if (type === 'null') return null
  if (schema.format === 'date-time') return '2026-01-01T12:00:00.000Z'
  if (schema.format === 'date') return '2026-01-01'
  if (schema.format === 'uri') return 'https://example.test/problem'
  if (schema.pattern?.includes('\\d{2}')) return '0.00'
  if (schema.pattern?.includes('\\d+')) return '0'
  return 'exemplo'
}

function contractSamples(document: OpenApiDocument): Record<string, unknown> {
  const samples: Record<string, unknown> = {}
  for (const slug of ['clientes', 'produtos', 'pedidos', 'eventos-tracking']) {
    samples[`list:${slug}`] = schemaSample({ $ref: `urn:sixxis:api-v1:list:${slug}` }, document)
    samples[`item:${slug}`] = schemaSample({ $ref: `urn:sixxis:api-v1:item:${slug}` }, document)
  }
  for (const metric of metrics.list()) samples[`metric:${metric.slug}`] = schemaSample({ $ref: `urn:sixxis:api-v1:metric-envelope:${metric.slug}` }, document)
  return samples
}

const metricNotes: Record<string, string[]> = {
  vendas: [
    'Pedidos pagos = status pago, enviado ou entregue no período BRT.',
    'Receita bruta = Σ(preço unitário × quantidade) + garantias pagas.',
    'Receita líquida comercial = Σ(Pedido.total). Lucro conhecido fica null se algum custo necessário estiver ausente.',
    'Atribuição correlaciona purchase por transaction_id com lookahead de 7 dias; click-id bruto nunca é exposto.',
  ],
  funil: [
    'Sessões tracked distintas por bucket: sessão → view_item → add_to_cart → begin_checkout → pagamento_submit → purchase.',
    'Abandono comercial: checkout sem compra e sem erro técnico, inativo por pelo menos 1 hora.',
    'Abandono técnico: rejected, api_error ou brick_error; cobertura depende de consentimento analítico.',
  ],
  carrinhos: ['Carrinhos persistentes atualizados no período; abandono comercial exige carrinho ativo, itens e inatividade de 1 hora.', 'checkoutTracked usa somente eventos consentidos.'],
  'cupons-cashback-fidelidade': ['Cupons usam CupomUso.usadoEm; cashback ignora movimentos cancelados; fidelidade é snapshot atual por faixa inclusiva.'],
  frete: ['Seleções vêm de add_shipping_info consentido e representam valor do carrinho.', 'Pedidos pagos usam frete cobrado; custo real desconhecido permanece null; prazo é média simples em dias úteis.'],
  avaliacoes: ['Período por Avaliacao.createdAt; média = Σ(nota) ÷ quantidade. Conteúdo de comentário/resposta não é selecionado.'],
  'estoque-catalogo': ['Snapshot atual sem série histórica; variações ativas substituem estoque do produto.', 'Valor de venda = unidades × preço efetivo; não usa custo interno.'],
  clientes: ['Comprador é cliente distinto com pedido pago/enviado/entregue.', 'Novo tem primeiro pedido pago no período; LTV médio usa todo o histórico pago dos compradores do período.'],
}

function readme(): string {
  const resourceSections = resources.list().map(resource => {
    const fields = resource.fields.map(field => {
      const flags = [field.type, field.nullable ? 'nullable' : '', field.enum?.length ? `enum=${field.enum.join('|')}` : ''].filter(Boolean).join('; ')
      return `- \`${field.name}\` (${flags}) — ${field.description ?? 'campo allowlisted'}`
    }).join('\n')
    const filters = Object.keys(resource.filters ?? {}).join(', ') || 'nenhum'
    const expands = resource.expands.map(expand => expand.name).join(', ') || 'nenhum'
    return `### \`${resource.slug}\`\n\nEscopo: \`${resource.scope}\`. Filtros: ${filters}. Expansões: ${expands}.\n\n${fields}`
  }).join('\n\n')
  const metricSections = metrics.list().map(metric => `### \`${metric.slug}\`\n\nEscopo: \`${metric.scope}\`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: \`America/Sao_Paulo\`.\n\n${(metricNotes[metric.slug] ?? []).map(note => `- ${note}`).join('\n')}`).join('\n\n')
  return `# Sixxis Store API de Leitura v1

API server-to-server, autenticada e somente leitura. A fonte executável do contrato é \`openapi.json\`; exemplos são sintéticos.

## Entregáveis

- \`openapi.json\` e \`openapi.yaml\`: contrato OpenAPI 3.1.
- \`colecao.postman.json\`: coleção com \`{{baseUrl}}\` e \`{{token}}\`.
- \`sync-exemplo.ts\`: cliente executável que carrega o contrato em \`/api/v1/meta/recursos\` e pagina o recurso selecionado.

## Autenticação e escopos

Envie \`Authorization: Bearer <token>\`. Nunca coloque token em URL, log ou repositório. \`read:all\` concede os domínios; \`read:pii\` e \`read:mensagens\` são aditivos. Segredos, hashes, tokens, payloads de gateway e PAN nunca são retornados, mesmo com todos os escopos.

Escopos disponíveis: \`read:all\`, \`read:clientes\`, \`read:catalogo\`, \`read:pedidos\`, \`read:marketing\`, \`read:analytics\`, \`read:auditoria\`, \`read:configuracoes\`, \`read:financeiro\`, \`read:pii\`, \`read:mensagens\`.

## Paginação e sincronização

Use \`limit\` (máximo global 500; respeite \`sync.maxLimit\` do recurso) e repita \`nextCursor\` até \`hasMore=false\`. O cursor é opaco, criptografado e vinculado ao recurso, filtros e ordenação; não o interprete. Cada item de \`/api/v1/meta/recursos\` publica \`sync.sort\`, \`watermarkField\`, parâmetros \`from\`/\`to\` e \`maxDays: null\`, indicando que qualquer intervalo cronológico válido é aceito. Congele os dois limites da janela durante todas as páginas, deduplique por \`id\`, persista o maior watermark confirmado e faça reconciliação periódica de IDs para detectar exclusões físicas (a v1 não inventa tombstones).

\`\`\`bash
curl -sS -H "Authorization: Bearer $SIXXIS_API_TOKEN" \\
  "https://www.sixxis.com.br/api/v1/produtos?limit=500&sort=updatedAt&atualizadoDesde=2026-11-01T00:00:00.000Z&atualizadoAte=2026-11-17T00:00:00.000Z"
\`\`\`

O exemplo não depende de pacote instalado globalmente. Informe o token somente pela variável de ambiente; os três argumentos são recurso, início inclusivo e fim inclusivo em ISO 8601. A saída contém apenas \`count\` e \`watermark\`.

\`\`\`bash
read -rsp 'Token da API: ' SIXXIS_API_TOKEN; export SIXXIS_API_TOKEN; echo
# Carga inicial
npx tsx docs/api-v1/sync-exemplo.ts produtos 2026-11-01T00:00:00.000Z 2026-11-17T23:59:59.999Z
# Carga incremental: use o watermark confirmado da execução anterior como início
npx tsx docs/api-v1/sync-exemplo.ts produtos 2026-11-17T20:15:30.000Z 2026-11-18T23:59:59.999Z
unset SIXXIS_API_TOKEN
\`\`\`

## Erros, limites e cache

Erros usam RFC 9457 (\`application/problem+json\`) e incluem \`requestId\`. Status previstos: 400, 401, 403, 404, 405, 429, 500 e 503. Chaves válidas autenticadas não têm limite por minuto, inclusive em métricas. A proteção por IP permanece em endpoints públicos e em tentativas com credencial ausente ou inválida; nesses casos, respeite \`Retry-After\` ao receber 429. Respostas autenticadas usam \`Cache-Control: no-store\`; OpenAPI e docs estáticos usam cache público de uma hora. CORS não é habilitado para navegador.

## Endpoints transversais

- Públicos: \`GET /api/v1\`, \`/api/v1/health\`, \`/api/v1/openapi.json\`, \`/api/v1/docs\`.
- Autenticados: \`GET /api/v1/me\` e \`/api/v1/meta/recursos\`.
- Recursos: \`GET /api/v1/{recurso}\` e \`GET /api/v1/{recurso}/{id}\`.
- Métricas: \`GET /api/v1/metricas/{slug}?de=YYYY-MM-DD&ate=YYYY-MM-DD&agrupar=dia|semana|mes\`.
- Outros métodos retornam 405 sem executar autenticação, auditoria ou mutação.

## Recursos (49)

${resourceSections}

## Métricas (8)

${metricSections}

## Versionamento e changelog

Versão inicial \`v1\`: contrato aditivo. Remoções ou mudanças incompatíveis exigem nova versão de URL. ETag foi adiado porque \`no-store\` é obrigatório. Tabelas técnicas de chave/auditoria não são recursos de negócio e ficam fora do catálogo.
`
}

function syncExample(): string {
  return `import { pathToFileURL } from 'node:url'

type Envelope<T> = { data: T[]; meta: { hasMore: boolean; nextCursor: string | null } }
type Row = { id: string; [field: string]: unknown }

export type ResourceSyncContract = {
  slug: string
  sort: string
  watermarkField: string
  from: 'criadoDesde' | 'atualizadoDesde'
  to: 'criadoAte' | 'atualizadoAte'
  maxDays: number | null
  maxLimit: number
}

type MetadataEnvelope = { data: Array<{ slug: string; sync: Omit<ResourceSyncContract, 'slug'> }> }

const ISO_DATETIME_WITH_OFFSET = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(?:\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$/

function isIsoDateTimeWithOffset(value: string): boolean {
  const match = ISO_DATETIME_WITH_OFFSET.exec(value)
  if (!match) return false
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3])
  const hour = Number(match[4]), minute = Number(match[5]), second = Number(match[6])
  const offset = match[7]
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0
  const offsetValid = offset === 'Z' || (Number(offset.slice(1, 3)) <= 23 && Number(offset.slice(4, 6)) <= 59)
  return day >= 1 && day <= daysInMonth && hour <= 23 && minute <= 59 && second <= 59 && offsetValid && Number.isFinite(new Date(value).getTime())
}

function pageEnvelope(value: unknown): Envelope<Row> {
  if (!value || typeof value !== 'object') throw new Error('Envelope de paginação inválido.')
  const data = (value as { data?: unknown }).data
  const meta = (value as { meta?: unknown }).meta
  if (!Array.isArray(data) || !meta || typeof meta !== 'object') throw new Error('Envelope de paginação inválido.')
  const hasMore = (meta as { hasMore?: unknown }).hasMore
  const nextCursor = (meta as { nextCursor?: unknown }).nextCursor
  if (typeof hasMore !== 'boolean' || (hasMore ? typeof nextCursor !== 'string' || !nextCursor : nextCursor !== null)) throw new Error('Envelope de paginação inválido.')
  return { data: data as Row[], meta: { hasMore, nextCursor: nextCursor as string | null } }
}

export async function syncResource(
  baseUrl: string,
  token: string,
  contract: ResourceSyncContract,
  window: { from: string; to: string },
) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(contract.slug) || contract.sort !== contract.watermarkField || contract.maxDays !== null) throw new Error('Contrato de sincronização inválido.')
  if (!Number.isInteger(contract.maxLimit) || contract.maxLimit < 1 || contract.maxLimit > 500) throw new Error('Contrato de sincronização inválido.')
  const from = new Date(window.from)
  const to = new Date(window.to)
  if (!isIsoDateTimeWithOffset(window.from) || !isIsoDateTimeWithOffset(window.to) || from > to) throw new Error('Janela de sincronização inválida.')
  const rows = new Map<string, Row>()
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  let watermark: string | undefined
  do {
    const url = new URL(\`/api/v1/\${contract.slug}\`, baseUrl)
    url.searchParams.set('limit', String(contract.maxLimit))
    url.searchParams.set('sort', contract.sort)
    url.searchParams.set(contract.from, window.from)
    url.searchParams.set(contract.to, window.to)
    if (cursor) url.searchParams.set('cursor', cursor)
    const response = await fetch(url, { headers: { Authorization: \`Bearer \${token}\` } })
    if (!response.ok) throw new Error(\`Sixxis API \${response.status}\`)
    const page = pageEnvelope(await response.json())
    for (const row of page.data) {
      rows.set(row.id, row)
      const clock = row[contract.watermarkField]
      if (typeof clock === 'string' && (!watermark || clock > watermark)) watermark = clock
    }
    if (page.meta.hasMore) {
      if (seenCursors.has(page.meta.nextCursor!)) throw new Error('Cursor de paginação repetido.')
      seenCursors.add(page.meta.nextCursor!)
      cursor = page.meta.nextCursor
    } else cursor = null
  } while (cursor)
  return { rows: [...rows.values()], watermark }
}

export async function runCli(
  args: string[] = process.argv.slice(2),
  env: Record<string, string | undefined> = process.env,
  write: (value: string) => void = console.log,
): Promise<void> {
  const [slug, from, to] = args
  const token = env.SIXXIS_API_TOKEN
  if (!token) throw new Error('Defina SIXXIS_API_TOKEN no ambiente.')
  if (!slug || !from || !to || args.length !== 3) throw new Error('Uso: sync-exemplo.ts <recurso> <inicio-iso> <fim-iso>')
  const baseUrl = 'https://www.sixxis.com.br'
  const response = await fetch(new URL('/api/v1/meta/recursos', baseUrl), { headers: { Authorization: \`Bearer \${token}\` } })
  if (!response.ok) throw new Error(\`Sixxis API \${response.status}\`)
  const metadata = await response.json() as MetadataEnvelope
  if (!Array.isArray(metadata.data)) throw new Error('Contrato de recursos inválido.')
  const selected = metadata.data.find(resource => resource.slug === slug)
  if (!selected) throw new Error('Recurso não disponível para esta chave.')
  const result = await syncResource(baseUrl, token, { slug: selected.slug, ...selected.sync }, { from, to })
  write(JSON.stringify({ count: result.rows.length, watermark: result.watermark ?? null }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runCli().catch(error => {
    console.error(error instanceof Error ? error.message : 'Falha ao sincronizar recurso.')
    process.exitCode = 1
  })
}
`
}

async function main(): Promise<void> {
  await mkdir(outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(resolve(outputDirectory, 'openapi.json'), stableJson(openApi)),
    writeFile(resolve(outputDirectory, 'openapi.yaml'), toYaml(openApi, { lineWidth: 0 })),
    writeFile(resolve(outputDirectory, 'colecao.postman.json'), stableJson(buildPostmanCollection(openApi))),
    writeFile(resolve(outputDirectory, 'contract-samples.json'), stableJson(contractSamples(openApi))),
    writeFile(resolve(outputDirectory, 'README.md'), readme()),
    writeFile(resolve(outputDirectory, 'sync-exemplo.ts'), syncExample()),
  ])
}

void main()
