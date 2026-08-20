import { MercadoPagoConfig, Order } from 'mercadopago'
import type {
  OrderResponse,
  PaymentRequest,
  TransactionsApiResponse,
} from 'mercadopago/dist/clients/order/commonTypes'
import type { CreateOrderRequest } from 'mercadopago/dist/clients/order/create/types'

// Wrapper fino sobre o Order da Orders API (Checkout Transparente via Orders),
// não o Payment/Preference clássico já usado em mercadopago.ts. É o modelo que
// suporta múltiplas transações (pagamentos) dentro do mesmo pedido — ver
// checkout-multi-metodo.ts para a orquestração de negócio em cima disto.
//
// Confirmado lendo os .d.ts REAIS do SDK instalado (node_modules/mercadopago
// ^2.12.0), não só a documentação pública: capture/cancel/process/refund
// operam no nível da ORDER inteira (recebem só `id`); createTransaction/
// updateTransaction/deleteTransaction operam por transactionId. NÃO está
// confirmado contra o ambiente real do MP se deleteTransaction reverte uma
// autorização de cartão não capturada — isso precisa de teste em sandbox
// com credencial real (ver STATUS em checkout-multi-metodo.ts — a Orders API
// está bloqueada pra conta da Sixxis, então isso segue sem teste possível).

const accessToken =
  process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN

const mpOrderConfig = accessToken
  ? new MercadoPagoConfig({ accessToken, options: { timeout: 10_000 } })
  : null

export const mpOrder = mpOrderConfig ? new Order(mpOrderConfig) : null

function requireClient(): Order {
  if (!mpOrder) {
    throw new Error(
      '[mercadopago-orders] Access token ausente — configure MERCADOPAGO_ACCESS_TOKEN.',
    )
  }
  return mpOrder
}

export interface CriarOrderManualParams {
  externalReference: string
  totalAmount: string
  payerEmail: string
  items?: CreateOrderRequest['items']
}

/** Cria uma order em modo manual, SEM transactions no corpo inicial — no modo
 * manual as transações são adicionadas depois, uma a uma, via
 * adicionarTransacao(). Confirmado no exemplo oficial (docs Orders API):
 * "No modo manual, o objeto transactions não é incluído na criação inicial". */
export async function criarOrderManual(
  params: CriarOrderManualParams,
): Promise<OrderResponse> {
  return requireClient().create({
    body: {
      type: 'online',
      processing_mode: 'manual',
      external_reference: params.externalReference,
      total_amount: params.totalAmount,
      payer: { email: params.payerEmail },
      items: params.items,
    },
  })
}

export async function adicionarTransacao(
  orderId: string,
  payment: PaymentRequest,
): Promise<TransactionsApiResponse> {
  return requireClient().createTransaction({
    id: orderId,
    body: { payments: [payment] },
  })
}

export async function removerTransacao(
  orderId: string,
  transactionId: string,
): Promise<void> {
  await requireClient().deleteTransaction({ id: orderId, transactionId })
}

export async function processarOrder(orderId: string): Promise<OrderResponse> {
  return requireClient().process({ id: orderId })
}

export async function cancelarOrder(orderId: string): Promise<OrderResponse> {
  return requireClient().cancel({ id: orderId })
}

export async function buscarOrder(orderId: string): Promise<OrderResponse> {
  return requireClient().get({ id: orderId })
}
