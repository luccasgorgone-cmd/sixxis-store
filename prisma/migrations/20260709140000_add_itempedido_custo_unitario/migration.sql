-- Snapshot histórico do custo do produto no item do pedido (COGS congelado).
-- ADITIVO: só ADD COLUMN nullable, zero DROP.
--
-- NULL = custo não informado no momento da venda (≠ zero). Pedidos anteriores a
-- esta migração ficam null até rodar POST /api/admin/pedidos/snapshot-custos.
ALTER TABLE `ItemPedido`
  ADD COLUMN `custoUnitario` DECIMAL(10, 2) NULL;
