import type { OrdersClientDeps } from './checkout-multi-metodo'
import {
  criarOrderManual,
  adicionarTransacao,
  removerTransacao,
  processarOrder,
  cancelarOrder,
} from './mercadopago-orders'

// Único ponto que liga a state machine de negócio (checkout-multi-metodo.ts,
// testada com deps mockadas) ao singleton REAL do SDK (mercadopago-orders.ts).
// As rotas importam daqui, nunca de mercadopago-orders.ts diretamente.
export const ordersClientDeps: OrdersClientDeps = {
  criarOrderManual,
  adicionarTransacao,
  removerTransacao,
  processarOrder,
  cancelarOrder,
}
