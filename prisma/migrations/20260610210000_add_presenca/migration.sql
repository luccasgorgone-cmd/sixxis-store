-- Presença em tempo real (heartbeat / Fase 2 analytics). ADITIVO — nenhuma
-- tabela ou coluna existente é removida ou alterada.
CREATE TABLE `Presenca` (
    `id` VARCHAR(191) NOT NULL,
    `sessaoId` VARCHAR(191) NOT NULL,
    `path` TEXT NULL,
    `dispositivo` VARCHAR(191) NULL,
    `ultimoPing` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Presenca_sessaoId_key`(`sessaoId`),
    INDEX `Presenca_ultimoPing_idx`(`ultimoPing`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
