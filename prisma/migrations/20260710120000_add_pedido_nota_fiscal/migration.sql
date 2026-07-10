-- Número da nota fiscal emitida para o pedido. Aditivo e nullable: pedidos
-- antigos ficam com NULL e nada no fluxo existente depende do campo.
ALTER TABLE `Pedido` ADD COLUMN `notaFiscal` VARCHAR(191) NULL;

-- Busca por NF na lista de pedidos do admin.
CREATE INDEX `Pedido_notaFiscal_idx` ON `Pedido`(`notaFiscal`);
