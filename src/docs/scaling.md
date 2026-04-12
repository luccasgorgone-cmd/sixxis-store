# Escalando a Sixxis Store para 10.000 usuários

## Estado atual após otimizações

- Railway Pro: suporta ~500-800 usuários simultâneos (melhorado com pool de conexões)
- MySQL Railway: ~100 conexões simultâneas (otimizado via `connection_limit=20` por instância)
- Cache HTTP: páginas estáticas com revalidação automática (sobre, faq, contato: 1h; política: 24h)
- Imagens: AVIF/WebP, lazy loading, `minimumCacheTTL=86400`

## Para suportar 10.000 usuários

### Passo 1: Cloudflare (gratuito — ATIVAR AGORA)

1. No Railway: copie o IP/domínio da aplicação
2. No Cloudflare: adicione o domínio sixxis.com.br
3. Ative o Proxy (ícone laranja) no DNS
4. Crie Cache Rules:
   - `URI Path contains /api/produtos` → Cache Level: Cache Everything, TTL: 60s
   - `URI Path contains /api/banners` → Cache Level: Cache Everything, TTL: 60s
5. Rate Limiting: máx 100 req/min por IP na path `/api/*`
6. **Custo: R$ 0 no plano Free**

### Passo 2: Variáveis de ambiente no Railway

Adicione estas variáveis no Railway (Settings → Variables):

```
RESEND_API_KEY=re_xxxxxxxxxxxx
ADMIN_EMAIL=seu@email.com
EMAIL_FROM=Sixxis <noreply@sixxis.com.br>
NEXT_PUBLIC_SITE_URL=https://sixxis-store-production.up.railway.app
```

Para o pool de conexões MySQL, adicione ao final do DATABASE_URL:
```
?connection_limit=20&pool_timeout=30&connect_timeout=10
```

### Passo 3: Healthcheck no Railway

Em Railway → Settings → Deploy:
- **Healthcheck Path:** `/api/health`
- **Restart Policy:** On Failure

### Passo 4: Múltiplas réplicas (quando precisar de mais)

Em Railway → Settings → Scale:
- Aumentar **Replicas: 2** (ou mais)
- Cada réplica usa até 20 conexões no pool → 40 conexões totais com 2 réplicas
- **Custo:** ~R$ 100-200/mês dependendo da configuração

### Passo 5: Redis para cache de sessão e filas (opcional)

- Adicionar serviço Redis no Railway (Databases → Redis)
- Usar para:
  - Cache de produtos (`unstable_cache` com tag invalidation)
  - Fila de emails (abandono de carrinho, follow-up)
  - Sessões de usuário
- **Custo:** ~R$ 25-50/mês

### Passo 6: MySQL externo de alta disponibilidade (>5.000 usuários)

- **PlanetScale** (recomendado): connection pooling nativo, branching, analytics
- **Railway MySQL Pro**: aumentar recursos no painel
- **Custo:** ~R$ 150/mês (PlanetScale Hobby/Scaler)

## Estimativa de capacidade por configuração

| Configuração | Usuários simultâneos | Custo/mês |
|---|---|---|
| Atual (Railway básico) | ~300 | ~R$ 60 |
| + Cloudflare + variáveis | ~800 | ~R$ 60 |
| + 2 réplicas Railway | ~2.000 | ~R$ 200 |
| + Redis + 4 réplicas | ~5.000 | ~R$ 350 |
| + MySQL externo + CDN | ~10.000+ | ~R$ 550 |

## Monitoramento

- Healthcheck: `GET /api/health` — retorna status do DB e uptime
- Railway Metrics: CPU, RAM, requests/s em tempo real
- Logs: `railway logs` via CLI

## Otimizações já aplicadas (nesta release)

- [x] `compress: true` no next.config
- [x] `poweredByHeader: false`
- [x] Headers de segurança (X-Frame-Options, X-Content-Type-Options)
- [x] Cache HTTP para assets estáticos (1 ano)
- [x] Imagens AVIF/WebP com `minimumCacheTTL=86400`
- [x] `sizes` correto no CardProduto (`50vw / 33vw / 25vw`)
- [x] `priority` nos primeiros 4 cards, `lazy` nos demais
- [x] `revalidate=3600` em sobre, faq, contato
- [x] `revalidate=86400` em política-de-troca
- [x] Pool de conexões configurável via URL
- [x] `optimizePackageImports: ['lucide-react']`
- [x] `staleTimes.dynamic=0, static=30` (experimental)
- [x] Endpoint `/api/health` para Railway healthcheck
