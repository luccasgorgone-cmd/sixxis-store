// ─── Data da Nota Fiscal — DATA PURA ancorada ao MEIO-DIA UTC ────────────────
//
// `Pedido.dataNotaFiscal` representa um DIA-CALENDÁRIO (é ele que faz a garantia
// contar), NÃO um instante. O CRM adota a mesma convenção (dataSomenteDia).
//
// Por que meio-dia UTC e não meia-noite? Com os números:
//   Registro                          | toISOString().slice(0,10) | em America/Sao_Paulo
//   2026-07-15T00:00:00Z (meia-noite) | 2026-07-15                | 14/07/2026  <- ERRADO
//   2026-07-15T12:00:00Z (meio-dia)   | 2026-07-15                | 15/07/2026  <- correto
// No meio-dia UTC os dois métodos concordam, com 12h de folga para cada lado.
// Meia-noite UTC retrocede o dia em qualquer leitura no fuso brasileiro (UTC-3).
//
// ESTE É O PONTO ÚNICO: todo lugar que grava ou lê a data usa estes helpers —
// zero duplicação, zero `new Date(valor)` cru (que produz meia-noite UTC).

// "YYYY-MM-DD" (dia-calendário) -> Date ancorada ao meio-dia UTC daquele dia.
// Retorna null se a string não for um dia ISO válido.
export function ancorarMeioDiaUtc(diaISO: string | null | undefined): Date | null {
  if (!diaISO) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(diaISO.trim())
  if (!m) return null
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

// Date (gravada ao meio-dia UTC) -> "YYYY-MM-DD". No meio-dia UTC o dia UTC e o
// dia de Brasília coincidem, então basta o slice do ISO.
export function formatarDiaISO(d: Date | null | undefined): string | null {
  if (!d) return null
  const dt = d instanceof Date ? d : new Date(d)
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10)
}
