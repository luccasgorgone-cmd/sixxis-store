-- ─────────────────────────────────────────────────────────────────────────────
-- Ajustes comerciais Black Friday 2026 (pedido do Luccas, 23/11/2026):
--   1) REVERTER o +20% dos preços — restaura os valores ORIGINAIS a partir do
--      backup criado pela migration 20261122213000_precos_bf2026_mais_20pct.
--   2) Adicionar coluna `Cupom.unidadeUnica` (aditiva, default false).
--   3) Criar/garantir o cupom BLACKFRIDAY10 (10% OFF, válido SÓ com 1 unidade).
--
-- Complementos em CÓDIGO (deployados juntos): FATOR_MARKUP_SITE = 1 (sync do ERP
-- não reaplica markup), frete cobrado com FATOR_FRETE_BF = 1.15 (+15%), e
-- PROMO_BF.excluir = SX200 Prime (fora da promo da 2ª unidade).
--
-- Idempotente: o revert deriva do backup (reaplicar restaura o mesmo original);
-- o ALTER é aditivo; o INSERT do cupom usa ON DUPLICATE KEY UPDATE.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Reverter preços ao valor ORIGINAL (antes do +20%).
UPDATE `Produto` p
  JOIN `_BackupPrecoBF2026` b ON b.`produtoId` = p.`id`
  SET p.`preco` = b.`precoOrig`,
      p.`precoPromocional` = b.`precoPromoOrig`;

UPDATE `VariacaoProduto` v
  JOIN `_BackupPrecoVariacaoBF2026` b ON b.`variacaoId` = v.`id`
  SET v.`preco` = b.`precoOrig`;

-- 2) Coluna unidadeUnica no Cupom (aditiva).
ALTER TABLE `Cupom` ADD COLUMN `unidadeUnica` BOOLEAN NOT NULL DEFAULT false;

-- 3) Cupom BLACKFRIDAY10 — 10% em qualquer produto, válido SÓ na compra de 1
--    unidade (o que o torna mutuamente exclusivo com a promo da 2ª unidade).
INSERT INTO `Cupom`
  (`id`, `codigo`, `tipo`, `valor`, `usoMaximo`, `totalUsos`, `pedidoMinimo`,
   `validade`, `ativo`, `descricao`, `primeiraCompra`, `produtoIds`, `unidadeUnica`,
   `createdAt`, `updatedAt`)
VALUES
  ('cpm_blackfriday10_bf2026', 'BLACKFRIDAY10', 'PERCENTUAL', 10, NULL, 0, 0,
   NULL, true,
   '10% OFF em qualquer produto — válido só na compra de 1 unidade (não acumula com a promoção da 2ª unidade).',
   false, NULL, true,
   CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `tipo`           = VALUES(`tipo`),
  `valor`          = VALUES(`valor`),
  `usoMaximo`      = VALUES(`usoMaximo`),
  `pedidoMinimo`   = VALUES(`pedidoMinimo`),
  `validade`       = VALUES(`validade`),
  `ativo`          = VALUES(`ativo`),
  `descricao`      = VALUES(`descricao`),
  `primeiraCompra` = VALUES(`primeiraCompra`),
  `produtoIds`     = VALUES(`produtoIds`),
  `unidadeUnica`   = VALUES(`unidadeUnica`),
  `updatedAt`      = CURRENT_TIMESTAMP(3);
