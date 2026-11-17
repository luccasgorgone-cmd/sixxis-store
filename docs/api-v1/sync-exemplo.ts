import { pathToFileURL } from 'node:url'

type Envelope<T> = { data: T[]; meta: { hasMore: boolean; nextCursor: string | null } }
type Row = { id: string; [field: string]: unknown }

export type ResourceSyncContract = {
  slug: string
  sort: string
  watermarkField: string
  watermarkFormat: 'date-time' | 'date'
  from: 'criadoDesde' | 'atualizadoDesde'
  to: 'criadoAte' | 'atualizadoAte'
  maxDays: number | null
  maxLimit: number
}

type MetadataEnvelope = { data: Array<{ slug: string; sync: Omit<ResourceSyncContract, 'slug'> }> }

const ISO_DATETIME_WITH_OFFSET = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const CIVIL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function validCalendarDate(year: number, month: number, day: number): boolean {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0
  return day >= 1 && day <= daysInMonth
}

function isIsoDateTimeWithOffset(value: string): boolean {
  const match = ISO_DATETIME_WITH_OFFSET.exec(value)
  if (!match) return false
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3])
  const hour = Number(match[4]), minute = Number(match[5]), second = Number(match[6])
  const offset = match[7]
  const offsetValid = offset === 'Z' || (Number(offset.slice(1, 3)) <= 23 && Number(offset.slice(4, 6)) <= 59)
  return validCalendarDate(year, month, day) && hour <= 23 && minute <= 59 && second <= 59 && offsetValid && Number.isFinite(new Date(value).getTime())
}

function isCivilDate(value: string): boolean {
  const match = CIVIL_DATE.exec(value)
  return Boolean(match && validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3])))
}

function pageEnvelope(value: unknown): Envelope<unknown> {
  if (!value || typeof value !== 'object') throw new Error('Envelope de paginação inválido.')
  const data = (value as { data?: unknown }).data
  const meta = (value as { meta?: unknown }).meta
  if (!Array.isArray(data) || !meta || typeof meta !== 'object') throw new Error('Envelope de paginação inválido.')
  const hasMore = (meta as { hasMore?: unknown }).hasMore
  const nextCursor = (meta as { nextCursor?: unknown }).nextCursor
  if (typeof hasMore !== 'boolean' || (hasMore ? typeof nextCursor !== 'string' || !nextCursor : nextCursor !== null)) throw new Error('Envelope de paginação inválido.')
  return { data, meta: { hasMore, nextCursor: nextCursor as string | null } }
}

function validatedRows(values: unknown[], contract: ResourceSyncContract): Row[] {
  return values.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Linha de sincronização inválida.')
    const row = value as Record<string, unknown>
    if (typeof row.id !== 'string' || !row.id.trim() || row.id.length > 500) throw new Error('Linha de sincronização inválida.')
    const clock = row[contract.watermarkField]
    const validClock = typeof clock === 'string' && (contract.watermarkFormat === 'date-time' ? isIsoDateTimeWithOffset(clock) : isCivilDate(clock))
    if (!validClock) throw new Error('Linha de sincronização inválida.')
    return row as Row
  })
}

export async function syncResource(
  baseUrl: string,
  token: string,
  contract: ResourceSyncContract,
  window: { from: string; to: string },
) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(contract.slug) || contract.sort !== contract.watermarkField || !['date-time', 'date'].includes(contract.watermarkFormat) || contract.maxDays !== null) throw new Error('Contrato de sincronização inválido.')
  if (!Number.isInteger(contract.maxLimit) || contract.maxLimit < 1 || contract.maxLimit > 500) throw new Error('Contrato de sincronização inválido.')
  const from = new Date(window.from)
  const to = new Date(window.to)
  if (!isIsoDateTimeWithOffset(window.from) || !isIsoDateTimeWithOffset(window.to) || from > to) throw new Error('Janela de sincronização inválida.')
  const rows = new Map<string, Row>()
  const seenCursors = new Set<string>()
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
    const page = pageEnvelope(await response.json())
    const pageRows = validatedRows(page.data, contract)
    for (const row of pageRows) {
      rows.set(row.id, row)
      const clock = row[contract.watermarkField] as string
      if (!watermark || clock > watermark) watermark = clock
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
