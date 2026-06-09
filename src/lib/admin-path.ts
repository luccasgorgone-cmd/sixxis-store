// Segmento PÚBLICO da URL do admin. Configurável para que o path ofuscado possa
// ser rotacionado sem renomear a pasta da rota do App Router (que é estática).
//
// Precisa ser NEXT_PUBLIC_ porque os links do admin são renderizados em client
// components — o valor tem que estar inlined no bundle para casar com o rewrite
// que o proxy faz (público → interno). Fallback para o nome histórico da pasta,
// então NADA quebra enquanto a env não for definida.
//
// Edge-safe: só lê process.env e exporta constantes (sem crypto/prisma), então
// pode ser importado pelo proxy.ts (Edge Runtime).

const RAW = process.env.NEXT_PUBLIC_ADMIN_PATH

/** Segmento público sem barras nas pontas. Ex.: "adm-a7f9c2b4". */
export const ADMIN_PATH =
  (RAW && RAW.replace(/^\/+|\/+$/g, '')) || 'adm-a7f9c2b4'

/** Prefixo público com barra inicial. Use para montar links/redirects. */
export const ADMIN_BASE = `/${ADMIN_PATH}`

/** Pasta interna do App Router — NUNCA muda. O proxy reescreve ADMIN_BASE → isto. */
export const ADMIN_INTERNAL = '/adm-a7f9c2b4'

/** true quando o path público foi rotacionado e difere do interno. */
export const ADMIN_PATH_CHANGED = ADMIN_BASE !== ADMIN_INTERNAL
