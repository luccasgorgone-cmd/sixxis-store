-- Google Ads usa auto-tagging (gclid na URL) em vez de UTM manual — sem um
-- fallback, todo tráfego google/cpc chegava com utm_source nulo em
-- SessaoVisitante (extrairUTMs só lia utm_*), deixando o Google inteiro
-- invisível pra atribuição enquanto o Meta (que usa utm_* de verdade)
-- capturava normal. ADITIVO: um ADD COLUMN nullable, ZERO DROP, ZERO mudança
-- em colunas existentes.
ALTER TABLE `SessaoVisitante`
  ADD COLUMN `gclid` VARCHAR(191) NULL;
