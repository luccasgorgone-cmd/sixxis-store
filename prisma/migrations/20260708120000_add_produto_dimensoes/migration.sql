-- Dimensões e peso do Produto (para cotação de frete). ADITIVO: só ADD COLUMN
-- nullable, zero DROP. Peso/dimensão são POR PRODUTO — variações herdam.
ALTER TABLE `Produto`
  ADD COLUMN `pesoKg` DECIMAL(10, 3) NULL,
  ADD COLUMN `alturaCm` DECIMAL(10, 2) NULL,
  ADD COLUMN `larguraCm` DECIMAL(10, 2) NULL,
  ADD COLUMN `comprimentoCm` DECIMAL(10, 2) NULL,
  ADD COLUMN `volumes` INTEGER NULL DEFAULT 1;
