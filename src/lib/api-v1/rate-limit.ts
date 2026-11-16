import { rateLimitApiReading } from '../ratelimit'
import { API_DEFAULT_RATE_LIMIT } from './constants'
import type { RateLimitResult } from './types'

type Env = Record<string, string | undefined>
export type ApiRateLimitDeps = {
  env?: Env
  limit?: typeof rateLimitApiReading
}
export class ApiRateLimitUnavailable extends Error {
  readonly status = 503
  constructor() { super('Controle de tráfego temporariamente indisponível.') }
}

/** Shared/distributed limiter only; production must never degrade to process memory. */
export async function rateLimitApiKey(id: string, defaultLimit = API_DEFAULT_RATE_LIMIT, window: '1 m' = '1 m', deps: ApiRateLimitDeps = {}): Promise<RateLimitResult> {
  const env = deps.env ?? process.env
  const configured = env.API_V1_RATE_LIMIT_PER_MINUTE
  const limit = configured === undefined ? defaultLimit : Number(configured)
  if (!Number.isSafeInteger(limit) || limit < 1 || (configured !== undefined && !/^[1-9]\d*$/.test(configured))) throw new ApiRateLimitUnavailable()
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (env.NODE_ENV === 'production') throw new ApiRateLimitUnavailable()
    return { success: true, limit, remaining: limit, reset: Date.now() + 60_000 }
  }
  try {
    const result = await (deps.limit ?? rateLimitApiReading)('api-leitura', id, limit, window)
    return { ...result, limit }
  } catch {
    if (env.NODE_ENV === 'production') throw new ApiRateLimitUnavailable()
    return { success: true, limit, remaining: limit, reset: Date.now() + 60_000 }
  }
}
