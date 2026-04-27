# Mercado Pago — Checklist pré-produção

## Setup inicial

- [ ] Conta MP CNPJ Sixxis verificada (54.978.947/0001-09)
- [ ] Webhook URL cadastrada em modo **Sandbox** no painel MP
- [ ] Credenciais sandbox em Railway env vars (`MERCADOPAGO_ACCESS_TOKEN`,
      `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`,
      `MERCADOPAGO_ENV=sandbox`)
- [ ] `npx prisma db push` aplicado (tabela `Pagamento` + `Pedido.pagoEm`)

## Validação sandbox

- [ ] **PIX:** gerar PIX no `/checkout`, ver QR Code + cópia-cola na tela
- [ ] **PIX simulado pago:** simulação no painel test-tools dispara webhook
      → pedido vira `pago`, e-mail de confirmação sai
- [ ] **Cartão APRO:** finaliza, redireciona pra `/pedido/[id]/sucesso`
- [ ] **Cartão OTHE:** mostra erro amigável sem redirecionar
- [ ] **Cartão CONT:** estado `in_process`, mensagem "Pagamento em análise"
- [ ] Página `/pedido/[id]/sucesso` mostra resumo, itens e endereço corretos
- [ ] `/adm-a7f9c2b4/pedidos` (expand): seção "Pagamentos" lista a tentativa
- [ ] `/adm-a7f9c2b4/pagamentos`: aparecem os pagamentos com filtros funcionais
- [ ] Auditoria registra `pedido.pago` e `pagamento.update`

## Cutover para produção

- [ ] Trocar `MERCADOPAGO_ENV` pra `production` no Railway
- [ ] Trocar `MERCADOPAGO_ACCESS_TOKEN` pra prod (`APP_USR-...`)
- [ ] Trocar `MERCADOPAGO_PUBLIC_KEY` pra prod (`APP_USR-...`)
- [ ] Cadastrar webhook em modo **Produção** no painel MP
- [ ] Confirmar `MERCADOPAGO_WEBHOOK_SECRET` definida (HMAC obrigatório em prod)
- [ ] Fazer 1 transação real de teste (R$ 1,00 PIX) e estornar
- [ ] Verificar e-mail de confirmação chega em produção
