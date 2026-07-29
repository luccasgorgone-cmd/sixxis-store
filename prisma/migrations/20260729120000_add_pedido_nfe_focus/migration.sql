-- NF-e emitida pela Focus NFe. ADITIVO: só ADD COLUMN nullable, ZERO DROP.
-- Pedidos antigos ficam com tudo NULL (sem backfill) e continuam usando o campo
-- `notaFiscal` (número digitado à mão), que NÃO é tocado — os dois coexistem.
--
-- nfeRef      = referência enviada à Focus (= Pedido.id), o que torna a emissão
--               idempotente do lado deles.
-- nfeStatus   = autorizado | erro | processando | cancelado.
-- nfeMensagemErro é TEXT porque rejeição de SEFAZ vem longa e não cabe em 191.
ALTER TABLE `Pedido`
  ADD COLUMN `nfeRef` VARCHAR(191) NULL,
  ADD COLUMN `nfeChave` VARCHAR(191) NULL,
  ADD COLUMN `nfeStatus` VARCHAR(191) NULL,
  ADD COLUMN `nfeNumero` INTEGER NULL,
  ADD COLUMN `nfeSerie` INTEGER NULL,
  ADD COLUMN `nfeDanfeUrl` VARCHAR(191) NULL,
  ADD COLUMN `nfeXmlUrl` VARCHAR(191) NULL,
  ADD COLUMN `nfeMensagemErro` TEXT NULL;
