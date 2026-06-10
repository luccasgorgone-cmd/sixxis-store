// DEPRECATED — Sistema B aposentado. Visitas/eventos agora via /api/tracking
// (Sistema A). Stub mantido por compatibilidade; não grava nada.
export async function POST() {
  return Response.json({ ok: true })
}
