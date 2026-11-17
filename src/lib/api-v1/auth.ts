import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { API_ADDITIVE_SCOPES, API_SCOPES } from './constants'
import type { ApiIdentity, ApiScope } from './types'

export const apiScopesSchema = z.array(z.enum(API_SCOPES)).min(1)
export const API_KEY_PATTERN = /^sxs_live_[A-Za-z0-9_-]{43}$/
const DUMMY_DIGEST = createHash('sha256').update('api-v1-dummy-comparison').digest()
const AUTH_SELECT = { id: true, nome: true, prefixo: true, hash: true, escopos: true, expiraEm: true, revogadoEm: true } as const
const ACTIVE_DIGEST_SELECT = { id: true, nome: true, prefixo: true, hash: true, escopos: true, expiraEm: true } as const

type KeyCandidate = { id: string; nome: string; prefixo: string; hash: string; escopos: unknown; expiraEm: Date | null; revogadoEm: Date | null }
export type AuthDeps = {
  prisma?: { apiChaveLeitura: { findMany(args: { where: { prefixo: string }; select: typeof AUTH_SELECT }): Promise<KeyCandidate[]> } }
  compare?: typeof timingSafeEqual
  now?: () => Date
}
export type ActiveDigestDeps = {
  prisma?: { apiChaveLeitura: { findMany(args: { where: { revogadoEm: null; OR: [{ expiraEm: null }, { expiraEm: { gt: Date } }] }; select: typeof ACTIVE_DIGEST_SELECT }): Promise<Array<Omit<KeyCandidate, 'revogadoEm'>>> } }
  now?: () => Date
}

export class ApiAuthError extends Error {
  readonly status = 401
  constructor() { super('Credencial ausente ou inválida.') }
}

export function hashApiKey(raw: string): Buffer {
  return createHash('sha256').update(raw, 'utf8').digest()
}

function rawBearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? ''
  const match = /^Bearer (sxs_live_[A-Za-z0-9_-]{43})$/i.exec(header)
  return match && API_KEY_PATTERN.test(match[1]) ? match[1] : null
}

export function apiKeyFingerprint(req: Request): string | null {
  const raw = rawBearer(req)
  return raw ? hashApiKey(raw).toString('hex') : null
}

export async function loadActiveApiKeyDigests(deps: ActiveDigestDeps = {}): Promise<Map<string, ApiIdentity>> {
  const now = (deps.now ?? (() => new Date()))()
  const prisma = deps.prisma ?? (await import('../prisma')).prisma
  const rows = await prisma.apiChaveLeitura.findMany({
    where: { revogadoEm: null, OR: [{ expiraEm: null }, { expiraEm: { gt: now } }] },
    select: ACTIVE_DIGEST_SELECT,
  })
  return new Map(rows.flatMap(row => {
    const scopes = apiScopesSchema.safeParse(row.escopos)
    if (typeof row.hash !== 'string' || !/^[a-fA-F0-9]{64}$/.test(row.hash) || !scopes.success) return []
    return [[row.hash.toLowerCase(), { id: row.id, nome: row.nome, prefixo: row.prefixo, scopes: new Set(scopes.data), expiraEm: row.expiraEm }] as const]
  }))
}

/** Prefixes are lookup hints, not identifiers. Never stop after the first match. */
export async function authenticateBearer(req: Request, deps: AuthDeps = {}): Promise<ApiIdentity> {
  const raw = rawBearer(req)
  if (!raw) throw new ApiAuthError()
  const hash = hashApiKey(raw)
  const prisma = deps.prisma ?? (await import('../prisma')).prisma
  const candidates = await prisma.apiChaveLeitura.findMany({ where: { prefixo: raw.slice(0, 20) }, select: AUTH_SELECT })
  const compare = deps.compare ?? timingSafeEqual
  const now = (deps.now ?? (() => new Date()))()
  let identity: ApiIdentity | null = null
  // A miss still performs the same fixed-size primitive. Never decode unvalidated hex.
  if (!candidates.length) compare(hash, DUMMY_DIGEST)
  for (const candidate of candidates) {
    const validDigest = typeof candidate.hash === 'string' && /^[a-fA-F0-9]{64}$/.test(candidate.hash)
    const digest = validDigest ? Buffer.from(candidate.hash, 'hex') : DUMMY_DIGEST
    const equal = compare(hash, digest)
    const scopes = apiScopesSchema.safeParse(candidate.escopos)
    if (equal && validDigest && scopes.success && !candidate.revogadoEm && (!candidate.expiraEm || candidate.expiraEm > now)) {
      identity = { id: candidate.id, nome: candidate.nome, prefixo: candidate.prefixo, scopes: new Set(scopes.data), expiraEm: candidate.expiraEm }
    }
  }
  if (!identity) throw new ApiAuthError()
  return identity
}

export function hasScope(identity: ApiIdentity, required: ApiScope): boolean {
  return identity.scopes.has(required) || (!API_ADDITIVE_SCOPES.some(scope => scope === required) && identity.scopes.has('read:all'))
}
