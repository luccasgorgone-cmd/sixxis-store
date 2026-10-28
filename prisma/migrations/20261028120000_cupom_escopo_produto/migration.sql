-- Restrição opcional de cupom por produto (modelo): CSV de Produto.id.
-- Nullable e sem backfill: cupons existentes seguem valendo no carrinho inteiro.
ALTER TABLE `Cupom` ADD COLUMN `produtoIds` VARCHAR(191) NULL;

-- Cupom 10OFFTREND — 10% OFF exclusivo do Climatizador SX200 Trend (slug sx200-trend).
-- O código nasce aqui porque o banco só é alcançável no ambiente do deploy: a
-- subquery resolve o Produto.id pelo slug no próprio servidor.
--   INSERT IGNORE  → se o código já existir (unique), ignora (idempotente p/ reaplicação).
--   FROM Produto WHERE slug=... LIMIT 1 → se o produto não existir, nada é inserido.
-- "Não combina com outro cupom" já é nativo: o pedido aceita um único cupom e a
-- promo da 2ª unidade, quando ativa, ignora cupom.
INSERT IGNORE INTO `Cupom`
  (`id`, `codigo`, `tipo`, `valor`, `usoMaximo`, `totalUsos`, `pedidoMinimo`,
   `validade`, `ativo`, `descricao`, `primeiraCompra`, `produtoIds`, `createdAt`, `updatedAt`)
SELECT
  CONCAT('cpm_', REPLACE(UUID(), '-', '')),
  '10OFFTREND', 'PERCENTUAL', 10, NULL, 0, 0,
  NULL, 1,
  'Climatizador SX200 Trend — 10% OFF (exclusivo deste modelo; não acumula com outro cupom)',
  0, p.`id`, NOW(3), NOW(3)
FROM `Produto` p
WHERE p.`slug` = 'sx200-trend'
LIMIT 1;
