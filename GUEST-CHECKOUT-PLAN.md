# Guest Checkout — Implementation Plan (feat/guest-checkout)

Branch: `feat/guest-checkout` (based on origin/main @ fcf9fd4). Local only. No schema
migration, no push/deploy/railway.

## 1. Confirmed diagnosis (evidence)

- **/checkout is guarded by the Next 16 proxy (middleware), not a page/layout.**
  `src/proxy.ts:40-45` lists `CLIENTE_PROTEGIDAS` including `/^\/checkout(\/.*)?$/`.
  `src/proxy.ts:191-200` (CLIENTE guard) checks for a NextAuth session cookie and, when
  absent, does `NextResponse.redirect('/login?redirect=<original>')`. That is the exact
  `/checkout → /login?redirect=%2Fcheckout` behavior.
- The checkout page itself (`src/app/(loja)/checkout/page.tsx`) is already a `'use client'`
  component and is *already guest-aware* (comments at lines 468-471 handle the `401` perfil
  fetch as "checkout convidado"). So the ONLY hard block to a guest reaching the page is the
  proxy redirect.
- **`POST /api/pedidos` auth gate:** `src/app/api/pedidos/route.ts:86-90` — `const session =
  await auth(); if (!session?.user?.id) return 401`. `session.user.id` then threads through:
  - block gate `isClienteBloqueado(session.user.id)` (:93)
  - idempotency lookup `where: { clienteId, idempotencyKey }` (:118-134, :309-325)
  - endereco ownership `endereco.clienteId !== session.user.id` (:141)
  - cupom `avaliarCupom(cupom, subtotal, session.user.id)` (:220)
  - cashback `resgatarCashback(session.user.id, ...)` (:360)
  - carrinho convertido `updateMany({ where: { clienteId } })` (:374)
- **Second hidden block in the client flow:** `irParaPagamento` (page.tsx:864-878) POSTs to
  `/api/enderecos` to obtain an `enderecoId`; that route is also `auth()`-gated and 401s for
  a guest, throwing "Faça login para continuar". So the guest flow has to bypass
  `/api/enderecos` and send the address inline.
- **Analytics:** `trackBeginCheckout` (GA4 `begin_checkout` + Meta `InitiateCheckout`) is
  fired client-side on checkout mount (page.tsx:570-596) via `src/lib/analytics/events.ts:131`,
  independent of auth. `TrackingProvider`/Pixel are mounted in `src/components/Providers.tsx`
  and gated only by consent, not auth. So once the page loads for a guest, the events fire
  unchanged. `add_payment_info/AddPaymentInfo` (page.tsx:1055) and `purchase/Purchase` (MP
  webhook) are likewise auth-independent.
- **Captcha:** Cloudflare Turnstile code exists ONLY on auth/contact forms
  (`src/lib/turnstile.ts`, used by `login`, `cadastro`, `esqueci-senha`, `contato`). There is
  **no** Turnstile/captcha anywhere in `checkout`, `carrinho`, `/api/pedidos`, `/api/checkout`
  or the MP path. See §P2.
- **Other checkout branches (awareness only):** `git log main..origin/feat/checkout-multi-metodo`
  is empty relative to main (that work — `CheckoutMultiMetodo`, multi-método orchestrator — is
  already merged into main/fcf9fd4). No separate guest-checkout work exists to reuse.

## 2. Option A design — guest pseudo-cliente + pseudo-endereco (NO migration)

`Pedido.clienteId` and `Pedido.enderecoId` are NOT NULL FKs. We satisfy them by creating/looking
up a **guest `Cliente` keyed by `email`** and a guest `Endereco` under it.

- `Cliente.senha` is NOT NULL. We set `senha: ''`. This is the project's existing "OAuth-first,
  no local password" sentinel: `src/lib/auth.ts:73-74` returns `null` from `authorize` when
  `!cliente.senha`, so a guest cliente **cannot** log in via credentials. No new auth surface.
- Resolution is an **`upsert` on the unique `email`**: if the email already belongs to a real
  account, that account is reused (order attributed to them); otherwise a new guest cliente is
  created. Upsert also resolves the double-submit race (email `@unique` → no P2002).
- The guest `Endereco` is created fresh under the resolved `clienteId` from the inline address.
- Phone normalization reuses the existing helper `canonTelefone` from
  `src/lib/telefone-busca.ts` ("DDD + 8 dígitos" rule) — no new helper invented.

### Files to change
- `src/lib/guest-checkout.ts` **(new)** — pure, unit-tested: Zod schema for the guest body
  (`guest` + `endereco`) and `montarClienteGuestData()` that normalizes email/phone/document and
  computes `indicadorIE` + `senha: ''`. No prisma import (keeps it unit-testable like the other
  `src/lib/*.test.ts`).
