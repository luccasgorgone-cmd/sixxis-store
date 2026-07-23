-- Pessoa jurídica (consumidor final) no checkout. ADITIVO: só ADD COLUMN
-- nullable, zero DROP. Clientes PF existentes ficam com todos os campos NULL e
-- nada no fluxo atual depende deles.
--
-- indicadorIE define o CFOP da NF-e: 1=Contribuinte ICMS, 2=Isento de
-- inscrição, 9=Não contribuinte (PF sempre 9).
ALTER TABLE `Cliente`
  ADD COLUMN `cnpj` VARCHAR(191) NULL,
  ADD COLUMN `razaoSocial` VARCHAR(191) NULL,
  ADD COLUMN `inscricaoEstadual` VARCHAR(191) NULL,
  ADD COLUMN `indicadorIE` INT NULL;

-- cnpj é @unique (mesmo padrão do cpf) — impede duas contas com o mesmo CNPJ.
CREATE UNIQUE INDEX `Cliente_cnpj_key` ON `Cliente`(`cnpj`);
