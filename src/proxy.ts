import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'
import { ADMIN_BASE, ADMIN_INTERNAL, ADMIN_PATH_CHANGED } from '@/lib/admin-path'

// Next 16 → proxy.ts substitui o antigo middleware.ts. Roda no Edge Runtime,
// então NÃO pode importar crypto ou prisma. Aqui apenas verificamos a
// existência dos cookies de sessão (admin e cliente). A validação HMAC do
// token JWT acontece em route handlers de Node runtime.

// ── ADMIN ────────────────────────────────────────────────────────────────────
// ADMIN_BASE é o path PÚBLICO (configurável via NEXT_PUBLIC_ADMIN_PATH).
// ADMIN_INTERNAL é a pasta estática do App Router. Quando o público difere do
// interno, o proxy reescreve público → interno e bloqueia (404) o interno.
const ADMIN_PUBLIC_PATHS = [
  `${ADMIN_BASE}/login`,
  '/api/admin/auth',
  '/api/admin/logout',
]
function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith(ADMIN_BASE) || pathname.startsWith('/api/admin')
}
function isAdminPublic(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

// Editores antigos consolidados em /editor-visual.
//   - /editor-home e /mobile: removidos junto com filhos.
//   - /configuracoes: removido SOMENTE a rota exata. /configuracoes/whatsapp
//     (Marketing) e /configuracoes-loja (Negócio) permanecem ativos.
function adminLegacyRedirect(pathname: string): boolean {
  if (pathname === `${ADMIN_BASE}/editor-home` || pathname.startsWith(`${ADMIN_BASE}/editor-home/`)) return true
  if (pathname === `${ADMIN_BASE}/mobile`      || pathname.startsWith(`${ADMIN_BASE}/mobile/`))      return true
  if (pathname === `${ADMIN_BASE}/configuracoes`)                                                    return true
  return false
}

// ── CLIENTE ──────────────────────────────────────────────────────────────────
// Sprint 2B: Sixxis exige login antes de checkout/minha-conta/pedidos.
const CLIENTE_PROTEGIDAS = [
  /^\/checkout(\/.*)?$/,
  /^\/minha-conta(\/.*)?$/,
  /^\/pedidos(\/.*)?$/,
  /^\/pedido\/[^/]+(\/.*)?$/,
]
// NextAuth v5 (jwt) usa um destes nomes de cookie. Em produção (https) o
// cookie ganha prefixo __Secure-.
const COOKIES_SESSAO = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
]
function clientePrecisaLogin(pathname: string): boolean {
  return CLIENTE_PROTEGIDAS.some((re) => re.test(pathname))
}

// ── TRÁFEGO BRUTO (Fase 4C) ──────────────────────────────────────────────────
// Mede pageviews de TODOS os visitantes server-side, sem cookie e sem PII.
// O proxy roda no Node runtime (functions-config: runtime=nodejs), então grava
// DIRETO no banco via import dinâmico do writer dentro de waitUntil. NÃO usa
// self-fetch HTTP: dentro do container do Railway uma chamada à própria URL
// pública não roteia de volta (erro engolido) — era a causa de pageviews=0.

// Conta cada NAVEGAÇÃO de página: carga de documento (hard load) OU navegação
// soft do App Router (RSC, com `_rsc` na query) — nunca prefetch, asset, api ou
// admin. Sem isso, num SPA quase só a 1ª carga contaria (subcontagem grosseira).
function ehPageview(request: NextRequest, pathname: string): boolean {
  if (request.method !== 'GET') return false
  // Prefetch nunca conta (link hover/viewport prefetch do Next).
  if (request.headers.get('next-router-prefetch')) return false
  if (request.headers.get('purpose') === 'prefetch') return false
  if (request.headers.get('sec-purpose')?.includes('prefetch')) return false
  // Excluir api, _next, admin/painel e arquivos com extensão (assets soltos).
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return false
  if (isAdminRoute(pathname)) return false
  if (/\.[a-z0-9]+$/i.test(pathname)) return false
  // Documento (hard load / sem header em browsers antigos) ou navegação RSC real.
  const dest = request.headers.get('sec-fetch-dest')
  const ehDocumento = !dest || dest === 'document'
  const ehRscNavegacao = request.nextUrl.searchParams.has('_rsc')
  return ehDocumento || ehRscNavegacao
}

