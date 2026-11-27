-- SX200 Trend: remove o desconto direto e exclui o modelo do cupom BF de 10%.
ALTER TABLE `Cupom`
  ADD COLUMN `produtoIdsExcluidos` TEXT NULL;

UPDATE `Produto`
   SET `precoPromocional` = NULL
 WHERE `slug` = 'sx200-trend';

UPDATE `Cupom` AS c
JOIN `Produto` AS p ON p.`slug` = 'sx200-trend'
   SET c.`produtoIdsExcluidos` = p.`id`,
       c.`descricao` = '10% OFF em 1 unidade elegível. Não acumula com a promoção da 2ª unidade.'
 WHERE c.`codigo` = 'BLACKFRIDAY10';

-- O cupom antigo específico continua desativado por segurança.
UPDATE `Cupom`
   SET `ativo` = FALSE
 WHERE `codigo` = '10OFFTREND';
