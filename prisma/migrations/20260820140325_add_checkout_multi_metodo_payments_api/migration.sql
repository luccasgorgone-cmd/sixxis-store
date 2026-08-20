-- Checkout multi-método reconstruído sobre a Payments API (a Orders API está
-- bloqueada pra conta da Sixxis — 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES,
-- confirmado em teste real em 2026-08-20; sem previsão de desbloqueio).
-- ADITIVO: 1 tabela nova + colunas nullable em Pagamento. ZERO DROP.

-- CreateTable
CREATE TABLE `TentativaMultiMetodo` (
    `id` VARCHAR(191) NOT NULL,
    `pedidoId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'em_andamento',
    `totalCentavos` INTEGER NOT NULL,
    `prazoExpiracao` DATETIME(3) NULL,
    `proximaAcao` JSON NULL,
    `erro` VARCHAR(191) NULL,
    `detalhe` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TentativaMultiMetodo_pedidoId_idx`(`pedidoId`),
    INDEX `TentativaMultiMetodo_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Pagamento`
  ADD COLUMN `tentativaMultiMetodoId` VARCHAR(191) NULL,
  ADD COLUMN `perna` VARCHAR(191) NULL,
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
  ADD COLUMN `estornoStatus` VARCHAR(191) NULL,
  ADD COLUMN `estornoTentativas` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `estornoErro` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Pagamento_idempotencyKey_key` ON `Pagamento`(`idempotencyKey`);

-- CreateIndex
CREATE INDEX `Pagamento_tentativaMultiMetodoId_idx` ON `Pagamento`(`tentativaMultiMetodoId`);

-- CreateIndex
CREATE INDEX `Pagamento_estornoStatus_idx` ON `Pagamento`(`estornoStatus`);

-- AddForeignKey
ALTER TABLE `TentativaMultiMetodo` ADD CONSTRAINT `TentativaMultiMetodo_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `Pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pagamento` ADD CONSTRAINT `Pagamento_tentativaMultiMetodoId_fkey` FOREIGN KEY (`tentativaMultiMetodoId`) REFERENCES `TentativaMultiMetodo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
