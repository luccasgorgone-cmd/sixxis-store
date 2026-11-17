import { randomUUID } from 'node:crypto'
import { authenticateBearer, ApiAuthError, hasScope } from './auth'
import { auditRequest, canonicalAuditRoute, recordLastUsed, safeClientIp, UNKNOWN_AUDIT_ROUTE } from './audit'
import { rateLimitApiIngress } from './rate-limit'
import { problem } from './problem'
import type { ApiContext, ApiIdentity, ApiScope, RateLimitResult } from './types'

type PipelineDeps = {
  preAuthRateLimit: (ip: string) => Promise<RateLimitResult>
  authenticate: typeof authenticateBearer
  audit: typeof auditRequest
  lastUsed: typeof recordLastUsed
}
export type ApiV1Options = { scope?: ApiScope; scopes?: readonly ApiScope[]; auditRoute?: string; deps?: Partial<PipelineDeps> }
export type ApiV1Handler = (request: Request, context: ApiContext) => Promise<Response> | Response

/** Errors are constant problems; request/DB/provider errors must never reach the body or logs. */
export function withApiV1(handler: ApiV1Handler, options: ApiV1Options = {}): (request: Request) => Promise<Response> {
  const deps: PipelineDeps = { preAuthRateLimit: rateLimitApiIngress, authenticate: authenticateBearer, audit: auditRequest, lastUsed: recordLastUsed, ...options.deps }
  return async request => {
    const requestId = randomUUID()
    const startedAt = Date.now()
    const ip = safeClientIp(request)
    let identity: ApiIdentity | null = null
    let response: Response
    try {
      identity = await deps.authenticate(request)
      if ([...(options.scopes ?? []), ...(options.scope ? [options.scope] : [])].some(scope => !hasScope(identity!, scope))) {
        response = problem(403, 'Acesso negado', 'Escopo necessário não autorizado.', requestId)
      } else {
        response = await handler(request, { requestId, identity, ip, startedAt })
      }
    } catch (error) {
      if (error instanceof ApiAuthError) {
        let authFailureLimit: RateLimitResult
        try { authFailureLimit = await deps.preAuthRateLimit(ip) }
        catch {
          response = problem(503, 'Serviço indisponível', 'Controle de tráfego temporariamente indisponível.', requestId)
          return await finish(response)
        }
        if (!authFailureLimit.success) {
          response = problem(429, 'Muitas requisições', 'Limite de requisições excedido.', requestId)
          response.headers.set('Retry-After', String(Math.max(1, Math.ceil((authFailureLimit.reset - Date.now()) / 1000))))
        } else {
          response = problem(401, 'Não autorizado', 'Credencial ausente ou inválida.', requestId)
          response.headers.set('WWW-Authenticate', 'Bearer')
        }
      } else response = problem(500, 'Erro interno', 'Não foi possível processar a requisição.', requestId)
    }
    return await finish(response)

    async function finish(result: Response): Promise<Response> {
      // Clone headers: handler may return immutable headers (e.g. fetch/redirect).
      const headers = new Headers(result.headers)
      headers.set('Cache-Control', 'no-store')
      headers.set('X-Request-Id', requestId)
      // Explicitly never configure CORS for a bearer integration surface.
      for (const key of [...headers.keys()]) if (key.startsWith('access-control-')) headers.delete(key)
      const output = new Response(result.body, { status: result.status, statusText: result.statusText, headers })
      const url = new URL(request.url)
      if (identity && output.status !== 429) await Promise.allSettled([
        deps.audit({ identity, requestId, path: output.status !== 401 ? canonicalAuditRoute(options.auditRoute) : UNKNOWN_AUDIT_ROUTE, queryKeys: [...url.searchParams.keys()], status: output.status, durationMs: Date.now() - startedAt, ip }),
        deps.lastUsed(identity, ip),
      ])
      return output
    }
  }
}
