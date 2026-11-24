-- ─────────────────────────────────────────────────────────────────────────────
-- SX040 volta para 45 m² de cobertura (decisão do Luccas, 24/11/2026: "o sx040
-- pode deixar 45m2"), igual ao M45 Trend, que tem as mesmas especificações.
-- Desfaz só o valor de área da migration 20261124130000; o rótulo "Cobertura"
-- da ficha continua (é o que o card de comparação lê).
-- Troca trechos exatos; reaplicar não muda nada (idempotente).
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE `Produto`
  SET `descricao` = REPLACE(REPLACE(`descricao`,
        'Cobertura de até 50 m²', 'Cobertura de até 45 m²'),
        'Cobertura: até 50 m²', 'Cobertura: até 45 m²')
  WHERE `slug` = 'sx040';

UPDATE `Produto`
  SET `especificacoes` = REPLACE(`especificacoes`, '"Até 50 m²"', '"Até 45 m²"')
  WHERE `slug` = 'sx040' AND `especificacoes` IS NOT NULL;
