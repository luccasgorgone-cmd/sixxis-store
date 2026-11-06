// Token de POSSE de pedido — STATELESS (HMAC), sem tabela/migração.
//
// Emitido quando o pedido é criado (POST /api/pedidos) e devolvido ao cliente.
// Autoriza as rotas de pagamento quando NÃO há sessão logada: checkout
// convidado (Option A) e também o cliente que TEM conta mas não está logado
// naquele momento (sessão expirada / navegou deslogado). Sem este token, essas
// pessoas criavam o pedido mas tomavam 401 ao pagar — a venda era perdida.
//
// payload = base64url({ pid, exp }); assinatura = HMAC-SHA256(payload). O
// escopo é o próprio pedidoId (pid): um token só vale para o pedido que o
// gerou, nunca para outro. Mesmo SECRET do reset-token (NEXTAUTH_SECRET /
// AUTH_SECRET). Módulo PURO (sem prisma/next) para ficar testável como os
// demais src/lib/*.
import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || ''
// Janela do checkout + folga para o pagamento assíncrono (Pix: cliente abre o
// app do banco, paga, e a tela faz polling). 3h cobre com sobra sem deixar um
// token vivo para sempre.
const TTL_MS = 1000 * 60 * 60 * 3

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
}

/** Gera o token de posse para um pedido recém-criado. */
export function gerarPedidoToken(pedidoId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ pid: pedidoId, exp: Date.now() + TTL_MS }),
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

/**
 * Valida um token de posse contra um pedidoId específico.
 * Fail-closed: sem SECRET, token malformado, assinatura divergente, expirado
 * ou escopo (pid) diferente do pedidoId → false. Nunca lança.
 */
export function pedidoTokenValido(
  token: string | null | undefined,
  pedidoId: string,
): boolean {
  if (!SECRET) return false
  const [payload, sig] = String(token ?? '').split('.')
  if (!payload || !sig) return false

  let obj: { pid?: string; exp?: number }
  try {
    obj = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      pid?: string
      exp?: number
    }
  } catch {
    return false
  }
  if (!obj.pid || !obj.exp) return false
  if (obj.pid !== pedidoId) return false
  if (Date.now() > obj.exp) return false

  const esperado = sign(payload)
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado))
  } catch {
    return false
  }
}
