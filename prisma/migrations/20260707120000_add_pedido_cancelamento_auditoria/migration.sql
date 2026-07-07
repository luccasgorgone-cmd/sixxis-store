-- Auditoria de cancelamento do pedido. ADITIVO (ADD COLUMN NULL), zero DROP,
-- zero alteração de coluna existente. Preenchidos quando o pedido é cancelado
-- (estorno MP, cancelamento admin ou pelo cliente).
ALTER TABLE `Pedido`
  ADD COLUMN `canceladoEm` DATETIME(3) NULL,
  ADD COLUMN `canceladoMotivo` TEXT NULL;
