import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

// Suporta tanto MERCADOPAGO_ACCESS_TOKEN (Sprint 2A) quanto MP_ACCESS_TOKEN (legado)
const accessToken =
  process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN

if (!accessToken && process.env.NODE_ENV !== 'test') {
  console.warn('[mercadopago] Access token ausente — pagamentos desabilitados')
}

export const mpClient = accessToken
  ? new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    })
  : null

export const mpPayment = mpClient ? new Payment(mpClient) : null
export const mpPreference = mpClient ? new Preference(mpClient) : null

export const MP_PUBLIC_KEY =
  process.env.MERCADOPAGO_PUBLIC_KEY ?? process.env.MP_PUBLIC_KEY ?? ''
export const MP_ENV = process.env.MERCADOPAGO_ENV ?? 'sandbox'
export const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? ''

// ─── Tarifa real do MP (margem de contribuição) ──────────────────────────────
// Fonte única da extração. Usada pelo webhook (resposta que ele JÁ busca) e pelo
// backfill (que lê Pagamento.rawResponse antes de tocar na API do MP).
//
// `fee_details` é uma lista tipo:
//   [{ type:'mercadopago_fee', amount:103.25, fee_payer:'collector' },
//    { type:'financing_fee',   amount:143.37, fee_payer:'collector' }]
//
// Só entram os fees pagos pelo COLLECTOR (nós). Um fee com fee_payer:'payer' é
// custo do cliente, não nosso — somá-lo inflaria a taxa e comeria a margem
// indevidamente. `financing_fee` do collector é o juro do parcelamento que a
// loja absorve (os 10x "sem juros"): é custo real e deve entrar.
export interface MpFeeDetail {
  type?: string
  amount?: number | string
  fee_payer?: string
}

/**
 * Soma a tarifa do MP em R$.
 * @returns número (pode ser 0) quando `fee_details` veio como lista;
 *          `null` quando o campo está ausente/inválido — isto é, taxa
 *          DESCONHECIDA. null nunca deve ser exibido como "R$ 0,00".
 */
export function somarTaxaMp(feeDetails: unknown): number | null {
  if (!Array.isArray(feeDetails)) return null

  let total = 0
  for (const f of feeDetails as MpFeeDetail[]) {
    if (!f || typeof f !== 'object') continue
    // Sem fee_payer explícito, o MP cobra do collector — assumimos nosso custo.
    if (f.fee_payer != null && f.fee_payer !== 'collector') continue
    const v = Number(f.amount)
    if (Number.isFinite(v)) total += v
  }
  return Math.round(total * 100) / 100
}
