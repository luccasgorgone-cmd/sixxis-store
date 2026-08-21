// Orquestração de negócio pro checkout multi-método (2 cartões, ou Pix +
// cartão pro restante), sobre a Payments API clássica (`POST /v1/payments`,
// mesma usada pelo checkout de 1 método em criar-pagamento/route.ts).
//
// STATUS: a Orders API foi tentada primeiro e está BLOQUEADA pra conta da
// Sixxis (403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES, confirmado em produção
// real em 2026-08-20, sem previsão de desbloqueio — ver mercadopago-orders.ts,
// que fica intacto mas não é mais usado por este módulo). A Payments API já
// está ativa e é o que roda hoje pro checkout de 1 método — "2 métodos" aqui
// é literalmente 2 chamadas independentes de payment.create(), cada uma
// virando 1 linha de Pagamento ligada ao mesmo Pedido.
//
// Este arquivo só tem funções PURAS (nenhum Prisma aqui) — toda decisão
// (cobrar a próxima perna, aguardar, reverter, marcar pago) é calculada a
// partir de estado explícito passado por parâmetro, pra caber num teste sem
// rede e sem banco. Quem lê/escreve Prisma é a camada de orquestração nas
// rotas e no webhook (mercado-pago/route.ts), que chamam estas funções.
//
// O SDK oficial (mercadopago npm) lança o corpo de erro bruto da API em
// requests não-2xx (`throw await response.json()`), não uma instância de
// Error — por isso os catches abaixo tratam `unknown`, não `Error`.
export function detalheDoErro(e: unknown): string {
  if (e && typeof e === 'object') {
    const obj = e as Record<string, unknown>
    const partes = [obj.code, obj.message].filter((v) => typeof v === 'string')
    if (partes.length > 0) return partes.join(': ')
  }
  return e instanceof Error ? e.message : String(e)
}

export interface PaymentsClientDeps {
  /** Corpo EXATO do POST /v1/payments (mesmo shape de criar-pagamento/route.ts). */
  criarPagamento(params: {
    idempotencyKey: string
    body: Record<string, unknown>
    /** Device ID do navegador (window.MP_DEVICE_SESSION_ID) — sinal de antifraude do MP. */
    meliSessionId?: string
  }): Promise<{
    id?: string
    status?: string
    status_detail?: string
    point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } }
  }>
  /** Busca o status REAL na MP — nunca decide reversão a partir do status local. */
  buscarPagamento(mpPaymentId: string): Promise<{ status?: string; status_detail?: string }>
  /** Captura total de um pagamento criado com capture:false (autorizado, não capturado). */
  capturarPagamento(mpPaymentId: string): Promise<{ status?: string; status_detail?: string }>
  /** Refund total. Só chamar quando o status real for 'approved'. */
  estornarPagamento(mpPaymentId: string): Promise<void>
  /** Cancel (perna autorizada mas nunca capturada). Só quando status real 'authorized'. */
  cancelarPagamento(mpPaymentId: string): Promise<void>
}

export function idempotencyKeyPerna(tentativaId: string, perna: string): string {
  return `mm:${tentativaId}:${perna}`
}

// ─── Reversão de 1 perna (requisitos 1, 6, 7) ────────────────────────────────

export const MAX_TENTATIVAS_ESTORNO = 3

export interface PagamentoParaReverter {
  mpPaymentId: string | null
  estornoStatus: string | null
  estornoTentativas: number
}

export type EstornoStatus =
  | 'nao_aplicavel'
  | 'pendente'
  | 'estornado'
  | 'cancelado'
  | 'falhou_estorno'

export interface ResultadoReversao {
  estornoStatus: EstornoStatus
  estornoTentativas: number
  estornoErro: string | null
  /** true quando bateu o teto de tentativas — quem chama deve emitir alerta alto. */
  precisaAlertar: boolean
}

const ESTADOS_TERMINAIS_ESTORNO: EstornoStatus[] = ['nao_aplicavel', 'estornado', 'cancelado']

/**
 * Reverte 1 perna com base no status REAL na MP (nunca no que o nosso banco
 * acha que é — requisito 1). 'approved' → refund. 'authorized' → cancel.
 * Qualquer outra coisa (rejected/cancelled/pending/in_process/refunded) →
 * dinheiro nunca moveu (ou já voltou por conta própria) → nao_aplicavel.
 *
 * Idempotente (requisito 7): se já está num estado terminal, retorna sem
 * chamar a API de novo. Quem chama é responsável pelo claim atômico contra
 * concorrência (2 gatilhos disparando ao mesmo tempo) — ver
 * reverterPernaComClaim nas rotas/webhook, que faz o
 * `UPDATE ... WHERE estornoStatus IS NULL OR 'falhou_estorno'` antes de invocar
 * esta função.
 */
