-- ROLLBACK do aumento de +20% da Black Friday 2026 (migration
-- 20261122213000_precos_bf2026_mais_20pct). Restaura os preços ORIGINAIS a
-- partir das tabelas de backup. Idempotente (restaura sempre ao mesmo original).
--
-- Rodar no ambiente do deploy (onde o banco é alcançável), ex.:
--   railway run mysql < scripts/rollback-precos-bf2026.sql
-- ou via um script tsx usando prisma.$executeRawUnsafe das instruções abaixo.
--
-- NÃO apaga as tabelas de backup (deixe-as para auditoria; remova manualmente
-- só depois de confirmar que o rollback fechou certo).

UPDATE `Produto` p
  JOIN `_BackupPrecoBF2026` b ON b.`produtoId` = p.`id`
  SET p.`preco` = b.`precoOrig`,
      p.`precoPromocional` = b.`precoPromoOrig`;

UPDATE `VariacaoProduto` v
  JOIN `_BackupPrecoVariacaoBF2026` b ON b.`variacaoId` = v.`id`
  SET v.`preco` = b.`precoOrig`;
