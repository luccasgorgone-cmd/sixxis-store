-- Ambiente em que CADA NF-e foi emitida. ADITIVO: um ADD COLUMN nullable, ZERO DROP.
--
-- Sem esta coluna, o banco não distingue uma nota de homologação (sem valor
-- fiscal) de uma de produção — só existia a env global FOCUS_NFE_AMBIENTE, que
-- descreve o AGORA, não o momento da emissão. Notas já emitidas ficam NULL
-- (sem backfill) e a UI as rotula "homologação (legado)".
--
-- Valores gravados pela rota de emissão: 'homologacao' | 'producao'.
ALTER TABLE `Pedido`
  ADD COLUMN `nfeAmbiente` VARCHAR(191) NULL;
