import type { PaymentRequest } from 'mercadopago/dist/clients/order/commonTypes'

// Orquestração de negócio pro checkout multi-método (2 cartões, ou Pix +
// cartão pro restante). Depende de mercadopago-orders.ts só por injeção
// (OrdersClientDeps) — não importa o singleton direto — pra dar pra testar
// sem token real e sem rede (ver checkout-multi-metodo.test.ts).
//
// STATUS (testado em produção real em 2026-08-20): a conta MP da Sixxis
// bloqueia toda a Orders API com 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES —
// confirmado até num POST /v1/orders mínimo, sem nada de multi-método. Não é
// bug de código, é autorização de conta que só o Mercado Pago libera (Suporte
// MP, não um toggle no painel). Nenhum cartão chega a ser cobrado nesse
// cenário: criarOrderManual falha antes de qualquer transação ser criada.
// A dúvida original sobre `deleteTransaction` desfazer uma transação de
// cartão segue sem resposta — só é testável depois da Orders API liberada.

// O SDK oficial (mercadopago npm) lança o corpo de erro bruto da API em
// requests não-2xx (`throw await response.json()`), não uma instância de
// Error — por isso os catches abaixo tratam `unknown`, não `Error`.
function detalheDoErro(e: unknown): string {
  if (e && typeof e === 'object') {
    const obj = e as Record<string, unknown>
    const partes = [obj.code, obj.message].filter((v) => typeof v === 'string')
    if (partes.length > 0) return partes.join(': ')
  }
  return e instanceof Error ? e.message : String(e)
}

// Limpeza best-effort: uma falha ao cancelar/remover não pode derrubar a
// resposta ao cliente (o erro original já é o que importa reportar).
async function cancelarOrderSemQuebrar(deps: OrdersClientDeps, orderId: string): Promise<void> {
  try {
    await deps.cancelarOrder(orderId)
  } catch (e) {
    console.error('[checkout-multi-metodo] falha ao cancelar order', orderId, detalheDoErro(e))
  }
}

async function reverterCartaoA(
  deps: OrdersClientDeps,
  orderId: string,
  transacaoA: { id?: string } | undefined,
): Promise<void> {
  if (transacaoA?.id) {
    try {
      await deps.removerTransacao(orderId, transacaoA.id)
    } catch (e) {
      console.error(
        '[checkout-multi-metodo] falha ao remover transação A',
        orderId,
        transacaoA.id,
        detalheDoErro(e),
      )
    }
  }
  await cancelarOrderSemQuebrar(deps, orderId)
}

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
 * só adiciona a do cartão B se A foi aprovado. Se B falhar (recusa OU erro da
 * API), tenta remover a transação de A (ver STATUS acima — deleteTransaction
 * desfazer a cobrança segue não confirmado) e cancela a order.
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

  let orderId: string
  try {
    const order = await deps.criarOrderManual({
      externalReference: params.externalReference,
      totalAmount: centavosParaString(totalCentavos),
      payerEmail: params.payerEmail,
    })
    if (!order.id) return { status: 'falhou', erro: 'order_sem_id' }
    orderId = order.id
  } catch (e) {
    return { status: 'falhou', erro: 'order_falhou_criar', detalhe: detalheDoErro(e) }
  }

  let transacaoA: { id?: string; status?: string; status_detail?: string } | undefined
  try {
    const respA = await deps.adicionarTransacao(orderId, {
      amount: centavosParaString(cartaoA.valorCentavos),
      payment_method: {
        id: cartaoA.bandeiraId,
        type: 'credit_card',
        token: cartaoA.token,
        installments: cartaoA.parcelas,
      },
    })
    transacaoA = respA.payments?.[0]
  } catch (e) {
    await cancelarOrderSemQuebrar(deps, orderId)
    return { status: 'falhou', orderId, erro: 'cartao_a_falhou', detalhe: detalheDoErro(e) }
  }
  if (!pagamentoAprovado(transacaoA)) {
    await cancelarOrderSemQuebrar(deps, orderId)
    return { status: 'falhou', orderId, erro: 'cartao_a_recusado', detalhe: transacaoA?.status_detail }
  }

  let transacaoB: { id?: string; status?: string; status_detail?: string } | undefined
  try {
    const respB = await deps.adicionarTransacao(orderId, {
      amount: centavosParaString(cartaoB.valorCentavos),
      payment_method: {
        id: cartaoB.bandeiraId,
        type: 'credit_card',
        token: cartaoB.token,
        installments: cartaoB.parcelas,
      },
    })
    transacaoB = respB.payments?.[0]
  } catch (e) {
    await reverterCartaoA(deps, orderId, transacaoA)
    return { status: 'falhou', orderId, erro: 'cartao_b_falhou', detalhe: detalheDoErro(e) }
  }
  if (!pagamentoAprovado(transacaoB)) {
    await reverterCartaoA(deps, orderId, transacaoA)
    return { status: 'falhou', orderId, erro: 'cartao_b_recusado', detalhe: transacaoB?.status_detail }
  }

  try {
    const processado = await deps.processarOrder(orderId)
    if (processado.status !== 'processed') {
      return { status: 'falhou', orderId, erro: 'process_nao_confirmou', detalhe: processado.status_detail }
    }
  } catch (e) {
    return { status: 'falhou', orderId, erro: 'process_falhou', detalhe: detalheDoErro(e) }
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
  let orderId: string
  try {
    const order = await deps.criarOrderManual({
      externalReference: params.externalReference,
      totalAmount: centavosParaString(params.valorPixCentavos),
      payerEmail: params.payerEmail,
    })
    if (!order.id) return { status: 'falhou', erro: 'order_sem_id' }
    orderId = order.id
  } catch (e) {
    return { status: 'falhou', erro: 'order_falhou_criar', detalhe: detalheDoErro(e) }
  }

  try {
    const respPix = await deps.adicionarTransacao(orderId, {
      amount: centavosParaString(params.valorPixCentavos),
      payment_method: { id: 'pix', type: 'bank_transfer' },
    })
    return { status: 'aguardando_pix', orderId, qrCode: respPix.payments?.[0] }
  } catch (e) {
    await cancelarOrderSemQuebrar(deps, orderId)
    return { status: 'falhou', orderId, erro: 'pix_falhou', detalhe: detalheDoErro(e) }
  }
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
  let transacaoCartao: { status?: string; status_detail?: string } | undefined
  try {
    const resp = await deps.adicionarTransacao(orderId, {
      amount: centavosParaString(params.valorRestanteCentavos),
      payment_method: {
        id: cartao.bandeiraId,
        type: 'credit_card',
        token: cartao.token,
        installments: cartao.parcelas,
      },
    })
    transacaoCartao = resp.payments?.[0]
  } catch (e) {
    return {
      status: 'aguardando_pagamento_restante',
      orderId,
      erro: 'cartao_falhou_apos_pix',
      detalhe: detalheDoErro(e),
    }
  }
  if (!pagamentoAprovado(transacaoCartao)) {
    return {
      status: 'aguardando_pagamento_restante',
      orderId,
      erro: 'cartao_recusado_apos_pix',
      detalhe: transacaoCartao?.status_detail,
    }
  }

  try {
    const processado = await deps.processarOrder(orderId)
    if (processado.status !== 'processed') {
      return { status: 'aguardando_pagamento_restante', orderId, erro: 'process_nao_confirmou' }
    }
  } catch (e) {
    return {
      status: 'aguardando_pagamento_restante',
      orderId,
      erro: 'process_falhou_apos_pix',
      detalhe: detalheDoErro(e),
    }
  }

  return { status: 'pago', orderId }
}
