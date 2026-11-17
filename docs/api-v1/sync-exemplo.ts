import { pathToFileURL } from 'node:url'

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

export async function syncResource(
  baseUrl: string,
  token: string,
  contract: ResourceSyncContract,
  window: { from: string; to: string },
) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(contract.slug) || contract.sort !== contract.watermarkField) throw new Error('Contrato de sincronização inválido.')
  if (!Number.isInteger(contract.maxLimit) || contract.maxLimit < 1 || contract.maxLimit > 500) throw new Error('Contrato de sincronização inválido.')
  const from = new Date(window.from)
  const to = new Date(window.to)
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to || (contract.maxDays !== null && to.getTime() - from.getTime() > contract.maxDays * 86_400_000)) throw new Error('Janela de sincronização inválida.')
  const rows = new Map<string, Row>()
  let cursor: string | null = null
  let watermark: string | undefined
  do {
    const url = new URL(`/api/v1/${contract.slug}`, baseUrl)
    url.searchParams.set('limit', String(contract.maxLimit))
    url.searchParams.set('sort', contract.sort)
    url.searchParams.set(contract.from, window.from)
    url.searchParams.set(contract.to, window.to)
    if (cursor) url.searchParams.set('cursor', cursor)
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) throw new Error(`Sixxis API ${response.status}`)
    const page = await response.json() as Envelope<Row>
    for (const row of page.data) {
      rows.set(row.id, row)
      const clock = row[contract.watermarkField]
      if (typeof clock === 'string' && (!watermark || clock > watermark)) watermark = clock
    }
    cursor = page.meta.hasMore ? page.meta.nextCursor : null
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
  const response = await fetch(new URL('/api/v1/meta/recursos', baseUrl), { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`Sixxis API ${response.status}`)
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
