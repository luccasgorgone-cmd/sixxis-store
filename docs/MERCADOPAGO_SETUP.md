# Mercado Pago — Setup (Sprint 2A)

Integração via **Checkout Transparente (Bricks)** com PIX + cartão. Boleto fica
para Sprint 2 fase 2. Conta de produção: CNPJ Sixxis (54.978.947/0001-09).

## 1. Env vars no Railway

Adicionar **sem remover** as do Sprint 1 Infra (`JWT_SECRET`,
`ADMIN_PASSWORD_HASH`):

```bash
# ─── Sandbox (testes — começar por aqui) ──────────────────────────────────────
MERCADOPAGO_PUBLIC_KEY=TEST-...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_CLIENT_ID=...
MERCADOPAGO_CLIENT_SECRET=...

# ─── Produção (trocar quando aprovado em sandbox) ─────────────────────────────
# MERCADOPAGO_PUBLIC_KEY=APP_USR-...
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-...

# ─── Webhook secret (gerar com: openssl rand -hex 32) ─────────────────────────
MERCADOPAGO_WEBHOOK_SECRET=<32 bytes hex>

# ─── Toggle ambiente ──────────────────────────────────────────────────────────
MERCADOPAGO_ENV=sandbox     # mudar pra "production" depois
```

> **Compatibilidade:** o código também aceita as legadas `MP_ACCESS_TOKEN` e
> `MP_PUBLIC_KEY` como fallback, então não há problema em manter ambas durante
> a migração.

## 2. Onde cada env var é usada

| Var                              | Onde                            | Obrigatório? |
| -------------------------------- | ------------------------------- | :----------: |
| `MERCADOPAGO_ACCESS_TOKEN`       | server (`src/lib/mercadopago.ts`) |     sim     |
| `MERCADOPAGO_PUBLIC_KEY`         | client (Bricks SDK)             |     sim     |
| `MERCADOPAGO_WEBHOOK_SECRET`     | webhook HMAC                    |   produção  |
| `MERCADOPAGO_ENV`                | controla validação de assinatura | recomendado |
| `APP_URL` / `NEXT_PUBLIC_SITE_URL` | URL absoluta do `notification_url` | sim       |

## 3. Cadastrar webhook no painel MP

URL:
`https://sixxis-store-production.up.railway.app/api/webhooks/mercado-pago`

Eventos: **Payment** (apenas).

Modo: **Sandbox** primeiro. Quando aprovado, duplicar pra **Produção**.

Painel: https://www.mercadopago.com.br/developers/panel/notifications

## 4. Endpoints expostos pela aplicação

| Endpoint                                | Método | Quem usa                                    |
| --------------------------------------- | :----: | ------------------------------------------- |
| `/api/checkout/config`                  | GET    | Bricks SDK (busca public key)               |
| `/api/checkout/criar-pagamento`         | POST   | Bricks `onSubmit` (criação no MP)           |
| `/api/checkout/status/[pagamentoId]`    | GET    | Polling do PIX no client                    |
| `/api/webhooks/mercado-pago`            | POST   | Webhook oficial do MP                       |

O webhook legado em `/api/pagamento/webhook` foi mantido (compat com testes
antigos), mas a integração nova passa toda pelo path acima.

## 5. Cartões de teste (sandbox)

| Resultado            | Número              | Validade | CVV | Nome | CPF         |
| -------------------- | ------------------- | -------- | --- | ---- | ----------- |
| **Aprovado**         | 5031 4332 1540 6351 | 11/30    | 123 | APRO | 12345678909 |
| **Rejeitado**        | 5031 4332 1540 6351 | 11/30    | 123 | OTHE | 12345678909 |
| **Em análise**       | 5031 4332 1540 6351 | 11/30    | 123 | CONT | 12345678909 |

## 6. Simular PIX em sandbox

Ferramenta oficial: <https://www.mercadopago.com.br/developers/panel/test-tools>

Cole o `mpPaymentId` retornado pelo nosso endpoint `criar-pagamento` e clique
em **Simular pagamento**. O webhook chega em ≤ 5s.

## 7. Estrutura de tabela

A migração já está aplicada via `prisma db push`. Tabela `Pagamento`:

- `mpPaymentId` (unique) — id do MP, fonte de verdade pra reconciliar
- `mpStatus` — `pending` / `approved` / `rejected` / `cancelled` / etc
- `metodo` — `pix` | `credit_card` | `debit_card`
- `valor` — em **centavos** (Int)
- `qrCodeBase64` / `qrCodeCopiaECola` — preenchidos só pra PIX
- `parcelas` / `bandeira` / `ultimosDigitos` — preenchidos só pra cartão
- `rawResponse` — Json com a última resposta MP (debug)

`Pedido` ganhou `pagoEm DateTime?` e `pagamentos Pagamento[]`.

## 8. Admin

- **Listagem geral:** `/adm-a7f9c2b4/pagamentos` (filtros + stats)
- **Por pedido:** seção "Pagamentos" no expand de `/adm-a7f9c2b4/pedidos`

Cada linha tem link direto pro `https://www.mercadopago.com.br/activities/detail/<mpPaymentId>`.
