// Visits are now tracked via /api/analytics/evento with tipo=page_view.
// This stub exists for backwards compatibility.
export async function POST() {
  return Response.json({ ok: true })
}
