import { PROMO_BF } from './promo-segunda-unidade'

// ─── Freeze de preço no sync do ERP (Black Friday 2026) ──────────────────────
// Durante a janela comercial de BF os preços da loja são AUTORITATIVOS:
//   • base revertido ao original (FATOR_MARKUP_SITE = 1);
//   • −15% dos aspiradores GRAVADO em Produto.preco pela migration
//     20261123160000_aspirador_desconto_15pct;
//   • eventuais promoções manuais em Produto.precoPromocional.
// Um push do ERP em POST /api/erp-sync reescreveria Produto.preco/precoPromocional
// com o preço-base cru do ERP e apagaria esses ajustes. Este freeze faz o import
// atualizar catálogo/estoque/descrição/imagens/ativo mas NÃO o preço de produtos
// JÁ EXISTENTES. Produtos novos (create) continuam recebendo preço normalmente.
//
// Fonte única da janela: PROMO_BF.inicio..PROMO_BF.fim (lib/promo-segunda-unidade),
// independente do interruptor PROMO_BF.ativa — o preço gravado precisa de proteção
// mesmo que a promo da 2ª unidade esteja desligada.
//
// Override sem deploy (env OPCIONAL, default seguro = congela na janela):
//   ERP_SYNC_PRICE_FREEZE = 'off'  → nunca congela (comportamento legado);
//   ERP_SYNC_PRICE_FREEZE = 'on'   → sempre congela;
//   ausente/qualquer outro valor   → automático pela janela de BF.
export function precoCongeladoNoSync(agora: Date = new Date()): boolean {
  const env = process.env.ERP_SYNC_PRICE_FREEZE?.trim().toLowerCase()
  if (env === 'off') return false
  if (env === 'on') return true

  const t = agora.getTime()
  if (t < new Date(PROMO_BF.inicio).getTime()) return false
  if (PROMO_BF.fim !== null && t > new Date(PROMO_BF.fim).getTime()) return false
  return true
}
