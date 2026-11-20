-- Meta click id (fbclid) + cookie _fbc derivado na sessão. Aditivo e fail-safe:
-- colunas anuláveis, sem default, sem backfill. Destrava o corte Meta-puro
-- (hoje só havia gclid) e melhora o Event Match Quality da CAPI (fbc no payload).
ALTER TABLE `SessaoVisitante` ADD COLUMN `fbclid` VARCHAR(191) NULL;
ALTER TABLE `SessaoVisitante` ADD COLUMN `fbc` VARCHAR(191) NULL;
