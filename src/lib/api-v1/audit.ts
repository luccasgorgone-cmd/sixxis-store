import { isIP } from 'node:net'
import { isForbiddenKey, redactValue } from './redact'
import type { ApiIdentity } from './types'

export type AuditInput = { identity: ApiIdentity | null; requestId: string; path: string; queryKeys: string[]; status: number; durationMs: number; ip: string }
type AuditData = { chaveId: string | null; prefixo: string | null; requestId: string; rota: string; queryKeys: string[]; status: number; duracaoMs: number; ip: string | null }
type AuditDeps = { prisma?: { apiAuditoriaLeitura: { create(args: { data: AuditData }): Promise<unknown> } } }
type LastUsedDeps = { prisma?: { apiChaveLeitura: { updateMany(args: { where: { id: string; revogadoEm: null }; data: { ultimoUsoEm: Date; ultimoIp: string | null } }): Promise<unknown> } } }
const safeIp = (ip: string) => isIP(ip) ? ip : null

/** Proxy headers are metadata only, never an authorization/rate-limit identity. */
export function safeClientIp(req: Request): string {
  const first = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '').trim()
  return safeIp(first) ?? 'unknown'
}

export async function auditRequest(input: AuditInput, deps: AuditDeps = {}): Promise<void> {
  try {
    const prisma = deps.prisma ?? (await import('../prisma')).prisma
    const queryKeys = [...new Set(input.queryKeys)].filter(key => /^[a-zA-Z][a-zA-Z0-9_.\[\]-]{0,63}$/.test(key) && !isForbiddenKey(key) && !key.includes('sxs_live_')).sort().slice(0, 100)
    const path = input.path.split('?')[0]
    // Decode each segment to catch encoded credentials, then redact before persistence.
    let decoded = path
    try {
      for (let depth = 0; decoded.includes('%') && depth < 5; depth++) decoded = decodeURIComponent(decoded)
      if (decoded.includes('%')) decoded = '/api/v1/[invalid-path]'
    } catch { decoded = '/api/v1/[invalid-path]' }
    const safePath = String(redactValue(decoded, { allowPii: false, allowMessages: false })).slice(0, 2048)
    await prisma.apiAuditoriaLeitura.create({ data: { chaveId: input.identity?.id ?? null, prefixo: input.identity?.prefixo ?? null, requestId: input.requestId, rota: safePath, queryKeys, status: input.status, duracaoMs: Math.max(0, Math.min(2147483647, Math.round(input.durationMs))), ip: safeIp(input.ip) } })
  } catch { /* Best effort, deliberately no payload/error logging. */ }
}

export async function recordLastUsed(identity: ApiIdentity, ip: string, deps: LastUsedDeps = {}): Promise<void> {
  try {
    const prisma = deps.prisma ?? (await import('../prisma')).prisma
    await prisma.apiChaveLeitura.updateMany({ where: { id: identity.id, revogadoEm: null }, data: { ultimoUsoEm: new Date(), ultimoIp: safeIp(ip) } })
  } catch { /* Metadata only; no raw request or error output. */ }
}
