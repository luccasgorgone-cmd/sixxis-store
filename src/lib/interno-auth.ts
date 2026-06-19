import { NextRequest } from 'next/server'
import crypto from 'node:crypto'

// Autenticação máquina-a-máquina para a API interna /api/interno/*.
// O CRM envia o header `x-internal-key` com o valor de STORE_INTERNAL_KEY.
// Comparação em tempo constante para evitar timing attacks.
export function autorizarInterno(request: NextRequest): boolean {
  const esperado = process.env.STORE_INTERNAL_KEY
  if (!esperado) return false
  const recebido = request.headers.get('x-internal-key') ?? ''

  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// Headers comuns às respostas internas: nunca indexar / cachear.
export const HEADERS_INTERNOS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
}
