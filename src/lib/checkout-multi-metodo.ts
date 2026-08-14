import type { PaymentRequest } from 'mercadopago/dist/clients/order/commonTypes'

// Orquestração de negócio pro checkout multi-método (2 cartões, ou Pix +
// cartão pro restante). Depende de mercadopago-orders.ts só por injeção
// (OrdersClientDeps) — não importa o singleton direto — pra dar pra testar
// sem token real e sem rede (ver checkout-multi-metodo.test.ts).
//
// TODO-SANDBOX (bloqueado por credencial — só o Luccas tem acesso à conta MP):
// nada aqui foi validado contra o ambiente real do Mercado Pago ainda. Duas
// coisas específicas NÃO estão confirmadas e podem mudar o desenho:
//   1. Se `deleteTransaction` de fato reverte/desfaz uma transação de cartão
//      já criada mas ainda não processada (ou se ela já gera cobrança).
//   2. Se a Orders API aceita de fato 2 transações de tipos DIFERENTES
//      (cartão + pix) na mesma order — a documentação pública nunca mostra
//      esse combo, só exemplos de 1 método por vez (pesquisa anterior).
// Antes de qualquer uso em produção: testar os dois fluxos abaixo em sandbox
// com token de teste do Mercado Pago.

export interface OrdersClientDeps {
  criarOrderManual(params: {
    externalReference: string
    totalAmount: string
    payerEmail: string
  }): Promise<{ id?: string }>
  adicionarTransacao(
    orderId: string,
    payment: PaymentRequest,
  ): Promise<{ payments?: Array<{ id?: string; status?: string; status_detail?: string }> }>
  removerTransacao(orderId: string, transactionId: string): Promise<void>
  processarOrder(orderId: string): Promise<{ status?: string; status_detail?: string }>
  cancelarOrder(orderId: string): Promise<{ status?: string }>
}

export type StatusCheckoutMultiMetodo =
  | 'pago'
  | 'aguardando_pix'
  | 'aguardando_pagamento_restante'
  | 'falhou'
  | 'cancelado'

export interface ResultadoCheckoutMultiMetodo {
  status: StatusCheckoutMultiMetodo
  orderId?: string
  erro?: string
  detalhe?: string
}

/** Um pagamento é considerado aprovado quando status "processed" +
 * status_detail "accredited" — combinação vista no único exemplo oficial
 * disponível. NÃO É a lista completa de status possíveis do MP (rejected,
 * in_process, etc. também existem) — cobrir esses casos exige validação em
 * sandbox real, não só a doc pública. */
function pagamentoAprovado(p?: { status?: string; status_detail?: string }): boolean {
  return p?.status === 'processed' && p?.status_detail === 'accredited'
}

