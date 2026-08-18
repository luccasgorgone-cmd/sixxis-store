'use client'

// Captura o cookie _ga (client_id do GA4) no browser pra persistir no Pedido e
// repassar ao Measurement Protocol do webhook — liga a compra à sessão/
// campanha de origem. Best-effort: com Consent Mode v2, o cookie só existe
// depois do aceite de cookies analíticos (LGPD) — undefined é esperado, não erro.

function lerCookie(nome: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]+)'))
  return m ? decodeURIComponent(m[1]) : ''
}

export function capturarGaClientId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const raw = lerCookie('_ga')
  if (!raw) return undefined
  // Formato bruto: GA1.<domain_depth>.<client_id_parte1>.<client_id_parte2>.
  // O Measurement Protocol espera só o client_id (as 2 últimas partes).
  const partes = raw.split('.')
  return partes.length >= 4 ? partes.slice(2).join('.') : undefined
}
