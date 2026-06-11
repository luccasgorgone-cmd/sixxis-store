import { NextRequest } from 'next/server'
import { TRAFEGO_SECRET } from '@/lib/trafego'
import { registrarHit } from '@/lib/trafego-writer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Endpoint de ingestão manual/teste do Tráfego Bruto (Fase 4C). O proxy NÃO
// depende mais deste route (grava direto no banco via writer) — ele fica como
// porta opcional para ingestão externa autenticada. Mesma lógica/anonimização,
// via writer compartilhado. Guard por secret. Responde 204 sempre (best-effort).
export async function POST(req: NextRequest) {
  if (req.headers.get('x-tb-secret') !== TRAFEGO_SECRET) {
    return new Response(null, { status: 204 })
  }
  try {
    const body = await req.json().catch(() => null) as
      | { path?: string; ua?: string; ref?: string; ip?: string; pais?: string; host?: string }
      | null
    if (body?.path) await registrarHit(body)
  } catch { /* best-effort */ }
  return new Response(null, { status: 204 })
}
