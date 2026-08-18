// ─── GA4 Measurement Protocol — SERVER ONLY ──────────────────────────────────
// Envia o evento `purchase` direto pra propriedade GA4 (mp/collect) a partir do
// webhook do Mercado Pago — cobre pagamento aprovado mesmo quando o cliente
// nunca volta pra `/pedido/[id]/sucesso` (Pix/boleto assíncrono, comum no
// fluxo real da loja). Esse webhook vira a ÚNICA fonte do evento `purchase`
// pro GA4 (o dataLayer.push do browser foi removido de trackPurchase() em
// events.ts) — evita contar a mesma venda duas vezes.
//
// client_id vem do cookie _ga capturado no checkout (best-effort — Consent
// Mode v2 só grava o cookie após aceite de cookies analíticos).

const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID
const API_SECRET = process.env.GA4_MP_API_SECRET

export interface Ga4PurchaseInput {
  clientId: string | null | undefined
  transactionId: string // = pedido.id
  value: number
  currency: string
  items: { item_id: string; price: number; quantity: number }[]
  shipping?: number
  coupon?: string
}

// Envia o Purchase ao Measurement Protocol. NUNCA lança — retorna
// { ok, error, skipped } para o chamador (webhook) logar sem quebrar o fluxo
// do pedido. skipped=true quando não há client_id (nada foi enviado, não é falha).
export async function enviarPurchaseGa4(
  input: Ga4PurchaseInput,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  if (!MEASUREMENT_ID || !API_SECRET) {
    return { ok: false, error: 'GA4_MEASUREMENT_ID ou GA4_MP_API_SECRET ausente' }
  }
  if (!input.clientId) {
    // Cliente nunca aceitou cookies analíticos (ou sync antigo, sem o campo).
    // Sem client_id o evento fica órfão — melhor pular do que poluir o GA4.
    return { ok: false, skipped: true, error: 'gaClientId ausente no pedido' }
  }

  const body = {
    client_id: input.clientId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: input.transactionId,
          value: input.value,
          currency: input.currency,
          shipping: input.shipping,
          coupon: input.coupon,
          items: input.items,
        },
      },
    ],
  }

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    // mp/collect sempre responde 204 mesmo com payload malformado (só o
    // endpoint /debug/mp/collect valida) — um !resp.ok aqui é erro de
    // rede/infra, não de payload.
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      return { ok: false, error: `GA4 MP ${resp.status}: ${txt.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
