# 🚀 EXECUÇÃO EM PROD — pós-merge polimento-pos-2c + polimento-mobile-001

**Data:** 2026-04-28
**Último commit em main:** b3aa174 (`feat(cupom): sync /carrinho ↔ /checkout + resumo desktop maior`)
**Hipótese principal do diagnóstico:** **Nenhum merge foi feito** — as branches `polimento-pos-2c` e `polimento-mobile-001` continuam apenas como branches remotas, e `main` segue em `b3aa174` (commit anterior à sessão de polimento). Railway não tem o que deployar porque `main` não mudou.

> **Variante da hipótese 5 (push não chegou):** o push das branches feature foi feito (origin tem ambas), mas o **merge em main nunca aconteceu**. Por isso Railway mostra "12h atrás" — esse 12h corresponde ao último deploy real de `b3aa174`, e nada mais foi disparado.

---

## ⚠️ PASSO 0 — RESOLVER O MERGE QUE NÃO ACONTECEU

### 0.A · Confirmar estado das branches no GitHub

1. Abrir https://github.com/luccasgorgone-cmd/sixxis-store/branches
2. Confirmar que existem:
   - `main` → último commit `b3aa174` (de ~12h atrás)
   - `polimento-pos-2c` → commits acima de main (12 commits)
   - `polimento-mobile-001` → mais 6 commits acima de polimento-pos-2c

### 0.B · Mergear via GitHub PR (recomendado — preserva histórico)

**PR 1 — polimento-pos-2c → main:**
1. https://github.com/luccasgorgone-cmd/sixxis-store/compare/main...polimento-pos-2c
2. **Create pull request**
3. Title: `Polimento pós-Sprint 2C (admin + scripts + base mobile)`
4. Revisar diff (12 commits, mostly admin polish + scripts de manutenção + MOB-1..13 inicial)
5. **Merge pull request** → confirmar
6. Aguardar Railway disparar deploy automático (3-5 min)

**PR 2 — polimento-mobile-001 → main (depois do PR 1 mergeado):**
1. https://github.com/luccasgorgone-cmd/sixxis-store/compare/main...polimento-mobile-001
2. **Create pull request**
3. Title: `Polimento mobile (bottom nav + tap targets + UX)`
4. **Merge pull request**
5. Railway dispara segundo deploy

### 0.C · Alternativa local (se preferir CLI)

```bash
cd C:\Users\User\sixxis-store
git checkout main
git pull origin main

git merge --no-ff origin/polimento-pos-2c -m "merge: polimento pós-Sprint 2C"
git push origin main

git merge --no-ff origin/polimento-mobile-001 -m "merge: polimento mobile"
git push origin main
```

### 0.D · Limpar branches já mergeadas

Após confirmar que tudo está no main e funcionando:
```bash
git push origin --delete polimento-pos-2c
git push origin --delete polimento-mobile-001
git branch -D polimento-pos-2c polimento-mobile-001
```

### 0.E · Verificar deploy Railway disparou

1. https://railway.app/dashboard → Sixxis Store → service Next.js
2. Aba **Deployments** — deve aparecer um novo deploy com commit recente
3. Status: **Building** → **Active** (3-5 min)
4. Se ficar **Failed**: ver logs do build, env var faltando ou bug de tipo

### 0.F · Se Railway NÃO disparar mesmo com push em main

Verificar **Settings → Source** do service principal:
- [ ] Repo conectado: `luccasgorgone-cmd/sixxis-store`
- [ ] Branch alvo: **`main`**
- [ ] Auto-deploy: **ON**
- [ ] Root Directory: vazio ou `/`

Se config OK e mesmo assim nada → **Deployments → Deploy** manual no último commit.

### 0.G · Confirmar env vars de produção

Aba **Variables**. Confirmar TODAS estas existem:

```
ADMIN_PASSWORD_HASH
JWT_SECRET
ADMIN_PATH_TOKEN
AUTH_TRUST_HOST
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_SITE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT
R2_PUBLIC_URL
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY
MERCADOPAGO_WEBHOOK_SECRET
MERCADOPAGO_ENV
MELHOR_ENVIO_TOKEN
ANTHROPIC_API_KEY
```

