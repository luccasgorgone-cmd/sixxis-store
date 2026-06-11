-- Histórico de bloqueios: distingue bloqueio de desbloqueio (auditoria).
-- ADITIVO — nova coluna NOT NULL com DEFAULT (linhas existentes = 'bloqueio',
-- pois até aqui só havia registros de bloqueio). Nada é removido ou alterado.
ALTER TABLE `BloqueioFraude` ADD COLUMN `acao` VARCHAR(191) NOT NULL DEFAULT 'bloqueio';
