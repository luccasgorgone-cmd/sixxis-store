# Cloudflare · Rate Limiting e WAF

> **Nota importante sobre a topologia atual:** o deploy Railway serve a loja
> diretamente em `sixxis-store-production.up.railway.app`, que já fica atrás
> do edge do Railway. Para as regras de rate limiting abaixo surtirem efeito,
> Cloudflare precisa estar **na frente** do Railway (proxy laranja). Isso
> requer apontar um domínio próprio para o Railway e colocar Cloudflare como
> DNS. Enquanto o tráfego entrar direto pelo `.up.railway.app`, essas regras
> não se aplicam e a defesa bruteforce depende apenas do Bloco 3 in-app.

## Rate Limiting do Admin

No dashboard Cloudflare → selecionar a zona do domínio Sixxis:

**Security → WAF → Rate Limiting Rules → Create Rule**

### Rule 1 — Proteção do login admin

| Campo | Valor |
|---|---|
| Nome | `admin-login-protection` |
| Match | `(http.request.uri.path contains "/adm-a7f9c2b4/login") or (http.request.uri.path contains "/api/admin/auth")` |
| Characteristics (counter) | IP address |
| Period | 1 minute |
| Requests | 10 |
| Action | Block for 10 minutes |

### Rule 2 — Proteção da API admin

| Campo | Valor |
|---|---|
| Nome | `admin-api-ratelimit` |
| Match | `http.request.uri.path contains "/api/admin/"` |
| Characteristics | IP address |
| Period | 1 minute |
| Requests | 120 |
| Action | Managed Challenge (CAPTCHA) |

### Rule 3 — Proteção geral (opcional)

| Campo | Valor |
|---|---|
| Nome | `general-ratelimit` |
| Match | `http.request.uri.path wildcard r"/*"` |
| Characteristics | IP address |
| Period | 1 minute |
| Requests | 600 |
| Action | Managed Challenge |

## Bot Fight Mode

**Security → Bots → Bot Fight Mode: ON**
Free tier bloqueia bots conhecidos que tentam brute force, scraping, etc.

## DDoS Protection

**Security → DDoS → HTTP DDoS attack protection: High sensitivity**
Automatic na Free. Nada a fazer além de confirmar.

## Geo-blocking do admin (opcional, recomendado)

**Security → WAF → Custom Rules → Create Rule**

| Campo | Valor |
|---|---|
| Nome | `block-foreign-admin` |
| Match | `(http.request.uri.path contains "/adm-a7f9c2b4") and (ip.geoip.country ne "BR")` |
| Action | Block |

Bloqueia tentativas de acessar `/adm-a7f9c2b4/*` de fora do Brasil. A loja
pública permanece acessível globalmente.

## Headers de segurança

Considerar também configurar via **Transform Rules → Response Headers**:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

Alguns já vêm do Next.js; verificar redundância antes de aplicar.

## Checklist pós-configuração

- [ ] Testar login admin: 11 tentativas em 1 min devem ser bloqueadas
- [ ] Testar `curl -I https://<dominio>/adm-a7f9c2b4/login` de IP não-BR (se regra de geo ativada) retorna 403
- [ ] Confirmar headers via `curl -I https://<dominio>/`
- [ ] Monitorar: **Analytics → Security Events** durante primeiras 48h
