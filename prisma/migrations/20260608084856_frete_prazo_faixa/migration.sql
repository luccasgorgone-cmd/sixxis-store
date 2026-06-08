-- Frete: prazo único -> faixa (min/max). ADITIVO: não dropa prazoNormal/prazoExpresso.
ALTER TABLE `FreteRegra`
  ADD COLUMN `prazoNormalMin` INTEGER NULL,
  ADD COLUMN `prazoNormalMax` INTEGER NULL,
  ADD COLUMN `prazoExpressoMin` INTEGER NULL,
  ADD COLUMN `prazoExpressoMax` INTEGER NULL;
