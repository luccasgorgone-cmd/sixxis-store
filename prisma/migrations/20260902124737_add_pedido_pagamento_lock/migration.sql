-- Lock anti-corrida do POST /api/checkout/criar-pagamento (ver
-- src/lib/pagamento-lock.ts). ADITIVO: um ADD COLUMN nullable, ZERO DROP,
-- ZERO mudança em colunas existentes.
--
-- `pagamentoEmProcessamentoEm` = claim atômico setado ao entrar na rota de
-- criação de pagamento e limpo no finally — impede que 2 chamadas
-- concorrentes pro MESMO pedido (duplo clique, 2 abas, retry de rede) gerem
-- 2 cobranças aprovadas de verdade no Mercado Pago. Fica stale sozinho
-- depois de LOCK_PAGAMENTO_STALE_MS (60s) pra nunca travar um retry legítimo
-- se o processo cair no meio do caminho.
ALTER TABLE `Pedido`
  ADD COLUMN `pagamentoEmProcessamentoEm` DATETIME(3) NULL;
