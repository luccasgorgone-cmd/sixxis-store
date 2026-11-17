import { isIP } from 'node:net'
import { isForbiddenKey } from './redact'
import type { ApiIdentity } from './types'

export type AuditInput = { identity: ApiIdentity | null; requestId: string; path: string; queryKeys: string[]; status: number; durationMs: number; ip: string }
type AuditData = { chaveId: string | null; prefixo: string | null; requestId: string; rota: string; queryKeys: string[]; status: number; duracaoMs: number; ip: string | null }
type AuditDeps = { prisma?: { apiAuditoriaLeitura: { create(args: { data: AuditData }): Promise<unknown> } } }
type LastUsedDeps = { prisma?: { apiChaveLeitura: { updateMany(args: { where: { id: string; revogadoEm: null }; data: { ultimoUsoEm: Date; ultimoIp: string | null } }): Promise<unknown> } } }
const safeIp = (ip: string) => isIP(ip) ? ip : null

// Finite schema-approved names, never a regex accepting arbitrary client segments.
// Keep in sync with the resource/metric registry when adding an API surface.
const AUDIT_RESOURCES = [
  'clientes', 'enderecos', 'produtos', 'pedidos',
  'garantias-estendidas', 'pagamentos', 'tentativas-multimetodo', 'itens-pedido',
  'carrinhos', 'itens-carrinho', 'avaliacoes', 'avaliacoes-fotos',
  'banners', 'configuracoes', 'formas-pagamento', 'cupons',
  'cupons-usos', 'historico-pontos', 'lista-espera', 'pontos-clientes',
  'produtos-destaques', 'variacoes-produto', 'frete-regras', 'email-templates',
  'cookies-consentimentos', 'eventos-analiticos', 'clientes-insights', 'avaliacoes-parceiros',
  'cashback-transacoes', 'bloqueios-fraude', 'campanhas', 'niveis-fidelidade',
  'campanhas-destinatarios', 'whatsapp-numeros', 'envios-logs', 'luna-conversas',
  'luna-mensagens', 'sessoes-visitantes', 'eventos-tracking', 'relatorios-venda-hora',
  'tentativas-login', 'bloqueios-ip', 'popup-inicial', 'auditoria',
  'presencas', 'carrinhos-clientes', 'trafego-bruto', 'solicitacoes-parceiros',
  'mensagens-contato',
] as const
const AUDIT_METRICS = ['vendas', 'funil', 'carrinhos', 'cupons-cashback-fidelidade', 'frete', 'avaliacoes', 'estoque-catalogo', 'clientes'] as const
export const UNKNOWN_AUDIT_ROUTE = '/api/v1/:unknown'
const AUDIT_ROUTES: ReadonlySet<string> = new Set([
  '/api/v1', '/api/v1/health', '/api/v1/me', '/api/v1/meta/recursos', '/api/v1/openapi.json', '/api/v1/docs',
  ...AUDIT_RESOURCES.flatMap(slug => [`/api/v1/${slug}`, `/api/v1/${slug}/:id`]),
  ...AUDIT_METRICS.map(slug => `/api/v1/metricas/${slug}`),
])

/** Accept dispatcher-owned templates only. Never derive a route from request.url. */
export function canonicalAuditRoute(template: unknown): string {
  return typeof template === 'string' && AUDIT_ROUTES.has(template) ? template : UNKNOWN_AUDIT_ROUTE
}

/** Railway's edge overwrites X-Forwarded-For; client-supplied alternatives are ignored. */
export function safeClientIp(req: Request): string {
  const first = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? '').trim()
  return safeIp(first) ?? 'unknown'
}

export async function auditRequest(input: AuditInput, deps: AuditDeps = {}): Promise<void> {
  try {
    const prisma = deps.prisma ?? (await import('../prisma')).prisma
    const queryKeys = [...new Set(input.queryKeys)].filter(key => /^[a-zA-Z][a-zA-Z0-9_.\[\]-]{0,63}$/.test(key) && !isForbiddenKey(key) && !key.includes('sxs_live_')).sort().slice(0, 100)
    const safePath = input.identity && input.status !== 401 ? canonicalAuditRoute(input.path) : UNKNOWN_AUDIT_ROUTE
    await prisma.apiAuditoriaLeitura.create({ data: { chaveId: input.identity?.id ?? null, prefixo: input.identity?.prefixo ?? null, requestId: input.requestId, rota: safePath, queryKeys, status: input.status, duracaoMs: Math.max(0, Math.min(2147483647, Math.round(input.durationMs))), ip: safeIp(input.ip) } })
  } catch { /* Best effort, deliberately no payload/error logging. */ }
}

export async function recordLastUsed(identity: ApiIdentity, ip: string, deps: LastUsedDeps = {}): Promise<void> {
  try {
    const prisma = deps.prisma ?? (await import('../prisma')).prisma
    await prisma.apiChaveLeitura.updateMany({ where: { id: identity.id, revogadoEm: null }, data: { ultimoUsoEm: new Date(), ultimoIp: safeIp(ip) } })
  } catch { /* Metadata only; no raw request or error output. */ }
}
