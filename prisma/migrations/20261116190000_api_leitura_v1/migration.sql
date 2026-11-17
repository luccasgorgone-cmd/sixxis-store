-- API de leitura v1: somente novas tabelas, colunas e índices.
-- Os novos relógios recebem o instante da migração em registros legados.
-- Não representam a data histórica anterior à implantação: a primeira sync é completa.
-- ON UPDATE cobre também escritas SQL que não passam pelo Prisma (@updatedAt).
CREATE TABLE `ApiChaveLeitura` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `prefixo` VARCHAR(20) NOT NULL,
    `hash` CHAR(64) NOT NULL,
    `escopos` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiraEm` DATETIME(3) NULL,
    `revogadoEm` DATETIME(3) NULL,
    `ultimoUsoEm` DATETIME(3) NULL,
    `ultimoIp` VARCHAR(45) NULL,
    UNIQUE INDEX `ApiChaveLeitura_hash_key`(`hash`),
    INDEX `ApiChaveLeitura_prefixo_idx`(`prefixo`),
    INDEX `ApiChaveLeitura_expiraEm_idx`(`expiraEm`),
    INDEX `ApiChaveLeitura_revogadoEm_idx`(`revogadoEm`),
    INDEX `ApiChaveLeitura_criadoEm_idx`(`criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApiAuditoriaLeitura` (
    `id` VARCHAR(191) NOT NULL,
    `chaveId` VARCHAR(191) NULL,
    `prefixo` VARCHAR(20) NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `rota` VARCHAR(191) NOT NULL,
    `queryKeys` JSON NULL,
    `status` INTEGER NOT NULL,
    `duracaoMs` INTEGER NOT NULL,
    `ip` VARCHAR(45) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ApiAuditoriaLeitura_chaveId_idx`(`chaveId`),
    INDEX `ApiAuditoriaLeitura_prefixo_idx`(`prefixo`),
    INDEX `ApiAuditoriaLeitura_requestId_idx`(`requestId`),
    INDEX `ApiAuditoriaLeitura_criadoEm_idx`(`criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sem cláusula de remoção: a ação padrão RESTRICT preserva a auditoria.
ALTER TABLE `ApiAuditoriaLeitura` ADD CONSTRAINT `ApiAuditoriaLeitura_chaveId_fkey` FOREIGN KEY (`chaveId`) REFERENCES `ApiChaveLeitura`(`id`) ON UPDATE CASCADE;

ALTER TABLE `Cliente` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `Endereco` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Endereco` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `Produto` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `Pedido` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `ItemPedido` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `ItemPedido` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `ItemCarrinho` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `ItemCarrinho` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `Banner` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `ListaEspera` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `VariacaoProduto` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `CashbackTransacao` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `NivelFidelidade` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `NivelFidelidade` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `CampanhaDestinatario` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `BloqueioIp` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `SolicitacaoParceiro` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `MensagemContato` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Índices existentes com o relógio na primeira posição são reutilizados.
CREATE INDEX `Cliente_updatedAt_idx` ON `Cliente`(`updatedAt`);
CREATE INDEX `Endereco_updatedAt_idx` ON `Endereco`(`updatedAt`);
CREATE INDEX `Endereco_createdAt_idx` ON `Endereco`(`createdAt`);
CREATE INDEX `Produto_updatedAt_idx` ON `Produto`(`updatedAt`);
CREATE INDEX `Pedido_updatedAt_idx` ON `Pedido`(`updatedAt`);
CREATE INDEX `GarantiaEstendida_updatedAt_idx` ON `GarantiaEstendida`(`updatedAt`);
CREATE INDEX `Pagamento_updatedAt_idx` ON `Pagamento`(`updatedAt`);
CREATE INDEX `TentativaMultiMetodo_updatedAt_idx` ON `TentativaMultiMetodo`(`updatedAt`);
CREATE INDEX `ItemPedido_updatedAt_idx` ON `ItemPedido`(`updatedAt`);
CREATE INDEX `ItemPedido_createdAt_idx` ON `ItemPedido`(`createdAt`);
CREATE INDEX `Carrinho_createdAt_idx` ON `Carrinho`(`createdAt`);
CREATE INDEX `ItemCarrinho_updatedAt_idx` ON `ItemCarrinho`(`updatedAt`);
CREATE INDEX `ItemCarrinho_createdAt_idx` ON `ItemCarrinho`(`createdAt`);
CREATE INDEX `Avaliacao_updatedAt_idx` ON `Avaliacao`(`updatedAt`);
CREATE INDEX `AvaliacaoFoto_createdAt_idx` ON `AvaliacaoFoto`(`createdAt`);
CREATE INDEX `Banner_updatedAt_idx` ON `Banner`(`updatedAt`);
CREATE INDEX `Configuracao_updatedAt_idx` ON `Configuracao`(`updatedAt`);
CREATE INDEX `FormaPagamento_updatedAt_idx` ON `FormaPagamento`(`updatedAt`);
CREATE INDEX `Cupom_updatedAt_idx` ON `Cupom`(`updatedAt`);
CREATE INDEX `CupomUso_usadoEm_idx` ON `CupomUso`(`usadoEm`);
CREATE INDEX `HistoricoPontos_createdAt_idx` ON `HistoricoPontos`(`createdAt`);
CREATE INDEX `ListaEspera_updatedAt_idx` ON `ListaEspera`(`updatedAt`);
CREATE INDEX `PontosCliente_updatedAt_idx` ON `PontosCliente`(`updatedAt`);
CREATE INDEX `ProdutoDestaque_createdAt_idx` ON `ProdutoDestaque`(`createdAt`);
CREATE INDEX `VariacaoProduto_updatedAt_idx` ON `VariacaoProduto`(`updatedAt`);
CREATE INDEX `FreteRegra_atualizadoEm_idx` ON `FreteRegra`(`atualizadoEm`);
CREATE INDEX `EmailTemplate_updatedAt_idx` ON `EmailTemplate`(`updatedAt`);
CREATE INDEX `avaliacao_parceiro_updatedAt_idx` ON `avaliacao_parceiro`(`updatedAt`);
CREATE INDEX `CashbackTransacao_updatedAt_idx` ON `CashbackTransacao`(`updatedAt`);
CREATE INDEX `Campanha_updatedAt_idx` ON `Campanha`(`updatedAt`);
CREATE INDEX `NivelFidelidade_updatedAt_idx` ON `NivelFidelidade`(`updatedAt`);
CREATE INDEX `NivelFidelidade_createdAt_idx` ON `NivelFidelidade`(`createdAt`);
CREATE INDEX `CampanhaDestinatario_updatedAt_idx` ON `CampanhaDestinatario`(`updatedAt`);
CREATE INDEX `WhatsappNumero_updatedAt_idx` ON `WhatsappNumero`(`updatedAt`);
CREATE INDEX `EnvioLog_createdAt_idx` ON `EnvioLog`(`createdAt`);
CREATE INDEX `LunaConversa_updatedAt_idx` ON `LunaConversa`(`updatedAt`);
CREATE INDEX `SessaoVisitante_updatedAt_idx` ON `SessaoVisitante`(`updatedAt`);
CREATE INDEX `RelatorioVendaHora_updatedAt_idx` ON `RelatorioVendaHora`(`updatedAt`);
CREATE INDEX `BloqueioIp_updatedAt_idx` ON `BloqueioIp`(`updatedAt`);
CREATE INDEX `PopupInicial_updatedAt_idx` ON `PopupInicial`(`updatedAt`);
CREATE INDEX `CarrinhoCliente_atualizadoEm_idx` ON `CarrinhoCliente`(`atualizadoEm`);
CREATE INDEX `SolicitacaoParceiro_updatedAt_idx` ON `SolicitacaoParceiro`(`updatedAt`);
CREATE INDEX `MensagemContato_updatedAt_idx` ON `MensagemContato`(`updatedAt`);
