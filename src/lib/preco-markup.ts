// ─── Markup de preço do site (Black Friday 2026 — +20%) ──────────────────────
// Fonte ÚNICA do fator de aumento aplicado sobre o catálogo. O aumento nos
// produtos JÁ EXISTENTES é feito pela migration de dados
// (20261122213000_precos_bf2026_mais_20pct). Este fator existe para manter o
// +20% DURÁVEL quando o ERP empurra um sync: a rota /api/erp-sync reaplica o
// markup sobre o preço BASE recebido do ERP, senão o sync sobrescreveria o
// preço de volta ao valor do ERP (sem o +20%).
//
// PRESSUPOSTO IMPORTANTE: o ERP envia o preço BASE (sem o +20% do site). Se o
// catálogo do ERP for editado para já conter o preço aumentado, DESLIGUE o
// markup aqui (FATOR = 1) para não dobrar (×1.44). Mudança a combinar com o
// Jarvis ERP / Luccas.
//
// Reversão do +20%: rodar scripts/rollback-precos-bf2026.sql E voltar FATOR=1.

/** Fator de aumento do site sobre o preço base. 1.20 = +20%. 1 = desligado. */
export const FATOR_MARKUP_SITE = 1.20

/** Aplica o markup do site e arredonda a 2 casas. null/undefined passam direto. */
export function aplicarMarkupSite(preco: number): number
export function aplicarMarkupSite(preco: number | null | undefined): number | null | undefined
export function aplicarMarkupSite(preco: number | null | undefined): number | null | undefined {
  if (preco == null || !Number.isFinite(preco)) return preco
  return Math.round(preco * FATOR_MARKUP_SITE * 100) / 100
}
