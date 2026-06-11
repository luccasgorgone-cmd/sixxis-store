import { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import {
  TRAFEGO_SECRET, TRAFEGO_SALT, isBot,
  parseDispositivo, parseBrowser, parseOs, diaHoraBRT, refHost,
} from '@/lib/trafego'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Coletor do Tráfego Bruto (Fase 4C). Chamado pelo proxy (fire-and-forget) a cada
// pageview de documento. Roda no Node runtime (precisa de crypto + prisma). NÃO
// depende de consentimento — medição anônima, cookieless, sem PII.
//
// Recebe IP/UA/referrer do proxy, deriva device/browser/os, calcula o visitorHash
// irreversível (IP+UA+dia+SALT) e grava UMA linha. O IP cru NUNCA é persistido.
// Responde 204 sempre (inclusive em erro/descarte) — é telemetria best-effort.
export async function POST(req: NextRequest) {
  // Guard: só o proxy (que conhece o secret) consegue inserir hits.
  if (req.headers.get('x-tb-secret') !== TRAFEGO_SECRET) {
    return new Response(null, { status: 204 })
  }

  try {
    const body = await req.json().catch(() => null) as
      | { path?: string; ua?: string; ref?: string; ip?: string; pais?: string; host?: string }
      | null
    if (!body?.path) return new Response(null, { status: 204 })

    const ua = String(body.ua || '')
    if (isBot(ua)) return new Response(null, { status: 204 }) // descarta bots

    const ipRaw = String(body.ip || '').split(',')[0].trim()
    const { dia, hora } = diaHoraBRT(new Date())

    // Hash irreversível e rotacionado por dia. IP cru não sai daqui.
    const visitorHash = createHash('sha256')
      .update(`${ipRaw}|${ua}|${dia}|${TRAFEGO_SALT}`)
      .digest('hex')

    const path = String(body.path).split('?')[0].slice(0, 512)
    const referrer = refHost(body.ref, body.host ?? null)
    // Geo = TODO (sem MaxMind). Só aproveita país se algum proxy de borda mandar.
    const pais = (body.pais || '').trim().slice(0, 2).toUpperCase() || null

    await prisma.trafegoBruto.create({
      data: {
        dia,
        hora,
        path,
        dispositivo: parseDispositivo(ua),
        browser:     parseBrowser(ua),
        os:          parseOs(ua),
        pais:        pais && pais !== 'XX' ? pais : null,
        referrer,
        visitorHash,
      },
    }).catch(() => {})

    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 204 })
  }
}
