-- SX200 Trend: o cupom 10OFFTREND (10% OFF escopado) vira DESCONTO DIRETO no
-- preço, e o cupom é DESATIVADO para não empilhar outro 10% sobre o preço já
-- descontado (evita preço duplo-descontado). Banco só é alcançável no ambiente
-- do deploy — por isso a mudança vive numa migration, resolvida por slug/código
-- no próprio servidor. Idempotente: UPDATEs por slug/código, seguros p/ reaplicar.

-- 1) Desconto direto: precoPromocional = 90% do preço (mesmos 10% que o cupom dava).
--    preco permanece como valor "de" (riscado); precoPromocional é o "por".
--    ROUND(...,2) para fechar em centavos. Se o produto não existir, 0 linhas.
UPDATE `Produto`
SET `precoPromocional` = ROUND(`preco` * 0.90, 2)
WHERE `slug` = 'sx200-trend';

-- 2) Desativa o cupom 10OFFTREND (não deixa de existir; só para de valer).
--    avaliarCupom recusa cupom inativo e o callout da PDP (filtra ativo=true)
--    deixa de anunciá-lo. Se o código não existir, 0 linhas.
UPDATE `Cupom`
SET `ativo` = 0
WHERE `codigo` = '10OFFTREND';
