-- ─────────────────────────────────────────────────────────────────────────────
-- Login do colaborador VITOR (role 'pedidos' — só a aba Pedidos, p/ cotar frete).
-- Pedido do Luccas, 23/11/2026. O hash bcrypt da senha fica na Configuracao
-- `colaborador_vitor_hash` (nunca o texto puro). Idempotente (ON DUPLICATE KEY).
--
-- O papel ('pedidos') e o roteamento do login estão em código
-- (src/lib/admin-usuarios.ts + adminToken/adminAuth). O login "Gerenciamento"
-- (admin) NÃO precisa de registro: valida contra o hash do admin já existente.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO `Configuracao` (`id`, `chave`, `valor`, `updatedAt`)
VALUES (
  'cfg_colab_vitor_hash',
  'colaborador_vitor_hash',
  '$2b$10$RiCBNGULs3U3.SEAt3RTjuUcjNSYb3gHPbk0qS2VzJmdQEHgMFQU.',
  CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  `valor`     = VALUES(`valor`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
