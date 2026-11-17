type Envelope<T> = { data: T[]; meta: { hasMore: boolean; nextCursor: string | null } }
type Row = { id: string; updatedAt?: string }

export async function syncResource(baseUrl: string, token: string, resource: string, watermark?: string) {
  const rows = new Map<string, Row>()
  let cursor: string | null = null
  let nextWatermark = watermark
  do {
    const url = new URL(`/api/v1/${resource}`, baseUrl)
    url.searchParams.set('limit', '100')
    url.searchParams.set('sort', 'updatedAt')
    if (watermark) url.searchParams.set('atualizadoDesde', watermark)
    if (cursor) url.searchParams.set('cursor', cursor)
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) throw new Error(`Sixxis API ${response.status}`)
    const page = await response.json() as Envelope<Row>
    for (const row of page.data) {
      rows.set(row.id, row)
      if (row.updatedAt && (!nextWatermark || row.updatedAt > nextWatermark)) nextWatermark = row.updatedAt
    }
    cursor = page.meta.hasMore ? page.meta.nextCursor : null
  } while (cursor)
  return { rows: [...rows.values()], watermark: nextWatermark }
}
