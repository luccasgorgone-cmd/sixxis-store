CREATE TABLE IF NOT EXISTS `LunaConversa` (
  `id` VARCHAR(191) NOT NULL,
  `sessaoId` VARCHAR(191) NOT NULL,
  `paginaOrigem` TEXT NULL,
  `userAgent` TEXT NULL,
  `ip` VARCHAR(191) NULL,
  `clienteId` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ativa',
  `totalMensagens` INT NOT NULL DEFAULT 0,
  `primeiraMensagem` DATETIME(3) NULL,
  `ultimaMensagem` DATETIME(3) NULL,
  `duracaoSegundos` INT NULL,
  `leadGerado` BOOLEAN NOT NULL DEFAULT false,
  `produtoInteresse` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LunaConversa_sessaoId_key`(`sessaoId`),
  INDEX `LunaConversa_sessaoId_idx`(`sessaoId`),
  INDEX `LunaConversa_clienteId_idx`(`clienteId`),
  INDEX `LunaConversa_createdAt_idx`(`createdAt`),
  INDEX `LunaConversa_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `LunaMensagem` (
  `id` VARCHAR(191) NOT NULL,
  `conversaId` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `conteudo` LONGTEXT NOT NULL,
  `tokens` INT NULL,
  `latenciaMs` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `LunaMensagem_conversaId_idx`(`conversaId`),
  INDEX `LunaMensagem_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `LunaMensagem_conversaId_fkey` FOREIGN KEY (`conversaId`) REFERENCES `LunaConversa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
