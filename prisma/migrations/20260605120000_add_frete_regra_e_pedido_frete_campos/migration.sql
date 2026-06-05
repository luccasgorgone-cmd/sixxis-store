-- AlterTable
ALTER TABLE `Pedido` ADD COLUMN `fretePrazo` INTEGER NULL,
    ADD COLUMN `freteTipo` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `FreteRegra` (
    `id` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `uf` CHAR(2) NOT NULL,
    `precoNormal` DECIMAL(10, 2) NULL,
    `prazoNormal` INTEGER NULL,
    `precoExpresso` DECIMAL(10, 2) NULL,
    `prazoExpresso` INTEGER NULL,
    `aCombinar` BOOLEAN NOT NULL DEFAULT false,
    `bloqueado` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `FreteRegra_uf_idx`(`uf`),
    INDEX `FreteRegra_produtoId_idx`(`produtoId`),
    UNIQUE INDEX `FreteRegra_produtoId_uf_key`(`produtoId`, `uf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FreteRegra` ADD CONSTRAINT `FreteRegra_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