export async function reverterPerna(
  deps: PaymentsClientDeps,
  pagamento: PagamentoParaReverter,
): Promise<ResultadoReversao> {
  if (
    pagamento.estornoStatus &&
    ESTADOS_TERMINAIS_ESTORNO.includes(pagamento.estornoStatus as EstornoStatus)
  ) {
    return {
      estornoStatus: pagamento.estornoStatus as EstornoStatus,
      estornoTentativas: pagamento.estornoTentativas,
      estornoErro: null,
      precisaAlertar: false,
    }
  }
  if (!pagamento.mpPaymentId) {
    return {
      estornoStatus: 'nao_aplicavel',
      estornoTentativas: pagamento.estornoTentativas,
      estornoErro: null,
      precisaAlertar: false,
    }
  }

  const tentativas = pagamento.estornoTentativas + 1
  const precisaAlertar = tentativas >= MAX_TENTATIVAS_ESTORNO

  let statusReal: string | undefined
  try {
    const atual = await deps.buscarPagamento(pagamento.mpPaymentId)
    statusReal = atual.status
  } catch (e) {
    return {
      estornoStatus: 'falhou_estorno',
      estornoTentativas: tentativas,
      estornoErro: `falha ao confirmar status real antes de reverter: ${detalheDoErro(e)}`,
      precisaAlertar,
    }
  }

  try {
    if (statusReal === 'approved') {
      await deps.estornarPagamento(pagamento.mpPaymentId)
      return { estornoStatus: 'estornado', estornoTentativas: tentativas, estornoErro: null, precisaAlertar: false }
    }
    if (statusReal === 'authorized') {
      await deps.cancelarPagamento(pagamento.mpPaymentId)
      return { estornoStatus: 'cancelado', estornoTentativas: tentativas, estornoErro: null, precisaAlertar: false }
    }
    return { estornoStatus: 'nao_aplicavel', estornoTentativas: tentativas, estornoErro: null, precisaAlertar: false }
  } catch (e) {
    return {
      estornoStatus: 'falhou_estorno',
      estornoTentativas: tentativas,
      estornoErro: detalheDoErro(e),
      precisaAlertar,
    }
  }
}

// ─── Cobrança de 1 perna, idempotente (requisito 4) ──────────────────────────

export interface PernaCartao {
  token: string
  bandeiraId: string
  parcelas: number
  valorCentavos: number
}

export interface ResultadoCobrancaPerna {
  mpPaymentId: string | null
  status: string | null
  statusDetail: string | null
  erro: string | null
}

/**
 * Cria 1 pagamento com idempotencyKey determinística (tentativaId+perna) —
 * dedup NATIVO do lado do Mercado Pago via requestOptions.idempotencyKey
 * (mesma chave numa retentativa, mesmo corpo → MP devolve o MESMO pagamento
 * em vez de cobrar de novo). Isso cobre retry de rede E crash-recovery: não
 * importa quantas vezes esta função for chamada com a mesma tentativaId+perna,
 * nunca cobra 2x.
 *
 * `capturarAoCriar` (default true) controla `capture` no corpo da MP:
 *  - true  → cobrança normal, 1 etapa (usado no restante do pix+cartão: quando
 *    esta perna é criada o Pix já confirmou, não tem "esperar a outra perna
 *    também dar certo" — captura na hora, igual o checkout de 1 método).
 *  - false → só AUTORIZA (reserva no limite, nada é cobrado ainda). Usado no
 *    fluxo "2 cartões": as 2 pernas só viram cobrança de verdade (capturarPerna
 *    Cartao) depois que as 2 autorizarem — assim, se uma falhar, a outra nunca
 *    chegou a tirar dinheiro do cliente (cancela em vez de estornar).
 */
