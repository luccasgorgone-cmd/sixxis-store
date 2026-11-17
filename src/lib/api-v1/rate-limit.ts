import { rateLimitApiReading } from '../ratelimit'
import { API_DEFAULT_RATE_LIMIT } from './constants'
import type { RateLimitResult } from './types'

type Env = Record<string, string | undefined>
type ApiLimiterName = 'api-leitura' | 'api-leitura-ingress' | 'api-leitura-public' | 'api-leitura-metricas'
export type ApiRateLimitDeps = {
  env?: Env
  limit?: typeof rateLimitApiReading
}
export class ApiRateLimitUnavailable extends Error {
  readonly status = 503
  constructor() { super('Controle de tráfego temporariamente indisponível.') }
}

async function strictRateLimit(name: ApiLimiterName, id: string, envName: string, defaultLimit: number, window: '1 m', deps: ApiRateLimitDeps): Promise<RateLimitResult> {
  const env = deps.env ?? process.env
  const configured = env[envName]
  const limit = configured === undefined ? defaultLimit : Number(configured)
  if (!Number.isSafeInteger(limit) || limit < 1 || (configured !== undefined && !/^[1-9]\d*$/.test(configured))) throw new ApiRateLimitUnavailable()
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (env.NODE_ENV === 'production') throw new ApiRateLimitUnavailable()
    return { success: true, limit, remaining: limit, reset: Date.now() + 60_000 }
  }
  try {
    const result = await (deps.limit ?? rateLimitApiReading)(name, id, limit, window)
    return { ...result, limit }
  } catch {
    if (env.NODE_ENV === 'production') throw new ApiRateLimitUnavailable()
    return { success: true, limit, remaining: limit, reset: Date.now() + 60_000 }
  }
}

/** Shared/distributed limiter only; production must never degrade to process memory. */
export function rateLimitApiKey(id: string, defaultLimit = API_DEFAULT_RATE_LIMIT, window: '1 m' = '1 m', deps: ApiRateLimitDeps = {}): Promise<RateLimitResult> {
  return strictRateLimit('api-leitura', id, 'API_V1_RATE_LIMIT_PER_MINUTE', defaultLimit, window, deps)
}

/** Bounds syntactically valid key guessing before it can touch MySQL. */
export function rateLimitApiIngress(ip: string, deps: ApiRateLimitDeps = {}): Promise<RateLimitResult> {
  return strictRateLimit('api-leitura-ingress', ip, 'API_V1_INGRESS_RATE_LIMIT_PER_MINUTE', 60, '1 m', deps)
}

/** Public docs/health traffic must not consume the pre-auth credential-guessing quota. */
export function rateLimitApiPublic(ip: string, deps: ApiRateLimitDeps = {}): Promise<RateLimitResult> {
  return strictRateLimit('api-leitura-public', ip, 'API_V1_PUBLIC_RATE_LIMIT_PER_MINUTE', 60, '1 m', deps)
}

/** Separate cost budget for endpoints that may scan and aggregate multiple models. */
export function rateLimitApiMetric(id: string, deps: ApiRateLimitDeps = {}): Promise<RateLimitResult> {
  return strictRateLimit('api-leitura-metricas', id, 'API_V1_METRIC_RATE_LIMIT_PER_MINUTE', 10, '1 m', deps)
}
