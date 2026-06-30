// ─── 301 do site ANTIGO (WooCommerce) → estrutura nova ───────────────────────
// Tabela declarativa de redirects das URLs legadas. É RESOLVIDA no proxy.ts
// (mesma camada do canônico apex→www), e NÃO em redirects() do next.config,
// por um motivo concreto: o redirects() do Next 16 SEMPRE mescla a query string
// da request no destino (shared/lib/router/utils/prepare-destination.js:
// `parsedDestination.query = { ...args.query, ...parsedDestination.query }`).
// O requisito aqui é destino LIMPO — ex.: /produto/sixxis-life/?attribute_cor=
// ...&add-to-cart=6100 deve ir para /produtos/spinning-sixxis-life SEM a query
// do Woo. No proxy montamos a URL nova descartando a query antiga e casamos a
// rota COM e SEM barra final (a estrutura antiga usava trailing slash).
//
// Slugs de destino conferidos contra Produto no banco (todos ativos) antes de
// aplicar — inclusive as inferências SX200/SX120 (digital→Trend, touch→Prime).

// Mapa EXATO: pathname legado (sem barra final) → destino novo (path [+ query]).
// Específicos; o fallback /produto/* e /product-category/* vem depois (ordem
// importa: o exato sempre vence).
const EXATOS: Record<string, string> = {
  // ── Produtos ──
  '/produto/aspirador-de-po-sem-fio-bravo':                              '/produtos/asp-bravo',
  '/produto/climatizador-portatil-de-ar-frio-digital-sx-200':           '/produtos/sx200-trend',
  '/produto/climatizador-portatil-de-ar-frio-sx-200-prime':             '/produtos/sx200-prime',
  '/produto/climatizador-de-ar-portatil-digital-sx-100':                '/produtos/sx100-trend',
  '/produto/climatizador-de-ar-portatil-70-litros-digital-turbo-sx70':  '/produtos/sx070-trend',
  '/produto/climatizador-portatil-de-ar-frio-digital-touch-screen-sx-120': '/produtos/sx120-prime',
  '/produto/spinning-boost':                                            '/produtos/spinning-sixxis-life',
  '/produto/spinning-sixxis-cardio':                                    '/produtos/spinning-sixxis-life',
  '/produto/sixxis-life':                                               '/produtos/spinning-sixxis-life',
  // ── Categorias ──
  '/product-category/climatizadores': '/produtos?categoria=climatizadores',
  '/product-category/aspiradores':    '/produtos?categoria=aspiradores',
  '/product-category/spinning':       '/produtos?categoria=spinning',
  // ── Estáticas ──
  // /loja (e seus subpaths paginados /loja/page/N) tratado no fallback abaixo.
  '/quem-somos':               '/sobre',
  '/termo-de-garantia-sixxis': '/garantia',
  '/blog':                     '/produtos',
  '/showroom.php':             '/produtos',
}

// Remove a barra final (exceto na raiz) para casar COM e SEM trailing slash.
// Case-sensitive de propósito: o tráfego real do Woo é todo minúsculo e assim
// não há risco de capturar rotas atuais por engano.
function semBarraFinal(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

// Resolve o destino LIMPO (path [+ query], nunca com a query da request) de uma
// URL legada — ou null se não for rota legada. Específicos ANTES do fallback.
export function resolverRedirectLegado(pathname: string): string | null {
  const p = semBarraFinal(pathname)

  // 1) Específicos (exatos) — sempre vencem.
  const exato = EXATOS[p]
  if (exato) return exato

  // 2) Fallback: qualquer /produto/:slug* não mapeado → catálogo.
  if (p === '/produto' || p.startsWith('/produto/')) return '/produtos'

  // 3) Fallback: qualquer /product-category/:cat* não mapeada → catálogo.
  if (p === '/product-category' || p.startsWith('/product-category/')) return '/produtos'

  // 4) Fallback: a loja antiga e TODA a sua paginação (/loja/page/N, /loja/:path*)
  //    → catálogo. Cobre o tráfego que o Search Console/GTM ainda batem.
  if (p === '/loja' || p.startsWith('/loja/')) return '/produtos'

  return null
}
