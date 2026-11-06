import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { pedidoTokenValido } from '@/lib/pedido-token'

// ─── Autorização das rotas de pagamento ──────────────────────────────────────
//
// Antes, toda rota de pagamento exigia sessão logada (auth() → 401). Como o
// pedido pode ser criado SEM login (checkout convidado, ou cliente com conta
// que não está logado no momento), o comprador criava o pedido e tomava 401 ao
// pagar — venda perdida. Aqui a autorização passa a aceitar DOIS caminhos:
//
//   (a) sessão logada cujo id bate com o dono do pedido (pedido.clienteId); OU
//   (b) token de posse (header x-pedido-token) emitido na criação do pedido,
//       escopado àquele pedidoId (ver pedido-token.ts).
//
// A rota resolve a autorização em 2 tempos, porque a posse pela sessão só pode
// ser confirmada contra o pedido já carregado:
//   const authz = await autorizarPedido(req, pedidoId)
//   if (!authz.autenticado) return 401            // nenhuma credencial — barato
//   ... carrega o pedido ...
//   if (!podeOperarPedido(authz, pedido.clienteId)) return 403
//
// Nenhum vazamento entre clientes: a sessão só opera o pedido que é dela; o
// token só opera o pedido que o gerou.

export interface AutorizacaoPedido {
  /** id do cliente logado, ou null se não há sessão. */
  clienteSessaoId: string | null
  /** true se veio um x-pedido-token válido para ESTE pedidoId. */
  tokenValido: boolean
  /** Alguma credencial presente (sessão OU token válido) — rejeição barata. */
  autenticado: boolean
}

export async function autorizarPedido(
  req: NextRequest,
  pedidoId: string,
): Promise<AutorizacaoPedido> {
  const session = await auth()
  const clienteSessaoId = session?.user?.id ?? null
  const tokenValido = pedidoTokenValido(req.headers.get('x-pedido-token'), pedidoId)
  return {
    clienteSessaoId,
    tokenValido,
    autenticado: Boolean(clienteSessaoId) || tokenValido,
  }
}

/**
 * Decide se a autorização pode operar o pedido, já conhecido o dono
 * (pedido.clienteId). Token válido (escopado ao pedido) basta; senão, exige
 * sessão cujo id seja o dono.
 */
export function podeOperarPedido(
  authz: AutorizacaoPedido,
  pedidoClienteId: string,
): boolean {
  if (authz.tokenValido) return true
  return authz.clienteSessaoId != null && authz.clienteSessaoId === pedidoClienteId
}