function registrarTrafego(request: NextRequest, pathname: string, event?: NextFetchEvent) {
  try {
    const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
      .split(',')[0].trim()
    const hit = {
      path: pathname,
      ua:   request.headers.get('user-agent') ?? '',
      ref:  request.headers.get('referer') ?? '',
      ip:   request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '',
      // Geo = TODO: aproveita país só se algum proxy de borda já mandar o header.
      pais: request.headers.get('cf-ipcountry') ?? request.headers.get('x-vercel-ip-country') ?? '',
      host,
    }
    // Import dinâmico: o writer (prisma + crypto) só carrega quando há pageview,
    // mantendo leve o caminho quente do proxy (redirects/guards).
    const p = import('@/lib/trafego-writer')
      .then((m) => m.registrarHit(hit))
      .catch((err) => { console.error('[trafego] writer indisponível:', err) })
    // waitUntil mantém a função viva até a escrita concluir (sem atrasar a resposta).
    if (event?.waitUntil) event.waitUntil(p)
  } catch (err) {
    // telemetria best-effort: nunca quebra a navegação
    console.error('[trafego] erro ao registrar pageview:', err)
  }
}

export function proxy(request: NextRequest, event?: NextFetchEvent) {
  // ─── Host canônico: apex → www ─────────────────────────────────────────────
  // Garante que TODO o fluxo OAuth (inclui /api/auth/*) ocorra só em www, para os
  // cookies de state/pkce/csrf serem setados e lidos no MESMO host — corrige o
  // "InvalidCheck: pkceCodeVerifier could not be parsed" (cookie PKCE não lido no
  // callback na 1ª tentativa). Atrás do proxy do Railway, o host público chega em
  // x-forwarded-host; por isso checamos ele primeiro.
  const rawHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  const host = rawHost.split(',')[0].trim().split(':')[0].toLowerCase()
  if (host === 'sixxis.com.br') {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.host = 'www.sixxis.com.br'
    url.port = ''
    return NextResponse.redirect(url, 308)
  }

  const { pathname, searchParams } = request.nextUrl

  // ─── Tráfego Bruto (Fase 4C) ───────────────────────────────────────────────
  // Registra o pageview anônimo de TODA navegação de página (independe de
  // consentimento; admin/api/assets ficam de fora). Fire-and-forget.
  if (ehPageview(request, pathname)) {
    registrarTrafego(request, pathname, event)
  }

  // ─── Path interno bloqueado (Sprint rotação) ───────────────────────────────
  // Quando o ADMIN_PATH público foi rotacionado, o acesso direto à pasta interna
  // (/adm-a7f9c2b4) responde 404 — força o uso exclusivo do path novo. As rotas
  // /api/admin/* NÃO são afetadas (não ficam sob o segmento configurável).
  if (
    ADMIN_PATH_CHANGED &&
    (pathname === ADMIN_INTERNAL || pathname.startsWith(ADMIN_INTERNAL + '/'))
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // ─── ADMIN guard (Sprint 1) ────────────────────────────────────────────────
  if (isAdminRoute(pathname)) {
    // Auth/legacy avaliados no path PÚBLICO; rewrite público → interno acontece
    // por último para a rota física renderizar mantendo a URL pública na barra.
    if (!isAdminPublic(pathname)) {
      const token = request.cookies.get('admin_token')?.value
      if (!token) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        return NextResponse.redirect(new URL(`${ADMIN_BASE}/login`, request.url))
      }
      // Editores legacy → consolidado em /editor-visual
      if (adminLegacyRedirect(pathname)) {
        return NextResponse.redirect(new URL(`${ADMIN_BASE}/editor-visual`, request.url))
      }
    }
    // Rewrite público → interno (no-op quando não há rotação). /api/admin fica
    // de fora porque não começa com ADMIN_BASE.
    if (ADMIN_PATH_CHANGED && pathname.startsWith(ADMIN_BASE)) {
      const url = request.nextUrl.clone()
      url.pathname = ADMIN_INTERNAL + pathname.slice(ADMIN_BASE.length)
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // ─── CLIENTE guard (Sprint 2B) ─────────────────────────────────────────────
  if (clientePrecisaLogin(pathname)) {
    const logado = COOKIES_SESSAO.some((name) => request.cookies.get(name)?.value)
    if (!logado) {
      const target = new URL('/login', request.url)
      const original = pathname + (searchParams.toString() ? `?${searchParams}` : '')
      target.searchParams.set('redirect', original)
      return NextResponse.redirect(target)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Catch-all (menos assets) para o canonical apex→www valer em todo o site,
  // INCLUSIVE /api/auth/*. Os guards admin/cliente continuam restritos por
  // predicado de path dentro de proxy(); demais rotas só passam por next().
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
