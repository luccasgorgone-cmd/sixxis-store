-- ─────────────────────────────────────────────────────────────────────────────
-- Black Friday 2026 — aumento de +20% em TODO o catálogo.
--
-- Escopo: Produto.preco, Produto.precoPromocional (quando houver) e
-- VariacaoProduto.preco (variações precificadas). Pedido direto do Luccas
-- (22/11/2026): "subir o valor de todos os produtos do site inteiro em 20%".
--
-- FRETE: intencionalmente NÃO alterado aqui. O frete cobrado ao cliente é 9% do
-- preço efetivo (lib/frete-politica.ts) nas UFs cobradas; subindo o preço +20%,
-- o frete sobe +20% automaticamente. Mexer em frete aqui causaria +44%.
--
-- SEGURANÇA / REVERSIBILIDADE / IDEMPOTÊNCIA (segue o padrão das migrations de
-- dados deste repo, que o banco só é alcançável no ambiente do deploy):
--   • Snapshot dos valores ORIGINAIS em tabelas de backup (INSERT IGNORE grava
--     só na 1ª aplicação — nunca sobrescreve o original).
--   • O novo preço é DERIVADO do backup (× 1.20, ROUND 2 casas), então reaplicar
--     produz exatamente o MESMO valor (idempotente).
--   • Reversão: scripts/rollback-precos-bf2026.sql restaura a partir do backup.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Backup dos produtos (uma única vez).
CREATE TABLE IF NOT EXISTS `_BackupPrecoBF2026` (
  `produtoId`      VARCHAR(191) NOT NULL,
  `precoOrig`      DECIMAL(10,2) NOT NULL,
  `precoPromoOrig` DECIMAL(10,2) NULL,
  `criadoEm`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`produtoId`)
);

INSERT IGNORE INTO `_BackupPrecoBF2026` (`produtoId`, `precoOrig`, `precoPromoOrig`)
  SELECT `id`, `preco`, `precoPromocional` FROM `Produto`;

-- 2) +20% nos produtos, DERIVADO do backup (idempotente). null promocional fica null.
UPDATE `Produto` p
  JOIN `_BackupPrecoBF2026` b ON b.`produtoId` = p.`id`
  SET p.`preco` = ROUND(b.`precoOrig` * 1.20, 2),
      p.`precoPromocional` = CASE
        WHEN b.`precoPromoOrig` IS NULL THEN NULL
        ELSE ROUND(b.`precoPromoOrig` * 1.20, 2)
      END;

-- 3) Backup das variações (uma única vez).
CREATE TABLE IF NOT EXISTS `_BackupPrecoVariacaoBF2026` (
  `variacaoId` VARCHAR(191) NOT NULL,
  `precoOrig`  DECIMAL(10,2) NULL,
  `criadoEm`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`variacaoId`)
);

INSERT IGNORE INTO `_BackupPrecoVariacaoBF2026` (`variacaoId`, `precoOrig`)
  SELECT `id`, `preco` FROM `VariacaoProduto`;

-- 4) +20% nas variações precificadas (null continua null).
UPDATE `VariacaoProduto` v
  JOIN `_BackupPrecoVariacaoBF2026` b ON b.`variacaoId` = v.`id`
  SET v.`preco` = CASE
    WHEN b.`precoOrig` IS NULL THEN NULL
    ELSE ROUND(b.`precoOrig` * 1.20, 2)
  END;
