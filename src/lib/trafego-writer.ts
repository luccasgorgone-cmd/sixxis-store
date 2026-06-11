import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import {
  TRAFEGO_SALT, isBot, parseDispositivo, parseBrowser, parseOs, diaHoraBRT, refHost,
} from '@/lib/trafego'

// Gravador do Tráfego Bruto (Fase 4C). Roda no Node runtime — usado DIRETO pelo
// proxy (sem self-fetch HTTP, que não roteia de volta dentro do container Railway)
// e também pelo route /api/trafego/coletar (ingestão manual/testes).
//
// Hash irreversível e rotacionado por dia (IP+UA+dia+SALT). O IP cru NUNCA é
// persistido. Degradação clara: loga o motivo em vez de dropar em silêncio.

// Avisa UMA vez se o SALT não estiver setado em produção (hash usa fallback).
let avisouSalt = false
function checarSalt() {
  if (avisouSalt) return
  avisouSalt = true
  if (!process.env.TRAFEGO_SALT && process.env.NODE_ENV === 'production') {
    console.warn('[trafego] TRAFEGO_SALT não definido — usando fallback. Defina TRAFEGO_SALT no ambiente para hashes irreversíveis.')
  }
}

export interface TrafegoHit {
  path?: string
  ua?: string
  ref?: string | null
  ip?: string
  pais?: string | null
  host?: string | null
}

const DEBUG = process.env.TRAFEGO_DEBUG === '1' || process.env.TRAFEGO_DEBUG === 'true'

export async function registrarHit(hit: TrafegoHit): Promise<'ok' | 'bot' | 'sem_path' | 'erro'> {
  checarSalt()
  try {
    if (!hit?.path) {
      if (DEBUG) console.log('[trafego] descartado: sem path')
      return 'sem_path'
    }
    const ua = String(hit.ua || '')
    if (isBot(ua)) {
      if (DEBUG) console.log('[trafego] descartado: bot/UA vazio →', ua.slice(0, 60))
      return 'bot'
    }

    const ipRaw = String(hit.ip || '').split(',')[0].trim()
    const { dia, hora } = diaHoraBRT(new Date())
    const visitorHash = createHash('sha256')
      .update(`${ipRaw}|${ua}|${dia}|${TRAFEGO_SALT}`)
      .digest('hex')

    const path = String(hit.path).split('?')[0].slice(0, 512)
    const referrer = refHost(hit.ref, hit.host ?? null)
    const paisN = (hit.pais || '').trim().slice(0, 2).toUpperCase()
    const pais = paisN && paisN !== 'XX' ? paisN : null

    await prisma.trafegoBruto.create({
      data: {
        dia,
        hora,
        path,
        dispositivo: parseDispositivo(ua),
        browser:     parseBrowser(ua),
        os:          parseOs(ua),
        pais,
        referrer,
        visitorHash,
      },
    })

    if (DEBUG) console.log('[trafego] gravado:', dia, `${hora}h`, path)
    return 'ok'
  } catch (err) {
    // NÃO dropa em silêncio: loga pra diagnosticar (ex.: tabela ausente, DB down).
    console.error('[trafego] falha ao gravar hit:', err)
    return 'erro'
  }
}
