import { PaymentRefund } from 'mercadopago'
import { mpClient, mpPayment } from './mercadopago'
import type { PaymentsClientDeps } from './checkout-multi-metodo'

// Único ponto que liga a state machine de negócio (checkout-multi-metodo.ts,
// testada com deps mockadas) ao singleton REAL do SDK (Payment/PaymentRefund
// clássicos — mercadopago.ts). As rotas e o webhook importam daqui, nunca do
// SDK direto.
const mpPaymentRefund = mpClient ? new PaymentRefund(mpClient) : null

function requirePayment() {
  if (!mpPayment) throw new Error('[mercadopago-payments-deps] Access token ausente')
  return mpPayment
}

function requireRefund() {
  if (!mpPaymentRefund) throw new Error('[mercadopago-payments-deps] Access token ausente')
  return mpPaymentRefund
}

export const paymentsClientDeps: PaymentsClientDeps = {
  async criarPagamento({ idempotencyKey, body, meliSessionId }) {
    const resp = await requirePayment().create({
      body,
      requestOptions: { idempotencyKey, ...(meliSessionId ? { meliSessionId } : {}) },
    })
    return {
      id: resp.id != null ? String(resp.id) : undefined,
      status: resp.status,
      status_detail: resp.status_detail,
      point_of_interaction: resp.point_of_interaction as
        | { transaction_data?: { qr_code?: string; qr_code_base64?: string } }
        | undefined,
    }
  },
  async buscarPagamento(mpPaymentId) {
    const resp = await requirePayment().get({ id: mpPaymentId })
    return { status: resp.status, status_detail: resp.status_detail }
  },
  async capturarPagamento(mpPaymentId) {
    const resp = await requirePayment().capture({ id: mpPaymentId })
    return { status: resp.status, status_detail: resp.status_detail }
  },
  async estornarPagamento(mpPaymentId) {
    await requireRefund().create({ payment_id: mpPaymentId })
  },
  async cancelarPagamento(mpPaymentId) {
    await requirePayment().cancel({ id: mpPaymentId })
  },
}