Se faltar `ANTHROPIC_API_KEY` → Luna chat quebra (mas resto do site sobe normal).

### 0.H · Validar que o deploy ficou Active

```
https://sixxis-store-production.up.railway.app/  → carrega home
https://sixxis-store-production.up.railway.app/adm-a7f9c2b4/login  → tela login
```

**SÓ PROSSEGUIR PRO PASSO 1 SE ESSE PASSO 0 ESTIVER OK.**

---

## 🛡 PASSO 1 — BACKUP MYSQL (5 min)

**OBRIGATÓRIO antes de qualquer script.**

### Via painel Railway (recomendado)
1. https://railway.app/dashboard → projeto Sixxis Store
2. Service MySQL → aba **Data**
3. Botão **Export** → baixar `.sql.gz`
4. Salvar em `C:\Users\User\sixxis-store\backups\2026-04-28-pre-scripts.sql.gz`

### Via CLI (alternativa)
```bash
railway login
railway link  # selecionar Sixxis Store
```

---

## 🗄 PASSO 2 — APLICAR SCHEMA (1 min)

A migration cria coluna `Banner.imagemMobile` (já no schema, ainda não aplicada em prod):

```bash
cd C:\Users\User\sixxis-store
git checkout main
git pull origin main

railway login   # se ainda não logado
railway link    # selecionar Sixxis Store project + service principal

railway run npx prisma db push
```

> Como o repo não tem pasta `prisma/migrations` (usa `db push` em todas as sessões), `migrate deploy` não se aplica. `db push` aplica o schema atual diretamente — seguro porque a única mudança nova é a coluna nullable `imagemMobile String?`.

**Esperado:** `The database is now in sync with the Prisma schema.`

---

## 🧹 PASSO 3 — RODAR 4 SCRIPTS DE LIMPEZA/SEED (na ordem)

> ⚠️ **Pré-requisito:** o commit do hotfix `01802d2 fix(scripts): scripts/_db.ts compartilhado` precisa estar mergeado em main. Sem ele os scripts dão `error parsing connection string`.

```bash
# 3.1 Limpar secrets do banco
railway run npx tsx scripts/limpar-secrets-loja.ts
```
**Esperado:** log das chaves removidas (anthropic_api_key, mp_*_token, r2_*, evolution_*, etc).

```bash
# 3.2 Seed do cupom SIXXIS10
railway run npx tsx scripts/seed-sixxis10.ts
```
**Esperado:** `✅ Cupom SIXXIS10 criado` ou `atualizado`.

```bash
# 3.3 Limpar reviews duplicadas
railway run npx tsx scripts/limpar-reviews-duplicadas.ts
```
**Esperado:** log de N reviews removidos.

```bash
# 3.4 Seed reviews realistas (preserva SX040)
railway run npx tsx scripts/seed-reviews-realistas.ts
```
**Esperado:** log de ~36-40 reviews criadas (4 por produto × 9 produtos não-SX040).

---

## ✅ PASSO 4 — VALIDAR ADMIN EM PROD (5 min)

### `/adm-a7f9c2b4/configuracoes-loja`
- [ ] Lista ≤ 30 chaves (não 97)
- [ ] Nenhuma chave com nome contendo `api_key`, `secret`, `token`, `password`, `hash`
- [ ] Inputs sensíveis em `/configuracoes` substituídos por `<EnvVarHint>`

### `/adm-a7f9c2b4/cupons`
- [ ] Mostra `SIXXIS10` ativo, percentual 10%
- [ ] Flag "primeira compra apenas" marcada

### `/adm-a7f9c2b4/avaliacoes`
- [ ] Reviews aleatórias com texto distinto (sem clones do Ricardo P. / Fernanda C.)

### `/adm-a7f9c2b4/produtos`
- [ ] Lista produtos reais (≥ 10), não "0 encontrados"

### `/adm-a7f9c2b4/clientes`
- [ ] CPF mascarado: `***.***.876-87`

### `/adm-a7f9c2b4/banners`
- [ ] Form com 2 uploads: Desktop (3:1) + Mobile (1:1 ou 4:3)
- [ ] Validação obriga título preenchido

### `/adm-a7f9c2b4` sidebar
- [ ] Não existe mais aba "Agente Luna" em /configuracoes
- [ ] Card no topo redireciona pra /adm-a7f9c2b4/luna

