-- AlterTable
ALTER TABLE `Pedido` ADD COLUMN `custoFreteReal` DECIMAL(10, 2) NULL,
    ADD COLUMN `entregueEm` DATETIME(3) NULL,
    ADD COLUMN `enviadoEm` DATETIME(3) NULL,
    ADD COLUMN `linkRastreio` VARCHAR(191) NULL,
    ADD COLUMN `transportadora` VARCHAR(191) NULL;
