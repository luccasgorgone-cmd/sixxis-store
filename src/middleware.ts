import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Rotas que exigem cliente logado. /checkout/* sempre, mesmo nas subrotas
// de retorno (sucesso/falha/pendente) para não vazar dados de pedido.
const ROTAS_PROTEGIDAS = [
  /^\/checkout(\/.*)?$/,
  /^\/minha-conta(\/.*)?$/,
  /^\/pedidos(\/.*)?$/,
  /^\/pedido\/[^/]+(\/.*)?$/,
]

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl
  const precisa = ROTAS_PROTEGIDAS.some((re) => re.test(pathname))
  if (!precisa) return NextResponse.next()

  const session = await auth()
  if (session?.user?.id) return NextResponse.next()

  const target = new URL('/login', req.url)
  // Preserva query (compra_direta, produto, variacao, etc.) na URL de retorno.
  const original = pathname + (searchParams.toString() ? `?${searchParams}` : '')
  target.searchParams.set('redirect', original)
  return NextResponse.redirect(target)
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/checkout',
    '/minha-conta/:path*',
    '/minha-conta',
    '/pedidos/:path*',
    '/pedido/:path*',
  ],
}
