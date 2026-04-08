import { NextRequest, NextResponse } from 'next/server'

// O proxy roda no Edge Runtime onde process.env pode ser indisponível.
// A segurança é garantida pela rota de auth (Node.js) que só seta este
// cookie httpOnly após validar a senha contra ADMIN_SECRET.
// O proxy apenas verifica se o cookie existe.
const PUBLIC_PATHS = ['/admin/login', '/api/admin/auth', '/api/admin/logout']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
