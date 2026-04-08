import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { senha } = await request.json()

  if (!senha || senha !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_token', process.env.ADMIN_SECRET!, {
    httpOnly: true,
    maxAge: 8 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  })

  return response
}