export async function cobrarPernaCartao(
  deps: PaymentsClientDeps,
  params: {
    idempotencyKey: string
    externalReference: string
    payerEmail: string
    notificationUrl: string
    metadata: Record<string, unknown>
    cartao: PernaCartao
    capturarAoCriar?: boolean
    meliSessionId?: string
    /** Sinais de antifraude (payer enriquecido + additional_info) — ver
     *  mercadopago-antifraude.ts. Sem isso o MP tem menos contexto pra
     *  aprovar (foi a causa real de um cc_rejected_high_risk em produção). */
    payerExtra?: Record<string, unknown>
    additionalInfo?: Record<string, unknown>
  },
): Promise<ResultadoCobrancaPerna> {
  try {
    const resp = await deps.criarPagamento({
      idempotencyKey: params.idempotencyKey,
      meliSessionId: params.meliSessionId,
      body: {
        transaction_amount: params.cartao.valorCentavos / 100,
        token: params.cartao.token,
        installments: params.cartao.parcelas,
        payment_method_id: params.cartao.bandeiraId,
        capture: params.capturarAoCriar ?? true,
        payer: { email: params.payerEmail, ...params.payerExtra },
        external_reference: params.externalReference,
        notification_url: params.notificationUrl,
        metadata: params.metadata,
        ...(params.additionalInfo ? { additional_info: params.additionalInfo } : {}),
      },
    })
    return {
      mpPaymentId: resp.id ? String(resp.id) : null,
      status: resp.status ?? null,
      statusDetail: resp.status_detail ?? null,
      erro: null,
    }
  } catch (e) {
    return { mpPaymentId: null, status: null, statusDetail: null, erro: detalheDoErro(e) }
  }
}

/**
 * Captura uma perna criada com capture:false (fluxo "2 cartões", etapa 2 —
 * só chamada depois que as 2 pernas já autorizaram). Se a captura em si
 * falhar (rede, ou a MP recusar), quem chama deve reverter pelo status REAL
 * (reverterPerna) — não assumir nada aqui.
 */
export async function capturarPernaCartao(
  deps: PaymentsClientDeps,
  mpPaymentId: string,
): Promise<ResultadoCobrancaPerna> {
  try {
    const resp = await deps.capturarPagamento(mpPaymentId)
    return {
      mpPaymentId,
      status: resp.status ?? null,
      statusDetail: resp.status_detail ?? null,
      erro: null,
    }
  } catch (e) {
    return { mpPaymentId, status: null, statusDetail: null, erro: detalheDoErro(e) }
  }
}

export async function cobrarPernaPix(
  deps: PaymentsClientDeps,
  params: {
    idempotencyKey: string
    externalReference: string
    payerEmail: string
    notificationUrl: string
    metadata: Record<string, unknown>
    valorCentavos: number
    meliSessionId?: string
    payerExtra?: Record<string, unknown>
    additionalInfo?: Record<string, unknown>
  },
): Promise<ResultadoCobrancaPerna & { qrCodeBase64?: string; qrCodeCopiaECola?: string }> {
  try {
    const resp = await deps.criarPagamento({
      idempotencyKey: params.idempotencyKey,
      meliSessionId: params.meliSessionId,
      body: {
        transaction_amount: params.valorCentavos / 100,
        payment_method_id: 'pix',
        payer: { email: params.payerEmail, ...params.payerExtra },
        external_reference: params.externalReference,
        notification_url: params.notificationUrl,
        metadata: params.metadata,
        ...(params.additionalInfo ? { additional_info: params.additionalInfo } : {}),
      },
    })
    const txData = resp.point_of_interaction?.transaction_data
    return {
      mpPaymentId: resp.id ? String(resp.id) : null,
      status: resp.status ?? null,
      statusDetail: resp.status_detail ?? null,
      erro: null,
      qrCodeBase64: txData?.qr_code_base64,
      qrCodeCopiaECola: txData?.qr_code,
    }
  } catch (e) {
    return { mpPaymentId: null, status: null, statusDetail: null, erro: detalheDoErro(e) }
  }
}

// ─── Decisão pura: o que fazer com uma tentativa, dado o estado das pernas ───
// (requisitos 2, 3, 5 — pending nunca vira falha nem pago, timeout do pix
// reverte, soma exata é revalidada com os valores REAIS cobrados.)

export interface EstadoPerna {
  status: string | null
  valorCentavos: number
}

export type DecisaoTentativa =
  | { acao: 'cobrar_proxima'; perna: string }
  | { acao: 'capturar_proxima'; perna: string }
  | { acao: 'aguardar' }
  | { acao: 'pago' }
  | { acao: 'falhou'; erro: string; pernasParaReverter: string[] }

/** approved=aprovado. pending/in_process/authorized=pendente (req 2 — nunca
 * decide nada em cima disso, só espera resolver). Qualquer outra coisa
 * (rejected, cancelled, ou ausente) = recusado. */
export function classificarStatusPerna(status: string | null | undefined): 'aprovado' | 'pendente' | 'recusado' {
  if (status === 'approved') return 'aprovado'
  if (status === 'pending' || status === 'in_process' || status === 'authorized') return 'pendente'
  return 'recusado'
}

/** Fase de autorização de UMA perna criada com capture:false (fluxo "2
 * cartões"). Distingue 'authorized' (reservou, ainda não cobrou) de
 * 'approved' (já capturado de verdade) — classificarStatusPerna trata os
 * dois como "pendente" porque é genérico pro resto do sistema; aqui a
 * distinção é o requisito inteiro. */
