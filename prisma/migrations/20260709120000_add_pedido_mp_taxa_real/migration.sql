-- Tarifa REAL do Mercado Pago por pedido (margem de contribuição).
-- ADITIVO: só ADD COLUMN nullable, zero DROP.
--
-- NULL = taxa ainda não sincronizada (≠ zero). O detalhamento cru dos fees NÃO
-- é duplicado nesta coluna: já existe em `Pagamento.rawResponse.fee_details`.
ALTER TABLE `Pedido`
  ADD COLUMN `mpTaxaReal` DECIMAL(10, 2) NULL;
