-- Atribuição/GA4 Measurement Protocol — espelha o padrão já usado pro CAPI
-- Meta (fbp/fbc/capiPurchaseEnviadoEm). ADITIVO: dois ADD COLUMN nullable,
-- ZERO DROP, ZERO mudança em colunas existentes.
--
-- `gaClientId` = client_id do GA4 (cookie _ga, sem o prefixo GA1.N.),
-- capturado no checkout (browser) e persistido pra o webhook do Mercado Pago
-- mandar o evento `purchase` via Measurement Protocol atribuído à sessão de
-- origem. Best-effort: com Consent Mode v2, só existe se o cliente já
-- aceitou cookies analíticos — NULL é esperado, não erro.
--
-- `ga4PurchaseEnviadoEm` = guard de idempotência (claim atômico) do envio ao
-- Measurement Protocol, mesmo padrão do `capiPurchaseEnviadoEm` — evita
-- reenvio duplicado se o Mercado Pago reenviar o mesmo webhook.
ALTER TABLE `Pedido`
  ADD COLUMN `gaClientId` VARCHAR(191) NULL,
  ADD COLUMN `ga4PurchaseEnviadoEm` DATETIME(3) NULL;
