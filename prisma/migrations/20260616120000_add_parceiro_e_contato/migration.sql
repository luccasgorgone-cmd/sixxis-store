-- Persistência dos leads/mensagens dos formulários do site (Seja um Parceiro e
-- Contato). ADITIVO — só cria tabelas novas, nenhum DROP/ALTER em tabela
-- existente. Os e-mails de notificação seguem intactos nas respectivas APIs.

CREATE TABLE `SolicitacaoParceiro` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'pj',
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NULL,
    `cnpj` VARCHAR(191) NULL,
    `razaoSocial` VARCHAR(191) NULL,
    `nomeFantasia` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `estado` CHAR(2) NULL,
    `cep` VARCHAR(191) NULL,
    `endereco` TEXT NULL,
    `segmento` VARCHAR(191) NULL,
    `mensagem` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'novo',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SolicitacaoParceiro_status_idx`(`status`),
    INDEX `SolicitacaoParceiro_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MensagemContato` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `assunto` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'novo',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MensagemContato_status_idx`(`status`),
    INDEX `MensagemContato_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
