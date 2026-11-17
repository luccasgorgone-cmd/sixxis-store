import { randomUUID } from 'node:crypto'
import { activeDigestStore, type ActiveDigestStore } from './active-digests'
import { ensureActiveApiKeyDigests } from './active-digest-sync'
import { apiKeyFingerprint, authenticateBearer, ApiAuthError, hasScope } from './auth'
import { auditRequest, canonicalAuditRoute, recordLastUsed, safeClientIp, UNKNOWN_AUDIT_ROUTE } from './audit'
import { API_QUERY_TIMEOUT_MS } from './constants'
import { rateLimitApiIngress, refundApiIngress } from './rate-limit'
import { problem } from './problem'
import { withQueryTimeout } from './resource'
import type { ApiContext, ApiIdentity, ApiScope, RateLimitResult } from './types'

type PipelineDeps = {
  reserveAuthFailure: (ip: string) => Promise<RateLimitResult>
  refundAuthFailure: (ip: string) => Promise<void>
  activeDigests: Pick<ActiveDigestStore, 'lookup' | 'add' | 'reject' | 'remove' | 'withDigestLock'>
  initializeActiveDigests: typeof ensureActiveApiKeyDigests
  fingerprint: typeof apiKeyFingerprint
  authenticate: typeof authenticateBearer
  audit: typeof auditRequest
  lastUsed: typeof recordLastUsed
}
export type ApiV1Options = { scope?: ApiScope; scopes?: readonly ApiScope[]; auditRoute?: string; deps?: Partial<PipelineDeps> }
export type ApiV1Handler = (request: Request, context: ApiContext) => Promise<Response> | Response

/** Errors are constant problems; request/DB/provider errors must never reach the body or logs. */
export function withApiV1(handler: ApiV1Handler, options: ApiV1Options = {}): (request: Request) => Promise<Response> {
  const deps: PipelineDeps = {
    reserveAuthFailure: rateLimitApiIngress,
    refundAuthFailure: refundApiIngress,
    activeDigests: activeDigestStore,
    initializeActiveDigests: ensureActiveApiKeyDigests,
    fingerprint: apiKeyFingerprint,
    authenticate: authenticateBearer,
    audit: auditRequest,
    lastUsed: recordLastUsed,
    ...options.deps,
  }
  return async request => {
    const requestId = randomUUID()
    const startedAt = Date.now()
    const ip = safeClientIp(request)
    const fingerprint = deps.fingerprint(request)
    let identity: ApiIdentity | null = null
    let response: Response
    try {
      const auth = fingerprint ? await authenticateFingerprint(fingerprint) : await authenticateUnknown()
      if (auth instanceof Response) return await finish(auth)
      identity = auth
    } catch {
      return await finish(problem(503, 'Serviço indisponível', 'Autenticação temporariamente indisponível.', requestId))
    }
    try {
      if ([...(options.scopes ?? []), ...(options.scope ? [options.scope] : [])].some(scope => !hasScope(identity!, scope))) {
        response = problem(403, 'Acesso negado', 'Escopo necessário não autorizado.', requestId)
      } else {
        response = await handler(request, { requestId, identity, ip, startedAt })
      }
    } catch { response = problem(500, 'Erro interno', 'Não foi possível processar a requisição.', requestId) }
    return await finish(response)

    async function authenticateFingerprint(digest: string): Promise<ApiIdentity | Response> {
      let state = await deps.activeDigests.lookup(digest)
      if (state.state === 'uninitialized') {
        await deps.initializeActiveDigests()
        state = await deps.activeDigests.lookup(digest)
      }
      if (state.state === 'uninitialized') return problem(503, 'Serviço indisponível', 'Autenticação temporariamente indisponível.', requestId)
      if (state.state === 'quarantined') return await rejectedCredential()
      if (state.state === 'active') return await authenticateKnown(digest)
      let reserved = false
      try {
        return await deps.activeDigests.withDigestLock(digest, async () => {
          const fresh = await deps.activeDigests.lookup(digest)
          if (fresh.state === 'active') return await authenticateKnown(digest)
          if (fresh.state === 'quarantined') return await rejectedCredential()
          if (fresh.state === 'uninitialized') return problem(503, 'Serviço indisponível', 'Autenticação temporariamente indisponível.', requestId)
          const limited = await reserveFailure()
          if (limited) return limited
          reserved = true
          try {
            const current = await authenticateDatabase()
            await deps.activeDigests.add(digest, current)
            await deps.refundAuthFailure(ip)
            reserved = false
            return current
          } catch (error) {
            if (error instanceof ApiAuthError) {
              await deps.activeDigests.reject(digest)
              return unauthorized()
            }
            throw error
          }
        }) as ApiIdentity | Response
      } catch (error) {
        if (reserved) await deps.refundAuthFailure(ip).catch(() => undefined)
        throw error
      }
    }

    async function authenticateUnknown(): Promise<ApiIdentity | Response> {
      const reserved = await reserveFailure()
      if (reserved) return reserved
      try {
        const current = await authenticateDatabase()
        await deps.refundAuthFailure(ip)
        return current
      } catch (error) {
        if (error instanceof ApiAuthError) return unauthorized()
        await deps.refundAuthFailure(ip).catch(() => undefined)
        throw error
      }
    }

    async function authenticateKnown(digest: string): Promise<ApiIdentity | Response> {
      try {
        return await authenticateDatabase()
      } catch (error) {
        if (!(error instanceof ApiAuthError)) throw error
        await Promise.allSettled([
          deps.activeDigests.remove(digest),
          deps.activeDigests.reject(digest),
        ])
        return await rejectedCredential()
      }
    }

    async function rejectedCredential(): Promise<Response> {
      return (await reserveFailure()) ?? unauthorized()
    }

    async function reserveFailure(): Promise<Response | null> {
      const gate = await deps.reserveAuthFailure(ip)
      return gate.success ? null : rateLimited(gate)
    }

    function unauthorized(): Response {
      const result = problem(401, 'Não autorizado', 'Credencial ausente ou inválida.', requestId)
      result.headers.set('WWW-Authenticate', 'Bearer')
      return result
    }

    function authenticateDatabase(): Promise<ApiIdentity> {
      return withQueryTimeout(() => deps.authenticate(request), API_QUERY_TIMEOUT_MS)
    }

    function rateLimited(limit: RateLimitResult): Response {
      const result = problem(429, 'Muitas requisições', 'Limite de requisições excedido.', requestId)
      result.headers.set('Retry-After', String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))))
      return result
    }

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
