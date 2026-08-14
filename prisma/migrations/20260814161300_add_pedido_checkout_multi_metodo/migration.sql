-- Sub-estado do checkout multi-método (2 cartões, ou pix + cartão pro
-- restante). ADITIVO: dois ADD COLUMN nullable, ZERO DROP, ZERO mudança nos
-- valores existentes de `Pedido.status`.
--
-- `status` já é comparado literalmente (=== 'pago' / 'pendente') em ~10
-- lugares do código (webhook MP, admin, página do cliente, cashback,
-- exclusão) — introduzir novos valores nesse campo quebraria todos eles de
-- uma vez. `multiMetodoStatus` guarda o sub-estado do pagamento parcial numa
-- coluna própria; quando o fluxo aprova de verdade, `status` vira 'pago'
-- pelo caminho já existente (webhook), sem passar por aqui.
--
-- Valores gravados por src/lib/checkout-multi-metodo.ts (StatusCheckoutMultiMetodo):
-- 'aguardando_pix' | 'aguardando_pagamento_restante' | 'falhou' | 'cancelado'
-- NULL = pedido não usa o fluxo multi-método (checkout clássico).
--
-- `mpOrderId` é o id da ORDER da Orders API do Mercado Pago — namespace
-- diferente de `Pagamento.mpPaymentId` (Payment API de pagamento único).
-- Guardado pra retomar a fase 2 do fluxo pix+cartão quando o webhook
-- confirmar o Pix.
ALTER TABLE `Pedido`
  ADD COLUMN `multiMetodoStatus` VARCHAR(191) NULL,
  ADD COLUMN `mpOrderId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Pedido_mpOrderId_key` ON `Pedido`(`mpOrderId`);
CREATE INDEX `Pedido_multiMetodoStatus_idx` ON `Pedido`(`multiMetodoStatus`);
