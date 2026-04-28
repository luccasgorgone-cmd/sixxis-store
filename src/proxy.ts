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
  matcher: [
    '/adm-a7f9c2b4/:path*',
    '/api/admin/:path*',
    '/checkout',
    '/checkout/:path*',
    '/minha-conta',
    '/minha-conta/:path*',
    '/pedidos',
    '/pedidos/:path*',
    '/pedido/:path*',
  ],
}