function faseAutorizacao(status: string | null | undefined): 'autorizado' | 'capturado' | 'pendente' | 'recusado' {
  if (status === 'approved') return 'capturado'
  if (status === 'authorized') return 'autorizado'
  if (status === 'pending' || status === 'in_process') return 'pendente'
  return 'recusado'
}

/**
 * "2 cartões" em 2 fases — nunca cobra de verdade até as 2 pernas autorizarem:
 *  Fase 1 (autorizar): cobra A (capture:false) → cobra B (capture:false).
 *  Fase 2 (capturar): só depois das 2 autorizadas, captura A → captura B.
 * Se qualquer autorização falhar, cancela a outra (nunca tirou dinheiro do
 * cliente — não precisa de refund, só solta a reserva no limite). Só existe
 * risco de precisar de refund de verdade na borda rara de uma CAPTURA em si
 * falhar depois que a outra perna já foi capturada (requisito 5/6 cobrem
 * isso via reverterPerna, que sempre confere o status real antes de agir).
 */
export function avaliarTentativaDoisCartoes(
  totalCentavos: number,
  pernaA: EstadoPerna | undefined,
  pernaB: EstadoPerna | undefined,
): DecisaoTentativa {
  if (!pernaA) return { acao: 'cobrar_proxima', perna: 'A' }
  const faseA = faseAutorizacao(pernaA.status)
  if (faseA === 'recusado') return { acao: 'falhou', erro: 'cartao_a_recusado', pernasParaReverter: [] }
  if (faseA === 'pendente') return { acao: 'aguardar' }

  if (!pernaB) return { acao: 'cobrar_proxima', perna: 'B' }
  const faseB = faseAutorizacao(pernaB.status)
  if (faseB === 'pendente') return { acao: 'aguardar' }
  if (faseB === 'recusado') return { acao: 'falhou', erro: 'cartao_b_recusado', pernasParaReverter: ['A'] }

  // As 2 autorizadas (ou já capturadas, numa retomada) — captura uma de cada vez.
  if (faseA === 'autorizado') return { acao: 'capturar_proxima', perna: 'A' }
  if (faseB === 'autorizado') return { acao: 'capturar_proxima', perna: 'B' }

  // As 2 capturadas — revalida a soma com os valores REAIS cobrados (req 5),
  // não confia só na checagem feita antes de cobrar.
  if (pernaA.valorCentavos + pernaB.valorCentavos !== totalCentavos) {
    return { acao: 'falhou', erro: 'soma_nao_bate_pos_cobranca', pernasParaReverter: ['A', 'B'] }
  }
  return { acao: 'pago' }
}

export function avaliarTentativaPixMaisCartao(
  totalCentavos: number,
  pernaPix: EstadoPerna | undefined,
  pernaRestante: EstadoPerna | undefined,
  pixExpirado: boolean,
): DecisaoTentativa {
  if (!pernaPix) return { acao: 'cobrar_proxima', perna: 'pix' }
  const pix = classificarStatusPerna(pernaPix.status)
  if (pix === 'recusado') return { acao: 'falhou', erro: 'pix_recusado', pernasParaReverter: [] }
  if (pix === 'pendente') {
    // requisito 3: pix assíncrono espera o webhook — só vira falha no prazo
    // esgotado, e aí reverte (via cancel/refund conforme status real de cada
    // perna que porventura tenha sido criada, ver reconciliarTimeoutPix).
    if (pixExpirado) return { acao: 'falhou', erro: 'pix_expirou', pernasParaReverter: ['pix', 'restante'] }
    return { acao: 'aguardar' }
  }

  // pix aprovado
  if (!pernaRestante) return { acao: 'cobrar_proxima', perna: 'restante' }
  const restante = classificarStatusPerna(pernaRestante.status)
  if (restante === 'pendente') return { acao: 'aguardar' }
  if (restante === 'recusado') {
    // Decisão de negócio já documentada: NÃO estorna o pix automaticamente
    // quando só o cartão do restante falha (pix não tem captura controlável —
    // já liquidou; diferente do timeout, que é decisão explícita do Luccas).
    return { acao: 'falhou', erro: 'cartao_restante_recusado', pernasParaReverter: [] }
  }

  if (pernaPix.valorCentavos + pernaRestante.valorCentavos !== totalCentavos) {
    return { acao: 'falhou', erro: 'soma_nao_bate_pos_cobranca', pernasParaReverter: ['pix', 'restante'] }
  }
  return { acao: 'pago' }
}
