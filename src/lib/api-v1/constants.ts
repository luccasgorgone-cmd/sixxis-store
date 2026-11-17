export const API_VERSION = '1.0.0' as const
export const API_BASE_PATH = '/api/v1' as const
export const API_CURRENCY = 'BRL' as const
export const API_TIMEZONE = 'America/Sao_Paulo' as const
export const API_DEFAULT_LIMIT = 100
export const API_MAX_LIMIT = 500
export const API_MAX_EXPANDS = 3
export const API_MAX_EXPAND_ITEMS = 50
export const API_QUERY_TIMEOUT_MS = 10_000
export const API_DEFAULT_RATE_LIMIT = 60

export const API_SCOPES = [
  'read:all', 'read:clientes', 'read:catalogo', 'read:pedidos', 'read:marketing',
  'read:analytics', 'read:auditoria', 'read:configuracoes', 'read:financeiro',
  'read:pii', 'read:mensagens',
] as const

// Domain wildcards must never grant these independent data permissions.
export const API_ADDITIVE_SCOPES = ['read:pii', 'read:mensagens'] as const
