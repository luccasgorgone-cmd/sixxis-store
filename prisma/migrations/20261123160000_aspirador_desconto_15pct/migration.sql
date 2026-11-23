-- ─────────────────────────────────────────────────────────────────────────────
-- Desconto de -15% no preço dos ASPIRADORES (categoria 'aspiradores').
-- Pedido do Luccas, 23/11/2026: "no aspirador dá um desconto a mais de 15% no
-- valor do produto".
--
-- Padrão das migrations de dados deste repo (banco só alcançável no deploy):
--   • Snapshot dos valores ORIGINAIS em tabela de backup (INSERT IGNORE grava só
--     na 1ª aplicação — nunca sobrescreve o original).
--   • O novo preço é DERIVADO do backup (× 0.85, ROUND 2 casas) → reaplicar
--     produz o MESMO valor (idempotente).
--   • Reversão: restaurar Produto.preco/precoPromocional a partir do backup.
--
-- OBS (durabilidade): o markup do site está em FATOR_MARKUP_SITE = 1; um sync do
-- ERP reescreve o preço base e removeria este -15%. Se precisar durável no sync,
-- combinar com o Jarvis ERP um fator por categoria. Aqui ajusta os preços atuais.
-- ─────────────────────────────────────────────────────────────────────────────

-- Backup dos produtos aspirador (uma única vez).
CREATE TABLE IF NOT EXISTS `_BackupPrecoAspiradorBF2026` (
  `produtoId`      VARCHAR(191) NOT NULL,
  `precoOrig`      DECIMAL(10,2) NOT NULL,
  `precoPromoOrig` DECIMAL(10,2) NULL,
  `criadoEm`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`produtoId`)
);

INSERT IGNORE INTO `_BackupPrecoAspiradorBF2026` (`produtoId`, `precoOrig`, `precoPromoOrig`)
  SELECT `id`, `preco`, `precoPromocional` FROM `Produto` WHERE `categoria` = 'aspiradores';

UPDATE `Produto` p
  JOIN `_BackupPrecoAspiradorBF2026` b ON b.`produtoId` = p.`id`
  SET p.`preco` = ROUND(b.`precoOrig` * 0.85, 2),
      p.`precoPromocional` = IF(b.`precoPromoOrig` IS NULL, NULL, ROUND(b.`precoPromoOrig` * 0.85, 2))
  WHERE p.`categoria` = 'aspiradores';

-- Backup + ajuste das variações de aspirador (quando houver preço próprio).
CREATE TABLE IF NOT EXISTS `_BackupPrecoVarAspiradorBF2026` (
  `variacaoId` VARCHAR(191) NOT NULL,
  `precoOrig`  DECIMAL(10,2) NOT NULL,
  `criadoEm`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`variacaoId`)
);

INSERT IGNORE INTO `_BackupPrecoVarAspiradorBF2026` (`variacaoId`, `precoOrig`)
  SELECT v.`id`, v.`preco`
    FROM `VariacaoProduto` v
    JOIN `Produto` p ON p.`id` = v.`produtoId`
   WHERE p.`categoria` = 'aspiradores' AND v.`preco` IS NOT NULL;

UPDATE `VariacaoProduto` v
  JOIN `_BackupPrecoVarAspiradorBF2026` b ON b.`variacaoId` = v.`id`
  SET v.`preco` = ROUND(b.`precoOrig` * 0.85, 2);
