-- ─────────────────────────────────────────────────────────────────────────────
-- Cobertura oficial nas descrições dos climatizadores (pedido do Luccas, 24/11/2026).
-- Áreas oficiais definidas pelo Luccas em 16/11: SX100 Trend 120 m², SX200 Trend 200 m².
-- As fichas técnicas e a conta de economia já usavam os valores oficiais; só o
-- título "Até N m² de cobertura" da descrição estava errado (100 e 175 — o 175
-- era a capacidade do reservatório em litros).
--
-- Troca só o trecho exato; reaplicar não muda nada (idempotente).
-- Reversão: mesmo REPLACE com os valores invertidos.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE `Produto`
  SET `descricao` = REPLACE(`descricao`, 'Até 100 m² de cobertura', 'Até 120 m² de cobertura')
  WHERE `slug` = 'sx100-trend';

UPDATE `Produto`
  SET `descricao` = REPLACE(`descricao`, 'Até 175 m² de cobertura', 'Até 200 m² de cobertura')
  WHERE `slug` = 'sx200-trend';