**Se algum item falhar:** restaurar backup do PASSO 1, abrir issue. NÃO prosseguir.

---

## 🖼 PASSO 5 — RE-UPLOAD IMAGENS DAS CATEGORIAS (2 min)

As 2 URLs hardcoded da home estão 404. Pode pular se fallback Lucide do MOB-3 estiver suficiente:
- **Climatizadores**: foto SX040/SX120 fundo claro ~600×600
- **Spinning**: foto Sixxis Life fundo claro ~600×600

Re-uploadar em `/adm-a7f9c2b4/editor-home` ou direto no R2.

---

## 📱 PASSO 6 — VALIDAR EM iPhone REAL (10 min)

Abrir `https://sixxis-store-production.up.railway.app/` no iPhone (Safari):

### Bottom Nav (mobile, escondida em /checkout)
- [ ] 4 ícones (Início, Categorias, Carrinho, Conta)
- [ ] Badge no carrinho mostra qty
- [ ] Item ativo destacado em `#3cbfb3`
- [ ] Tap em "Carrinho" abre drawer (não navega)

### FAB Luna
- [ ] Acima da bottom nav (não sobrepõe)
- [ ] Respeita home indicator (safe-area-inset-bottom)

### Header
- [ ] Reduz altura ao scrollar (~95px scrolled, ~135px no topo)
- [ ] Hambúrguer abre drawer da esquerda
- [ ] Logo com `width=170` `height=36` reservados (sem CLS)

### Carrinho
- [ ] Botões Remover, qty +/- ≥ 44×44
- [ ] Cupom field não dá zoom forçado (font-size 16px)
- [ ] Cart drawer ocupa tela inteira (`w-full sm:w-[420px]`)
- [ ] Botão fechar drawer 44×44

### Login/Cadastro
- [ ] Inputs sem zoom forçado
- [ ] Botões Google/FB ≥ 48px

### Produto SX040
- [ ] Galeria swipe horizontal (`onTouchStart`/`onTouchEnd`)
- [ ] Dots indicator visível em mobile (thumbnails só desktop)
- [ ] Variação 110V/220V ≥ 44px
- [ ] Garantia +12m / +24m visíveis
- [ ] Especificações stack vertical: label uppercase pequeno + valor texto-sm

### Home
- [ ] Banner hero com imagem mobile (após PASSO 2 + upload no admin)
- [ ] 3 categorias com imagem ou fallback Lucide (Wind/Bike/Fan)
- [ ] Mais Vendidos: 2 colunas, cards legíveis
- [ ] Ticker do cupom rotaciona com fade a cada 3s

### Checkout
- [ ] 5 etapas barra horizontal compacta (icones + connectors)
- [ ] Brick MP cabe em 390px sem overflow
- [ ] Cartão APRO sandbox finaliza: `5031 4332 1540 6351 / 11/30 / 123 / APRO / 12345678909`
- [ ] PIX QR visível e copiável
- [ ] Bottom nav escondida (concentração)

### Geral
- [ ] Sem scroll horizontal em iPhone SE (375px)
- [ ] CTAs com active feedback (`scale 0.97`)
- [ ] Cookie banner não cobre conteúdo principal

---

## 🚨 PLANO B

### Script falhou em prod
Restaurar backup do PASSO 1.

### Deploy quebrou prod
```bash
git revert HEAD --no-edit
git push origin main
```

### Mobile bug crítico no iPhone
Reverter só o merge mobile:
```bash
git log --oneline -5
git revert -m 1 <hash_merge_mobile> --no-edit
git push origin main
```

---

## 📊 STATUS FINAL ESPERADO

- [ ] Polimento desktop em prod (admin polishing, scripts, MOB-1..13 base)
- [ ] Polimento mobile em prod (bottom nav, audit tap targets, MOB-14..17)
- [ ] Schema atualizado (Banner.imagemMobile)
- [ ] Banco sem secrets em ConfiguracaoLoja
- [ ] SIXXIS10 ativo no banco
- [ ] Reviews realistas (sem clones)
- [ ] Mobile experience nivelada com Mercado Livre / Magalu / Casas Bahia
- [ ] Branches polimento-* deletadas no remote
