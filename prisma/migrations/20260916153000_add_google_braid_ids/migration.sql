-- Preserva os identificadores de clique alternativos do Google Ads em sessões
-- e pedidos. Nullable e sem backfill: não existe evidência para atribuir
-- retroativamente pedidos anteriores.
ALTER TABLE `SessaoVisitante`
  ADD COLUMN `gbraid` VARCHAR(191) NULL,
  ADD COLUMN `wbraid` VARCHAR(191) NULL;

ALTER TABLE `Pedido`
  ADD COLUMN `gbraid` VARCHAR(191) NULL,
  ADD COLUMN `wbraid` VARCHAR(191) NULL;
