-- Tráfego Bruto (Fase 4C) — medição server-side, cookieless e sem PII.
-- ADITIVO — nenhuma tabela ou coluna existente é removida ou alterada.
CREATE TABLE `TrafegoBruto` (
    `id` VARCHAR(191) NOT NULL,
    `dia` CHAR(10) NOT NULL,
    `hora` INTEGER NOT NULL,
    `path` VARCHAR(512) NOT NULL,
    `dispositivo` VARCHAR(20) NULL,
    `browser` VARCHAR(40) NULL,
    `os` VARCHAR(40) NULL,
    `pais` VARCHAR(2) NULL,
    `referrer` VARCHAR(255) NULL,
    `visitorHash` CHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrafegoBruto_dia_idx`(`dia`),
    INDEX `TrafegoBruto_dia_hora_idx`(`dia`, `hora`),
    INDEX `TrafegoBruto_path_idx`(`path`),
    INDEX `TrafegoBruto_visitorHash_idx`(`visitorHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
