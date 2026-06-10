// Rate-limit por IP/identificador usando Upstash (Redis REST + sliding window).
//
// DEGRADAÇÃO GRACIOSA (regra inegociável): se UPSTASH_REDIS_REST_URL ou
// UPSTASH_REDIS_REST_TOKEN não estiverem definidos, NÃO limita — retorna
// { success: true } sempre. Assim nada é bloqueado antes das vars existirem.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type LimiterName =
  | 'login'
  | 'cadastro'
  | 'esqueci-senha'
  | 'criar-pagamento'
  | 'validar-cupom'

// Limites sensatos por IP/identificador (sliding window). Ajuste conforme tráfego.
const CONFIG: Record<LimiterName, { tokens: number; window: Parameters<typeof Ratelimit.slidingWindow>[1] }> = {
  'login':           { tokens: 10, window: '5 m' },   // 10 tentativas / 5 min
  'cadastro':        { tokens: 5,  window: '10 m' },  // 5 cadastros / 10 min
  'esqueci-senha':   { tokens: 5,  window: '15 m' },  // 5 pedidos / 15 min
  'criar-pagamento': { tokens: 12, window: '5 m' },   // 12 tentativas / 5 min
  'validar-cupom':   { tokens: 20, window: '1 m' },   // 20 validações / 1 min
}

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
  if (!limiter) return { success: true, remaining: -1, reset: 0 } // pula

  try {
    const r = await limiter.limit(identifier)
    return { success: r.success, remaining: r.remaining, reset: r.reset }
  } catch {
    // Erro de rede no Redis não deve derrubar o fluxo — "fail-open".
    console.error('[ratelimit] falha ao consultar Upstash; liberando requisição')
    return { success: true, remaining: -1, reset: 0 }
  }
}

// Extrai o IP do cliente de trás do proxy (Railway/Cloudflare).
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
