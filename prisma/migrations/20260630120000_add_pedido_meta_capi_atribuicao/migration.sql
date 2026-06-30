-- Atribuição Meta (fbp/fbc) + dados do request original do cliente p/ o CAPI
-- Purchase server-side + guard de idempotência do envio. TUDO ADITIVO
-- (ADD COLUMN NULL), zero DROP, zero alteração de coluna existente.
ALTER TABLE `Pedido`
  ADD COLUMN `fbp` VARCHAR(191) NULL,
  ADD COLUMN `fbc` VARCHAR(191) NULL,
  ADD COLUMN `clientIp` VARCHAR(191) NULL,
  ADD COLUMN `clientUserAgent` TEXT NULL,
  ADD COLUMN `capiPurchaseEnviadoEm` DATETIME(3) NULL;
