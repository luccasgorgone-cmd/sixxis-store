-- ─────────────────────────────────────────────────────────────────────────────
-- Revisão dos cards "Qual Sixxis combina com você?" e das descrições dos
-- climatizadores (pedido do Luccas, 24/11/2026).
--
-- 1. SX040: cobertura oficial 50 m² (decisão do Luccas, 24/11). A ficha usava o
--    rótulo "Área Recomendada", que o card não lia (aparecia "—"); passa a
--    "Cobertura" como nos demais modelos.
-- 2. M45, SX070, SX100 e SX200 Trend: a descrição veio de um modelo antigo e
--    divergia da ficha técnica. Alinha vazão (SX070 9500 → 8.000 m³/h, igual à
--    ficha) e ruído (ficha: 60 dB / abaixo de 60 dB) e remove a comparação
--    "mais silencioso que uma geladeira", que não vale para 55–65 dB.
--
-- Cada REPLACE troca só um trecho exato; reaplicar não muda nada (idempotente).
-- Reversão: os mesmos REPLACE com os textos invertidos.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. SX040
UPDATE `Produto`
  SET `descricao` = REPLACE(REPLACE(`descricao`,
        'Cobertura de até 45 m²', 'Cobertura de até 50 m²'),
        'Cobertura: até 45 m²', 'Cobertura: até 50 m²')
  WHERE `slug` = 'sx040';

UPDATE `Produto`
  SET `especificacoes` = REPLACE(REPLACE(`especificacoes`,
        '"Área Recomendada"', '"Cobertura"'),
        '"até 45 m²"', '"Até 50 m²"')
  WHERE `slug` = 'sx040' AND `especificacoes` IS NOT NULL;

-- 2. Descrições alinhadas à ficha técnica
UPDATE `Produto`
  SET `descricao` = REPLACE(REPLACE(`descricao`,
        '5500 m³/h', '5.500 m³/h'),
        'abaixo de 55 dB (mais silencioso que uma geladeira)', 'abaixo de 60 dB')
  WHERE `slug` = 'm45-trend';

UPDATE `Produto`
  SET `descricao` = REPLACE(REPLACE(`descricao`,
        '9500 m³/h', '8.000 m³/h'),
        'abaixo de 58 dB (mais silencioso que uma geladeira)', '60 dB')
  WHERE `slug` = 'sx070-trend';

UPDATE `Produto`
  SET `descricao` = REPLACE(REPLACE(`descricao`,
        '12000 m³/h', '12.000 m³/h'),
        'abaixo de 62 dB (mais silencioso que uma geladeira)', '60 dB')
  WHERE `slug` = 'sx100-trend';

UPDATE `Produto`
  SET `descricao` = REPLACE(REPLACE(`descricao`,
        '20000 m³/h', '20.000 m³/h'),
        'abaixo de 65 dB (mais silencioso que uma geladeira)', '60 dB')
  WHERE `slug` = 'sx200-trend';
