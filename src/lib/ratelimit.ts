// Rate-limit por IP/identificador usando Upstash (Redis REST + sliding window).
//
// PRODUÇÃO = FAIL-CLOSED quando mal configurado: se UPSTASH_REDIS_REST_URL ou
// UPSTASH_REDIS_REST_TOKEN não estiverem definidos em produção, NÃO liberamos
// silenciosamente — retornamos { success: false } (bloqueia), para que um deploy
// sem rate-limit configurado não rode com login/checkout/reset de senha sem
// proteção. Em erros de rede do Redis em produção, falhamos fechado apenas nos
// limiters sensíveis a auth (login/cadastro/esqueci-senha) e mantemos
// fail-open nos demais (evita derrubar checkout num blip transitório).
//
// DEV = degradação graciosa: fora de produção, sem credenciais ou em erro de
// rede, retorna { success: true } (pula) para não bloquear o ambiente local.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type LimiterName =
  | 'login'
  | 'cadastro'
  | 'esqueci-senha'
  | 'criar-pagamento'
  | 'checkout-multi-metodo'
  | 'validar-cupom'
  | 'interno-frete'

// Limites sensatos por IP/identificador (sliding window). Ajuste conforme tráfego.
const CONFIG: Record<LimiterName, { tokens: number; window: Parameters<typeof Ratelimit.slidingWindow>[1] }> = {
  'login':                 { tokens: 10, window: '5 m' },   // 10 tentativas / 5 min
  'cadastro':              { tokens: 5,  window: '10 m' },  // 5 cadastros / 10 min
  'esqueci-senha':         { tokens: 5,  window: '15 m' },  // 5 pedidos / 15 min
  'criar-pagamento':       { tokens: 12, window: '5 m' },   // 12 tentativas / 5 min
  'checkout-multi-metodo': { tokens: 8,  window: '5 m' },   // 8 tentativas / 5 min — orquestra 2 transações reais, mais caro que criar-pagamento
  'validar-cupom':         { tokens: 20, window: '1 m' },   // 20 validações / 1 min
  'interno-frete':         { tokens: 60, window: '1 m' },   // 60 cotações / 1 min (CRM)
}

// Limiters que protegem credenciais/auth — em produção falham fechado também em
// erro de rede do Redis (não só quando desconfigurados).
const AUTH_SENSITIVE: ReadonlySet<LimiterName> = new Set<LimiterName>([
  'login',
  'cadastro',
  'esqueci-senha',
])

const IS_PROD = process.env.NODE_ENV === 'production'

let _redis: Redis | null = null
const _limiters = new Map<LimiterName, Ratelimit>()

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null // sem credenciais → desliga o rate-limit
  if (!_redis) _redis = new Redis({ url, token })
  return _redis
}

function getLimiter(name: LimiterName): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  let limiter = _limiters.get(name)
  if (!limiter) {
    const { tokens, window } = CONFIG[name]
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `rl:${name}`,
      analytics: false,
    })
    _limiters.set(name, limiter)
  }
  return limiter
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export async function rateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name)
  if (!limiter) {
    if (IS_PROD) {
      // Fail-closed: rate-limit obrigatório não configurado em produção → bloqueia.
      console.error(`[ratelimit] Upstash não configurado em produção; bloqueando "${name}" (fail-closed).`)
      return { success: false, remaining: 0, reset: 0 }
    }
    return { success: true, remaining: -1, reset: 0 } // dev → pula
  }

  try {
    const r = await limiter.limit(identifier)
    return { success: r.success, remaining: r.remaining, reset: r.reset }
  } catch {
    // Erro de rede no Redis: em produção, falha fechado nos limiters sensíveis a
    // auth (não liberar guessing de senha num blip do Redis); demais mantêm
    // fail-open para não derrubar checkout/cupom por indisponibilidade transitória.
    if (IS_PROD && AUTH_SENSITIVE.has(name)) {
      console.error(`[ratelimit] falha ao consultar Upstash; bloqueando "${name}" (fail-closed, auth-sensitive)`)
      return { success: false, remaining: 0, reset: 0 }
    }
    console.error(`[ratelimit] falha ao consultar Upstash; liberando "${name}" (fail-open)`)
    return { success: true, remaining: -1, reset: 0 }
  }
}

// Extrai o IP do cliente de trás do proxy (Railway/Cloudflare).
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