function centavosParaString(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

export interface CartaoCheckout {
  token: string
  bandeiraId: string
  parcelas: number
  valorCentavos: number
}

/**
 * Fluxo "2 cartões": cria 1 order manual, adiciona a transação do cartão A,
 * só adiciona a do cartão B se A foi aprovado. Se B falhar, tenta remover a
 * transação de A (ver TODO-SANDBOX acima — não confirmado que isso desfaz a
 * cobrança) e cancela a order.
 */
export async function executarCheckoutDoisCartoes(
  deps: OrdersClientDeps,
  params: {
    externalReference: string
    payerEmail: string
    totalCentavos: number
    cartaoA: CartaoCheckout
    cartaoB: CartaoCheckout
  },
): Promise<ResultadoCheckoutMultiMetodo> {
  const { cartaoA, cartaoB, totalCentavos } = params
  if (cartaoA.valorCentavos + cartaoB.valorCentavos !== totalCentavos) {
    return {
      status: 'falhou',
      erro: 'soma_nao_bate',
      detalhe: `cartaoA(${cartaoA.valorCentavos}) + cartaoB(${cartaoB.valorCentavos}) != total(${totalCentavos})`,
    }
  }

  const order = await deps.criarOrderManual({
    externalReference: params.externalReference,
    totalAmount: centavosParaString(totalCentavos),
    payerEmail: params.payerEmail,
  })
  if (!order.id) return { status: 'falhou', erro: 'order_sem_id' }
  const orderId = order.id

  const respA = await deps.adicionarTransacao(orderId, {
    amount: centavosParaString(cartaoA.valorCentavos),
    payment_method: {
      id: cartaoA.bandeiraId,
      type: 'credit_card',
      token: cartaoA.token,
      installments: cartaoA.parcelas,
    },
  })
  const transacaoA = respA.payments?.[0]
  if (!pagamentoAprovado(transacaoA)) {
    await deps.cancelarOrder(orderId)
    return { status: 'falhou', orderId, erro: 'cartao_a_recusado', detalhe: transacaoA?.status_detail }
  }

  const respB = await deps.adicionarTransacao(orderId, {
    amount: centavosParaString(cartaoB.valorCentavos),
    payment_method: {
      id: cartaoB.bandeiraId,
      type: 'credit_card',
      token: cartaoB.token,
      installments: cartaoB.parcelas,
    },
  })
  const transacaoB = respB.payments?.[0]
  if (!pagamentoAprovado(transacaoB)) {
    if (transacaoA?.id) {
      await deps.removerTransacao(orderId, transacaoA.id)
    }
    await deps.cancelarOrder(orderId)
    return { status: 'falhou', orderId, erro: 'cartao_b_recusado', detalhe: transacaoB?.status_detail }
  }

  const processado = await deps.processarOrder(orderId)
  if (processado.status !== 'processed') {
    return { status: 'falhou', orderId, erro: 'process_nao_confirmou', detalhe: processado.status_detail }
  }

  return { status: 'pago', orderId }
}

/**
 * Fluxo "Pix + cartão" — etapa 1: cria a order manual e adiciona só a
 * transação Pix. Pix não confirma na hora (é assíncrono via QR/copia-e-cola),
 * então esta função só INICIA — a etapa 2 (completarCheckoutPixMaisCartao)
 * roda depois, disparada pelo webhook quando o Pix confirmar.
 */
export async function iniciarCheckoutPixMaisCartao(
  deps: OrdersClientDeps,
  params: {
    externalReference: string
    payerEmail: string
    valorPixCentavos: number
  },
): Promise<ResultadoCheckoutMultiMetodo & { qrCode?: unknown }> {
  const order = await deps.criarOrderManual({
    externalReference: params.externalReference,
    totalAmount: centavosParaString(params.valorPixCentavos),
    payerEmail: params.payerEmail,
  })
  if (!order.id) return { status: 'falhou', erro: 'order_sem_id' }

  const respPix = await deps.adicionarTransacao(order.id, {
    amount: centavosParaString(params.valorPixCentavos),
    payment_method: { id: 'pix', type: 'bank_transfer' },
  })

  return { status: 'aguardando_pix', orderId: order.id, qrCode: respPix.payments?.[0] }
}

/**
 * Fluxo "Pix + cartão" — etapa 2: chamada pelo webhook quando o Pix já foi
 * confirmado. Adiciona a transação do cartão pro valor restante. Se o cartão
 * falhar, NÃO tenta estornar o Pix automaticamente (Pix não tem captura
 * controlável — já liquidou) — decisão de negócio de como tratar isso
 * (estorno manual vs cobrar o resto depois) fica pro Luccas, não pro código.
 */
export async function completarCheckoutPixMaisCartao(
  deps: OrdersClientDeps,
  params: { orderId: string; valorRestanteCentavos: number; cartao: CartaoCheckout },
): Promise<ResultadoCheckoutMultiMetodo> {
  const { orderId, cartao } = params
  const resp = await deps.adicionarTransacao(orderId, {
    amount: centavosParaString(params.valorRestanteCentavos),
    payment_method: {
      id: cartao.bandeiraId,
      type: 'credit_card',
      token: cartao.token,
      installments: cartao.parcelas,
    },
  })
  const transacaoCartao = resp.payments?.[0]
  if (!pagamentoAprovado(transacaoCartao)) {
    return {
      status: 'aguardando_pagamento_restante',
      orderId,
      erro: 'cartao_recusado_apos_pix',
      detalhe: transacaoCartao?.status_detail,
    }
  }

  const processado = await deps.processarOrder(orderId)
  if (processado.status !== 'processed') {
    return { status: 'aguardando_pagamento_restante', orderId, erro: 'process_nao_confirmou' }
  }

  return { status: 'pago', orderId }
}
