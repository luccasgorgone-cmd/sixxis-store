-- Cashback: ciclo pendente→disponível, clawback e teto de uso. ADITIVO.
-- Cliente: saldo pendente (creditado mas ainda não liberado na entrega).
ALTER TABLE `Cliente`
  ADD COLUMN `cashbackPendente` DOUBLE NOT NULL DEFAULT 0;

-- CashbackTransacao: status do lançamento (pendente/disponivel/cancelado).
-- Default 'disponivel' preserva semântica dos lançamentos já existentes.
ALTER TABLE `CashbackTransacao`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'disponivel';

-- Pedido: quanto de cashback disponível foi resgatado neste pedido.
ALTER TABLE `Pedido`
  ADD COLUMN `cashbackUsado` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
