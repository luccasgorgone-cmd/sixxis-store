import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/admin/login', '/api/admin/auth', '/api/admin/logout']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_token')?.value

  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
