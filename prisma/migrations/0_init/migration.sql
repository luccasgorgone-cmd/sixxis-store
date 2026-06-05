-- CreateTable
CREATE TABLE `Cliente` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `erpClienteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bloqueado` BOOLEAN NOT NULL DEFAULT false,
    `motivoBloqueio` VARCHAR(191) NULL,
    `bloqueadoEm` DATETIME(3) NULL,
    `cashbackSaldo` DOUBLE NOT NULL DEFAULT 0,
    `totalGasto` DOUBLE NOT NULL DEFAULT 0,
    `totalPedidos` INTEGER NOT NULL DEFAULT 0,
    `ultimaCompra` DATETIME(3) NULL,
    `carrinhoAbandon` JSON NULL,
    `dataNascimento` DATETIME(3) NULL,
    `genero` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `avatarGradiente` VARCHAR(191) NULL DEFAULT 'tiffany',
    `notifEmail` BOOLEAN NOT NULL DEFAULT true,
    `notifWhatsapp` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Cliente_email_key`(`email`),
    UNIQUE INDEX `Cliente_cpf_key`(`cpf`),
    UNIQUE INDEX `Cliente_erpClienteId_key`(`erpClienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Endereco` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `cep` VARCHAR(191) NOT NULL,
    `logradouro` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `complemento` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `estado` CHAR(2) NOT NULL,
    `principal` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Endereco_clienteId_idx`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Produto` (
    `id` VARCHAR(191) NOT NULL,
    `erpProdutoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `precoPromocional` DECIMAL(10, 2) NULL,
    `imagens` JSON NOT NULL,
    `estoque` INTEGER NOT NULL DEFAULT 0,
    `categoria` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sku` VARCHAR(191) NULL,
    `temVariacoes` BOOLEAN NOT NULL DEFAULT false,
    `videoUrl` VARCHAR(191) NULL DEFAULT '',
    `especificacoes` JSON NULL,
    `faqs` JSON NULL,
    `imagensPorVariacao` JSON NULL,
    `vendidos` INTEGER NOT NULL DEFAULT 0,
    `mediaAvaliacoes` DOUBLE NOT NULL DEFAULT 0,
    `totalAvaliacoes` INTEGER NOT NULL DEFAULT 0,
    `garantiaFabricaMeses` INTEGER NOT NULL DEFAULT 12,
    `garantiaEstendida12Preco` DECIMAL(10, 2) NULL,
    `garantiaEstendida24Preco` DECIMAL(10, 2) NULL,

    UNIQUE INDEX `Produto_erpProdutoId_key`(`erpProdutoId`),
    UNIQUE INDEX `Produto_slug_key`(`slug`),
    UNIQUE INDEX `Produto_sku_key`(`sku`),
    INDEX `Produto_categoria_idx`(`categoria`),
    INDEX `Produto_slug_idx`(`slug`),
    INDEX `Produto_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pedido` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `total` DECIMAL(10, 2) NOT NULL,
    `frete` DECIMAL(10, 2) NOT NULL,
    `formaPagamento` VARCHAR(191) NOT NULL,
    `mpPaymentId` VARCHAR(191) NULL,
    `enderecoId` VARCHAR(191) NOT NULL,
    `erpPedidoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pagoEm` DATETIME(3) NULL,
    `codigoRastreio` VARCHAR(191) NULL,
    `cupomCodigo` VARCHAR(191) NULL,
    `desconto` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    UNIQUE INDEX `Pedido_erpPedidoId_key`(`erpPedidoId`),
    INDEX `Pedido_clienteId_idx`(`clienteId`),
    INDEX `Pedido_status_idx`(`status`),
    INDEX `Pedido_enderecoId_fkey`(`enderecoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GarantiaEstendida` (
    `id` VARCHAR(191) NOT NULL,
    `pedidoId` VARCHAR(191) NOT NULL,
    `pedidoItemId` VARCHAR(191) NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `mesesAdicionais` INTEGER NOT NULL,
    `valorPago` DECIMAL(10, 2) NOT NULL,
    `inicioVigencia` DATETIME(3) NOT NULL,
    `fimVigencia` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ativa',
    `acionamentos` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GarantiaEstendida_pedidoId_idx`(`pedidoId`),
    INDEX `GarantiaEstendida_produtoId_idx`(`produtoId`),
    INDEX `GarantiaEstendida_status_idx`(`status`),
    INDEX `GarantiaEstendida_fimVigencia_idx`(`fimVigencia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pagamento` (
    `id` VARCHAR(191) NOT NULL,
    `pedidoId` VARCHAR(191) NOT NULL,
    `mpPaymentId` VARCHAR(191) NULL,
    `mpPreferenceId` VARCHAR(191) NULL,
    `mpStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `mpStatusDetail` VARCHAR(191) NULL,
    `metodo` VARCHAR(191) NOT NULL,
    `valor` INTEGER NOT NULL,
    `qrCodeBase64` TEXT NULL,
    `qrCodeCopiaECola` TEXT NULL,
    `pixExpiraEm` DATETIME(3) NULL,
    `parcelas` INTEGER NULL,
    `bandeira` VARCHAR(191) NULL,
    `ultimosDigitos` VARCHAR(191) NULL,
    `payerEmail` VARCHAR(191) NULL,
    `payerCpf` VARCHAR(191) NULL,
    `payerNome` VARCHAR(191) NULL,
    `rawResponse` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `rejeitadoEm` DATETIME(3) NULL,

    UNIQUE INDEX `Pagamento_mpPaymentId_key`(`mpPaymentId`),
    INDEX `Pagamento_pedidoId_idx`(`pedidoId`),
    INDEX `Pagamento_mpPaymentId_idx`(`mpPaymentId`),
    INDEX `Pagamento_mpStatus_idx`(`mpStatus`),
    INDEX `Pagamento_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemPedido` (
    `id` VARCHAR(191) NOT NULL,
    `pedidoId` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `precoUnitario` DECIMAL(10, 2) NOT NULL,
    `variacaoId` VARCHAR(191) NULL,
    `variacaoNome` VARCHAR(191) NULL,

    INDEX `ItemPedido_pedidoId_idx`(`pedidoId`),
    INDEX `ItemPedido_produtoId_fkey`(`produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Carrinho` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Carrinho_clienteId_key`(`clienteId`),
    UNIQUE INDEX `Carrinho_sessionId_key`(`sessionId`),
    INDEX `Carrinho_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemCarrinho` (
    `id` VARCHAR(191) NOT NULL,
    `carrinhoId` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `quantidade` INTEGER NOT NULL,

    INDEX `ItemCarrinho_produtoId_fkey`(`produtoId`),
    UNIQUE INDEX `ItemCarrinho_carrinhoId_produtoId_key`(`carrinhoId`, `produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Avaliacao` (
    `id` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NULL,
    `nomeAutor` VARCHAR(191) NOT NULL DEFAULT '',
    `emailAutor` VARCHAR(191) NULL,
    `nota` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NULL,
    `comentario` TEXT NULL,
    `aprovada` BOOLEAN NOT NULL DEFAULT false,
    `destaque` BOOLEAN NOT NULL DEFAULT false,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `resposta` TEXT NULL,
    `respostaEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Avaliacao_clienteId_fkey`(`clienteId`),
    INDEX `Avaliacao_produtoId_aprovada_idx`(`produtoId`, `aprovada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvaliacaoFoto` (
    `id` VARCHAR(191) NOT NULL,
    `avaliacaoId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AvaliacaoFoto_avaliacaoId_idx`(`avaliacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `imagem` VARCHAR(191) NOT NULL,
    `imagemTablet` VARCHAR(191) NULL,
    `imagemMobile` VARCHAR(191) NULL,
    `titulo` VARCHAR(191) NULL,
    `subtitulo` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `tempoCads` INTEGER NOT NULL DEFAULT 5,
    `aspectMobile` VARCHAR(191) NULL,
    `aspectTablet` VARCHAR(191) NULL,
    `aspectDesktop` VARCHAR(191) NULL,
    `maxHeightDesktop` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Configuracao` (
    `id` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `valor` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Configuracao_chave_key`(`chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormaPagamento` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `iconeUrl` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FormaPagamento_ativo_ordem_idx`(`ativo`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cupom` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `valor` DOUBLE NOT NULL,
    `usoMaximo` INTEGER NULL,
    `totalUsos` INTEGER NOT NULL DEFAULT 0,
    `pedidoMinimo` DOUBLE NOT NULL DEFAULT 0,
    `validade` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `descricao` VARCHAR(191) NULL,
    `primeiraCompra` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cupom_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CupomUso` (
    `id` VARCHAR(191) NOT NULL,
    `cupomId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NULL,
    `pedidoId` VARCHAR(191) NULL,
    `emailCliente` VARCHAR(191) NULL,
    `nomeCliente` VARCHAR(191) NULL,
    `valorDesconto` DOUBLE NOT NULL DEFAULT 0,
    `valorPedido` DOUBLE NOT NULL DEFAULT 0,
    `usadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CupomUso_cupomId_idx`(`cupomId`),
    INDEX `CupomUso_clienteId_idx`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoricoPontos` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `pontos` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `pedidoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HistoricoPontos_clienteId_idx`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListaEspera` (
    `id` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `notificado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ListaEspera_produtoId_notificado_idx`(`produtoId`, `notificado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PontosCliente` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `pontos` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PontosCliente_clienteId_key`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProdutoDestaque` (
    `id` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `secao` VARCHAR(191) NOT NULL DEFAULT 'mais-vendidos',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProdutoDestaque_produtoId_fkey`(`produtoId`),
    INDEX `ProdutoDestaque_secao_idx`(`secao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VariacaoProduto` (
    `id` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `preco` DECIMAL(10, 2) NULL,
    `estoque` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VariacaoProduto_sku_key`(`sku`),
    INDEX `VariacaoProduto_produtoId_idx`(`produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `assunto` VARCHAR(191) NOT NULL,
    `corpo` LONGTEXT NOT NULL,
    `prazo` INTEGER NOT NULL DEFAULT 0,
    `unidadePrazo` VARCHAR(191) NOT NULL DEFAULT 'horas',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailTemplate_tipo_key`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CookieConsent` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `aceitou` BOOLEAN NOT NULL DEFAULT false,
    `categorias` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CookieConsent_sessionId_idx`(`sessionId`),
    INDEX `CookieConsent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventoAnalitico` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `dados` VARCHAR(191) NOT NULL DEFAULT '{}',
    `pagina` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventoAnalitico_sessionId_idx`(`sessionId`),
    INDEX `EventoAnalitico_tipo_idx`(`tipo`),
    INDEX `EventoAnalitico_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClienteInsight` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `primeiraVisita` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultimaVisita` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalVisitas` INTEGER NOT NULL DEFAULT 1,
    `totalPaginas` INTEGER NOT NULL DEFAULT 1,
    `carrinhosAbertos` INTEGER NOT NULL DEFAULT 0,
    `comprasFeitas` INTEGER NOT NULL DEFAULT 0,
    `totalGasto` DOUBLE NOT NULL DEFAULT 0,
    `produtosVistos` VARCHAR(191) NOT NULL DEFAULT '[]',
    `buscas` VARCHAR(191) NOT NULL DEFAULT '[]',
    `dispositivo` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `fonte` VARCHAR(191) NULL,
    `cookieCategs` VARCHAR(191) NOT NULL DEFAULT '{}',

    UNIQUE INDEX `ClienteInsight_sessionId_key`(`sessionId`),
    INDEX `ClienteInsight_ultimaVisita_idx`(`ultimaVisita`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacao_parceiro` (
    `id` VARCHAR(191) NOT NULL,
    `nomeCompleto` VARCHAR(191) NOT NULL,
    `empresa` VARCHAR(191) NULL,
    `cargo` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `nota` INTEGER NOT NULL DEFAULT 5,
    `titulo` VARCHAR(191) NOT NULL,
    `comentario` TEXT NOT NULL,
    `avatarInicial` VARCHAR(191) NULL,
    `corAvatar` VARCHAR(191) NOT NULL DEFAULT '#3cbfb3',
    `aprovada` BOOLEAN NOT NULL DEFAULT true,
    `destaque` BOOLEAN NOT NULL DEFAULT false,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashbackTransacao` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `valor` DOUBLE NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `pedidoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CashbackTransacao_clienteId_idx`(`clienteId`),
    INDEX `CashbackTransacao_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BloqueioFraude` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `criadoPor` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BloqueioFraude_clienteId_idx`(`clienteId`),
    INDEX `BloqueioFraude_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campanha` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `assunto` VARCHAR(191) NULL,
    `mensagem` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'rascunho',
    `agendadoPara` DATETIME(3) NULL,
    `enviadaEm` DATETIME(3) NULL,
    `totalDestinatarios` INTEGER NOT NULL DEFAULT 0,
    `totalEnviados` INTEGER NOT NULL DEFAULT 0,
    `totalErros` INTEGER NOT NULL DEFAULT 0,
    `taxaAbertura` DOUBLE NOT NULL DEFAULT 0,
    `filtroSegmento` JSON NULL,
    `whatsappNumeroId` VARCHAR(191) NULL,
    `publicoAlvo` JSON NULL,
    `tituloCopy` VARCHAR(191) NULL,
    `corpoCopy` TEXT NULL,
    `ctaTexto` VARCHAR(191) NULL,
    `ctaUrl` VARCHAR(191) NULL,
    `produtoDestaqueId` VARCHAR(191) NULL,
    `cupomId` VARCHAR(191) NULL,
    `canais` JSON NULL,
    `emailAssunto` VARCHAR(191) NULL,
    `whatsappTexto` TEXT NULL,
    `dataAgendamento` DATETIME(3) NULL,
    `totalAlvo` INTEGER NOT NULL DEFAULT 0,
    `totalAbertos` INTEGER NOT NULL DEFAULT 0,
    `totalCliques` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NivelFidelidade` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `iconeUrl` VARCHAR(191) NULL,
    `iconeLucide` VARCHAR(191) NULL,
    `cor` VARCHAR(191) NOT NULL,
    `gastoMin` DOUBLE NOT NULL,
    `gastoMax` DOUBLE NULL,
    `cashbackPc` DOUBLE NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `NivelFidelidade_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampanhaDestinatario` (
    `id` VARCHAR(191) NOT NULL,
    `campanhaId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `enviadoEm` DATETIME(3) NULL,
    `erroMsg` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CampanhaDestinatario_campanhaId_idx`(`campanhaId`),
    INDEX `CampanhaDestinatario_clienteId_idx`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappNumero` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `instanceId` VARCHAR(191) NULL,
    `apiUrl` VARCHAR(191) NULL,
    `apiKey` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DESCONECTADO',
    `qrCode` TEXT NULL,
    `ehPadrao` BOOLEAN NOT NULL DEFAULT false,
    `totalEnviados` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnvioLog` (
    `id` VARCHAR(191) NOT NULL,
    `campanhaId` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `destinatario` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `erroMsg` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EnvioLog_campanhaId_idx`(`campanhaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LunaConversa` (
    `id` VARCHAR(191) NOT NULL,
    `sessaoId` VARCHAR(191) NOT NULL,
    `paginaOrigem` TEXT NULL,
    `userAgent` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ativa',
    `totalMensagens` INTEGER NOT NULL DEFAULT 0,
    `primeiraMensagem` DATETIME(3) NULL,
    `ultimaMensagem` DATETIME(3) NULL,
    `duracaoSegundos` INTEGER NULL,
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

-- CreateTable
CREATE TABLE `LunaMensagem` (
    `id` VARCHAR(191) NOT NULL,
    `conversaId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `conteudo` LONGTEXT NOT NULL,
    `tokens` INTEGER NULL,
    `latenciaMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LunaMensagem_conversaId_idx`(`conversaId`),
    INDEX `LunaMensagem_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessaoVisitante` (
    `id` VARCHAR(191) NOT NULL,
    `sessaoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `pais` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `dispositivo` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `utmContent` VARCHAR(191) NULL,
    `utmTerm` VARCHAR(191) NULL,
    `referer` TEXT NULL,
    `landingPage` TEXT NULL,
    `totalPaginas` INTEGER NOT NULL DEFAULT 0,
    `duracaoSegundos` INTEGER NOT NULL DEFAULT 0,
    `converteu` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SessaoVisitante_sessaoId_key`(`sessaoId`),
    INDEX `SessaoVisitante_sessaoId_idx`(`sessaoId`),
    INDEX `SessaoVisitante_userId_idx`(`userId`),
    INDEX `SessaoVisitante_createdAt_idx`(`createdAt`),
    INDEX `SessaoVisitante_utmSource_idx`(`utmSource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventoTracking` (
    `id` VARCHAR(191) NOT NULL,
    `sessaoId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `pagina` TEXT NULL,
    `produtoId` VARCHAR(191) NULL,
    `produtoSlug` VARCHAR(191) NULL,
    `valor` DOUBLE NULL,
    `dados` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventoTracking_sessaoId_idx`(`sessaoId`),
    INDEX `EventoTracking_tipo_idx`(`tipo`),
    INDEX `EventoTracking_produtoSlug_idx`(`produtoSlug`),
    INDEX `EventoTracking_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RelatorioVendaHora` (
    `id` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `hora` INTEGER NOT NULL,
    `diaSemana` INTEGER NOT NULL,
    `totalPedidos` INTEGER NOT NULL DEFAULT 0,
    `totalReceita` DOUBLE NOT NULL DEFAULT 0,
    `totalItens` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RelatorioVendaHora_data_idx`(`data`),
    UNIQUE INDEX `RelatorioVendaHora_data_hora_key`(`data`, `hora`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TentativaLogin` (
    `id` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,
    `sucesso` BOOLEAN NOT NULL,
    `rota` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TentativaLogin_ip_createdAt_idx`(`ip`, `createdAt`),
    INDEX `TentativaLogin_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BloqueioIp` (
    `id` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `bloqueadoAte` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BloqueioIp_ip_key`(`ip`),
    INDEX `BloqueioIp_bloqueadoAte_idx`(`bloqueadoAte`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PopupInicial` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `ativado` BOOLEAN NOT NULL DEFAULT false,
    `bannerDesktop` VARCHAR(191) NULL,
    `bannerTablet` VARCHAR(191) NULL,
    `bannerMobile` VARCHAR(191) NULL,
    `altText` VARCHAR(191) NULL,
    `linkDestino` VARCHAR(191) NULL,
    `abrirNovaAba` BOOLEAN NOT NULL DEFAULT false,
    `titulo` VARCHAR(191) NULL,
    `texto` TEXT NULL,
    `corBotao` VARCHAR(191) NULL DEFAULT '#3cbfb3',
    `textoBotao` VARCHAR(191) NULL,
    `delaySegundos` INTEGER NOT NULL DEFAULT 3,
    `frequencia` VARCHAR(191) NOT NULL DEFAULT 'sessao',
    `paginas` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actor` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `target` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_actor_createdAt_idx`(`actor`, `createdAt`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Endereco` ADD CONSTRAINT `Endereco_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_enderecoId_fkey` FOREIGN KEY (`enderecoId`) REFERENCES `Endereco`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GarantiaEstendida` ADD CONSTRAINT `GarantiaEstendida_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `Pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GarantiaEstendida` ADD CONSTRAINT `GarantiaEstendida_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pagamento` ADD CONSTRAINT `Pagamento_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `Pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemPedido` ADD CONSTRAINT `ItemPedido_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `Pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemPedido` ADD CONSTRAINT `ItemPedido_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Carrinho` ADD CONSTRAINT `Carrinho_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCarrinho` ADD CONSTRAINT `ItemCarrinho_carrinhoId_fkey` FOREIGN KEY (`carrinhoId`) REFERENCES `Carrinho`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCarrinho` ADD CONSTRAINT `ItemCarrinho_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvaliacaoFoto` ADD CONSTRAINT `AvaliacaoFoto_avaliacaoId_fkey` FOREIGN KEY (`avaliacaoId`) REFERENCES `Avaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CupomUso` ADD CONSTRAINT `CupomUso_cupomId_fkey` FOREIGN KEY (`cupomId`) REFERENCES `Cupom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CupomUso` ADD CONSTRAINT `CupomUso_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistoricoPontos` ADD CONSTRAINT `HistoricoPontos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListaEspera` ADD CONSTRAINT `ListaEspera_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PontosCliente` ADD CONSTRAINT `PontosCliente_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProdutoDestaque` ADD CONSTRAINT `ProdutoDestaque_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariacaoProduto` ADD CONSTRAINT `VariacaoProduto_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashbackTransacao` ADD CONSTRAINT `CashbackTransacao_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BloqueioFraude` ADD CONSTRAINT `BloqueioFraude_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campanha` ADD CONSTRAINT `Campanha_whatsappNumeroId_fkey` FOREIGN KEY (`whatsappNumeroId`) REFERENCES `WhatsappNumero`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampanhaDestinatario` ADD CONSTRAINT `CampanhaDestinatario_campanhaId_fkey` FOREIGN KEY (`campanhaId`) REFERENCES `Campanha`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampanhaDestinatario` ADD CONSTRAINT `CampanhaDestinatario_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LunaMensagem` ADD CONSTRAINT `LunaMensagem_conversaId_fkey` FOREIGN KEY (`conversaId`) REFERENCES `LunaConversa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoTracking` ADD CONSTRAINT `EventoTracking_sessaoId_fkey` FOREIGN KEY (`sessaoId`) REFERENCES `SessaoVisitante`(`sessaoId`) ON DELETE CASCADE ON UPDATE CASCADE;
