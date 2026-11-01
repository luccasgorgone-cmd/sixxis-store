-- Imagem LIMPA (packshot fundo branco, sem overlay) servida APENAS no feed do
-- Google Merchant (g:image_link do merchant-feed.xml). ADITIVO: 1 coluna
-- nullable, ZERO drop e zero alteração em produtos existentes. null = o feed
-- cai na hero do PDP (imagens[0]), comportamento atual. O valor (URL R2 pública
-- do packshot por produto) é preenchido como DADO depois, sem nova migration.
ALTER TABLE `Produto`
  ADD COLUMN `imagemFeedGoogle` VARCHAR(191) NULL;
