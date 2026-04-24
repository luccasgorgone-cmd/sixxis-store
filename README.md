This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Infraestrutura e Segurança

- **Admin path obfuscado**: `/adm-a7f9c2b4/login` (o caminho pode ser rotacionado via env `ADMIN_PATH_TOKEN`). `/admin/*` é honeypot 404.
- **Senha admin**: armazenada como hash bcrypt em `ADMIN_PASSWORD_HASH` (env) ou em `Configuracao[chave=admin_password_hash]` no banco. Nunca em texto.
- **Token de sessão**: JWT com HMAC-SHA256 assinado por `JWT_SECRET` (cookie `admin_token`, httpOnly, 8h).
- **Proteção brute-force**: 5 tentativas falhas em 10 min bloqueiam o IP por 30 min (ver models `TentativaLogin` / `BloqueioIp`).
- **Auditoria**: ações mutativas do admin registradas em `AuditLog`, visíveis em `/adm-a7f9c2b4/auditoria`.
- **Cloudflare WAF + Rate Limiting**: passo-a-passo em [docs/INFRA_CLOUDFLARE.md](./docs/INFRA_CLOUDFLARE.md).
- **Gateway (Sprint 2)**: `/api/gateway/[...slug]` esqueleto, valida `x-api-key` e registra chamada em AuditLog. Routers específicos (ERP, NFe, WhatsApp) vão conectar aqui.

### Env vars obrigatórias

| Nome | Descrição |
|---|---|
| `ADMIN_PASSWORD_HASH` | Hash bcrypt da senha do admin |
| `JWT_SECRET` | Segredo para assinar o cookie admin_token (48+ chars random) |
| `ADMIN_PATH_TOKEN` | Sufixo da URL admin (default `adm-a7f9c2b4`) — informativo, a rota física está em `src/app/adm-a7f9c2b4/` |
| `ERP_API_KEY` / `NFE_API_KEY` / `WEBHOOK_API_KEY` | Chaves para `/api/gateway/*` (Sprint 2) |

