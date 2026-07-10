-- Custo unitário de aquisição do produto (COGS do relatório de margem).
-- ADITIVO: só ADD COLUMN nullable, zero DROP.
--
-- NULL = custo não informado (≠ zero). O relatório trata pedido com qualquer
-- item sem custo como "custo pendente" e o exclui do cálculo de lucro.
ALTER TABLE `Produto`
  ADD COLUMN `custoProduto` DECIMAL(10, 2) NULL;
