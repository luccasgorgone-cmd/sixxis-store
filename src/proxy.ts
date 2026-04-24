import { NextRequest, NextResponse } from 'next/server'

// O middleware roda no Edge Runtime — não pode importar crypto/prisma.
// Aqui só verifica a EXISTÊNCIA do cookie. A validação HMAC do token JWT
// acontece nos route handlers (Node runtime) via verifyAdminToken().
const PUBLIC_PATHS = [
  '/adm-a7f9c2b4/login',
  '/api/admin/auth',
  '/api/admin/logout',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const token = request.cookies.get('admin_token')?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/adm-a7f9c2b4/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/adm-a7f9c2b4/:path*', '/api/admin/:path*'],
}
