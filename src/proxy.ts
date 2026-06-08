import { NextRequest, NextResponse } from 'next/server'

// Next 16 → proxy.ts substitui o antigo middleware.ts. Roda no Edge Runtime,
// então NÃO pode importar crypto ou prisma. Aqui apenas verificamos a
// existência dos cookies de sessão (admin e cliente). A validação HMAC do
// token JWT acontece em route handlers de Node runtime.

// ── ADMIN ────────────────────────────────────────────────────────────────────
const ADMIN_PUBLIC_PATHS = [
  '/adm-a7f9c2b4/login',
  '/api/admin/auth',
  '/api/admin/logout',
]
function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/adm-a7f9c2b4') || pathname.startsWith('/api/admin')
}
function isAdminPublic(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

// Editores antigos consolidados em /editor-visual.
//   - /editor-home e /mobile: removidos junto com filhos.
//   - /configuracoes: removido SOMENTE a rota exata. /configuracoes/whatsapp
//     (Marketing) e /configuracoes-loja (Negócio) permanecem ativos.
function adminLegacyRedirect(pathname: string): boolean {
  if (pathname === '/adm-a7f9c2b4/editor-home' || pathname.startsWith('/adm-a7f9c2b4/editor-home/')) return true
  if (pathname === '/adm-a7f9c2b4/mobile'      || pathname.startsWith('/adm-a7f9c2b4/mobile/'))      return true
  if (pathname === '/adm-a7f9c2b4/configuracoes')                                                    return true
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

export function proxy(request: NextRequest) {
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

  // ─── ADMIN guard (Sprint 1) ────────────────────────────────────────────────
  if (isAdminRoute(pathname)) {
    if (isAdminPublic(pathname)) return NextResponse.next()
    const token = request.cookies.get('admin_token')?.value
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/adm-a7f9c2b4/login', request.url))
    }
    // Editores legacy → consolidado em /editor-visual
    if (adminLegacyRedirect(pathname)) {
      return NextResponse.redirect(new URL('/adm-a7f9c2b4/editor-visual', request.url))
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
