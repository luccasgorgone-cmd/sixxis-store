-- Data da NF + marca de sincronização com o CRM. ADITIVO: só ADD COLUMN
-- nullable, zero DROP. Pedidos antigos ficam com os campos NULL (sem backfill).
--
-- dataNotaFiscal: data pura ancorada ao meio-dia UTC (ver src/lib/data-nf.ts) —
-- é ela que faz a garantia contar no CRM.
-- crmSincronizadoEm / crmLeadId: marca informativa de "já enviei ao CRM" e para
-- qual contato (leadId). Nunca bloqueiam; reaplicar é permitido (CRM idempotente).
ALTER TABLE `Pedido`
  ADD COLUMN `dataNotaFiscal` DATETIME(3) NULL,
  ADD COLUMN `crmSincronizadoEm` DATETIME(3) NULL,
  ADD COLUMN `crmLeadId` VARCHAR(191) NULL;
