-- Idempotência da criação de pedido: mesma key => mesmo pedido (sem duplicar). ADITIVO.
ALTER TABLE `Pedido`
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Pedido_idempotencyKey_key` ON `Pedido`(`idempotencyKey`);
