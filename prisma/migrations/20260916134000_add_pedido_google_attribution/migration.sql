-- Completa a atribuição Google no pedido. ADITIVO: duas colunas nullable,
-- ZERO DROP e zero alteração em pedidos existentes.
-- gaSessionId liga o Purchase server-side à sessão GA4; gclid preserva o click
-- id para futuro Offline Import no Google Ads.
ALTER TABLE `Pedido`
  ADD COLUMN `gaSessionId` VARCHAR(191) NULL,
  ADD COLUMN `gclid` VARCHAR(191) NULL;
