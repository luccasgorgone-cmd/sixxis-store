-- API de leitura: paginação keyset determinística e aditiva dos eventos por período.
-- Evita varredura/ordenação sem índice ao calcular sessões distintas por bucket.
CREATE INDEX `EventoTracking_createdAt_id_idx` ON `EventoTracking`(`createdAt`, `id`);
