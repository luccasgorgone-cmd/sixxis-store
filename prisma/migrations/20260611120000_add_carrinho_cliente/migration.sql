-- Carrinho persistido do cliente LOGADO (Fase 4A — recuperação de abandonados).
-- ADITIVO — nenhuma tabela ou coluna existente é removida ou alterada.
CREATE TABLE `CarrinhoCliente` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `itens` JSON NOT NULL,
    `valorTotal` DOUBLE NOT NULL DEFAULT 0,
    `etapaAtual` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ativo',
    `atualizadoEm` DATETIME(3) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CarrinhoCliente_clienteId_key`(`clienteId`),
    INDEX `CarrinhoCliente_status_atualizadoEm_idx`(`status`, `atualizadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CarrinhoCliente` ADD CONSTRAINT `CarrinhoCliente_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
