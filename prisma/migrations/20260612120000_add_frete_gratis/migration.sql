-- Frete Grátis por produto × UF. ADITIVO: só adiciona coluna, zero DROP.
ALTER TABLE `FreteRegra`
  ADD COLUMN `freteGratis` BOOLEAN NOT NULL DEFAULT false;