- `src/lib/guest-checkout.test.ts` **(new)** — TDD tests for schema + builder.
- `src/app/api/pedidos/route.ts` — add the guest branch (see §3).
- `src/app/(loja)/checkout/page.tsx` — in `irParaPagamento`, branch logged-in vs guest; guest
  skips `/api/conta/perfil` PATCH and `/api/enderecos` POST and sends `guest`+`endereco` inline.
- `src/proxy.ts` — remove `/^\/checkout(\/.*)?$/` from `CLIENTE_PROTEGIDAS` (keep minha-conta /
  pedidos protected). `/checkout/retomar/[id]` keeps its own server-side login redirect
  (page.tsx:15), so logged-in resume is unaffected.

## 3. How each threaded concern is handled for guests

| Concern | Logged-in (unchanged) | Guest |
|---|---|---|
| **Resolve clienteId** | `session.user.id` | `upsert Cliente by email` → `clienteId` |
| **enderecoId** | from `/api/enderecos` (client) or body | created inline under guest clienteId |
| **isClienteBloqueado** | on `session.user.id` | on resolved guest `clienteId` (blocks reused-email blocked accounts too) |
| **idempotency** | `{clienteId, idempotencyKey}` | same — clienteId is stable per email, so retries dedupe |
| **endereco ownership** | `endereco.clienteId === clienteId` | endereco was just created under clienteId → check still passes (unified) |
| **cupom** | `avaliarCupom(…, clienteId)` | `avaliarCupom(…, null)` — preserves existing rule that *primeira-compra* coupons need a real login (cupom.ts:78); all other coupon rules still apply |
| **cashback** | `resgatarCashback(clienteId, …)` | **skipped** (`cashbackUsar` forced to 0) — prevents a guest draining a reused email's cashback balance without logging in |
| **carrinho convertido** | `updateMany({clienteId})` | harmless no-op (guest has no CarrinhoCliente) |
| **NF-e** | unchanged | unchanged — no NF-e emission in this handler; fiscal behavior untouched |
| **Mercado Pago** | Bricks with `pedidoId`+payer email/cpf | identical; guest has email/cpf from the form |

## 4. Analytics preservation

No analytics code moves. Removing the proxy redirect makes `/checkout` load for guests; the
existing mount-time `trackBeginCheckout` fires `begin_checkout`/`InitiateCheckout`; the MP Brick
`onMetodoSelecionado` fires `add_payment_info/AddPaymentInfo`; the MP webhook fires
`purchase/Purchase`. Verified wiring: events.ts:131-156, page.tsx:570-596 & 1055, Providers.tsx.

## 5. "Create account after purchase" (optional)
Low-risk deferral: the guest cliente already exists with `senha: ''`. Offering "set a password
now" post-purchase is a separate screen + a `/api/conta/definir-senha` endpoint. **Deferred** —
not implemented this run (kept out of scope to avoid new auth surface). Noted here per task.

## P2 — Captcha (DIAGNOSE ONLY this run)

Verdict: **infrastructure-level (Cloudflare dashboard), not app-level.** The only captcha code in
the repo is Turnstile on login/cadastro/esqueci-senha/contato. There is nothing on the
cart→payment path. Additionally, part of what the audit saw was likely the Turnstile on `/login`
that guests were *forced through* — removing the forced-login redirect (P1) means guests never
touch `/login`, so that instance disappears for the purchase path.

Any residual "Verify you are human" interstitial on `/checkout` or the MP step is served by
Cloudflare before the app runs. **Action for the owner (we cannot do it — no dashboard/railway):**
In the Cloudflare dashboard for the zone: Security → disable/relax **Bot Fight Mode** and any
**Managed Challenge / WAF custom rule / Rate-limiting rule** whose path matches `/checkout*`,
`/carrinho*`, `/api/pedidos`, `/api/checkout*`, `/api/frete`, `/api/mercado-pago*`. Add a
skip/allow rule for those paths (and the MP webhook) so mobile users are not challenged. No code
change is required or possible from the repo.

If later we want an app-level bot defense on guest orders instead, the hook point is
`POST /api/pedidos` (add an optional Turnstile token verified via `verifyTurnstile`, which already
degrades gracefully when no secret is set). Not done now.

## P3 — CEP estimator in cart (FUTURE, not this run)
Add a CEP field in `src/app/(loja)/carrinho/page.tsx` that calls the existing `POST /api/frete`
(same contract the checkout uses) to show an estimated shipping/ETA before checkout. Pure additive
UI; reuses `useViaCep` + `/api/frete`. No backend change.
