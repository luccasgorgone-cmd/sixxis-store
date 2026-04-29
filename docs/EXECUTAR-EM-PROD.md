# 🚀 EXECUÇÃO EM PROD — pós-merge polimento-pos-2c + polimento-mobile-001

**Data:** 2026-04-29
**Último commit em main:** 0dee5dd (`merge: polimento mobile - MOB-1, 7, 9, 14, 16, 17 + heranças + bottom nav + tap targets 44px + safe-area + galeria swipe + Inter+Poppins`)
**Status:** ✅ Merges em main feitos. Pronto pra executar comandos prod.

---

## ⚠️ PASSO 0 — VALIDAR DEPLOY RAILWAY (3-5 min)

### 0.1 · Confirmar deploy Active
1. https://railway.app/dashboard → projeto Sixxis Store
2. Service principal (Next.js) → aba **Deployments**
3. Aguardar último deploy ficar **Active** (status verde)
4. Se ficar **Failed**: ver logs, verificar env vars (PASSO 0.3)
5. Se NÃO disparar deploy automático após 5min:
   - Aba **Settings** → seção **Source**
   - Confirmar: repo `luccasgorgone-cmd/sixxis-store`, branch **main**, auto-deploy **ON**
   - Botão **Deploy** ou **Redeploy** manual

### 0.2 · Validar URLs em prod
```
https://sixxis-store-production.up.railway.app/  → carrega home
https://sixxis-store-production.up.railway.app/adm-a7f9c2b4/login  → tela login
```

### 0.3 · Conferir env vars críticas (apenas se deploy falhou)
Aba **Variables** do service. Confirmar todas presentes:
```
ADMIN_PASSWORD_HASH, JWT_SECRET, ADMIN_PATH_TOKEN, AUTH_TRUST_HOST,
DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_SITE_URL,
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
R2_ENDPOINT, R2_PUBLIC_URL,
MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_PUBLIC_KEY, MERCADOPAGO_WEBHOOK_SECRET,
MERCADOPAGO_ENV, MELHOR_ENVIO_TOKEN, ANTHROPIC_API_KEY
```

**SÓ PROSSEGUIR PRO PASSO 1 SE DEPLOY ESTIVER ACTIVE.**

---

## 🛡 PASSO 1 — BACKUP MYSQL (5 min)

### Via painel (recomendado)
1. Painel Railway → service MySQL → aba **Data**
2. **Export** → baixar `.sql.gz`
3. Salvar em `C:\Users\User\sixxis-store\backups\2026-04-29-pre-scripts.sql.gz`

### Via CLI (alternativa)
```bash
railway login
railway link  # selecionar Sixxis Store
```

⚠️ **NÃO PULAR.** É a única volta se algo bagunçar.

---

## 🗄 PASSO 2 — APLICAR SCHEMA (1 min)

```bash
cd C:\Users\User\sixxis-store
git checkout main
git pull origin main

railway login   # se necessário
railway link    # selecionar Sixxis Store project + service principal

railway run npx prisma db push
```

> Nota: o repo usa `db push` (não `migrate deploy`) porque não tem pasta `prisma/migrations`. A única mudança nova é a coluna nullable `Banner.imagemMobile String?` — segura, sem perda de dados.

**Esperado:** `The database is now in sync with the Prisma schema.`

---

## 🧹 PASSO 3 — RODAR 4 SCRIPTS DE LIMPEZA/SEED

```bash
# 3.1 Limpar secrets do banco
railway run npx tsx scripts/limpar-secrets-loja.ts

# 3.2 Seed do cupom SIXXIS10
railway run npx tsx scripts/seed-sixxis10.ts

# 3.3 Limpar reviews duplicadas
railway run npx tsx scripts/limpar-reviews-duplicadas.ts

# 3.4 Seed reviews realistas
railway run npx tsx scripts/seed-reviews-realistas.ts
```

**Outputs esperados:**
- 3.1: log das chaves removidas (anthropic_api_key, mercadopago_*, r2_*, evolution_*, etc)
- 3.2: `✅ Cupom SIXXIS10 criado` ou `atualizado`
- 3.3: log de N reviews removidos
- 3.4: log de ~36-40 reviews criados (4 por produto × 9 produtos não-SX040)

**Se algum script falhar:**
- Restaurar backup (PASSO 1)
- Reportar erro literal
- NÃO prosseguir

---

## ✅ PASSO 4 — VALIDAR ADMIN EM PROD (5 min)

### `/adm-a7f9c2b4/configuracoes-loja`
- [ ] Lista ≤ 30 chaves (não 97)
- [ ] Nenhuma chave com `api_key`, `secret`, `token`, `password`, `hash` no nome
- [ ] Inputs sensíveis substituídos por `<EnvVarHint>`

### `/adm-a7f9c2b4/cupons`
- [ ] `SIXXIS10` ativo, percentual 10%, primeira compra apenas

### `/adm-a7f9c2b4/avaliacoes`
- [ ] 5 reviews aleatórias com texto distinto (sem clones do Ricardo P. / Fernanda C.)

### `/adm-a7f9c2b4/produtos`
- [ ] Lista produtos reais (≥10), não "0 encontrados"

### `/adm-a7f9c2b4/clientes`
- [ ] CPF mascarado (`***.***.876-87`)

### `/adm-a7f9c2b4/banners`
- [ ] Form com 2 uploads: Desktop (3:1) + Mobile (1:1 ou 4:3)
- [ ] Validação obriga título preenchido

### `/adm-a7f9c2b4` sidebar
- [ ] NÃO existe mais aba "Agente Luna" em /configuracoes
- [ ] Card no topo redireciona pra /adm-a7f9c2b4/luna

**Se algum falhar:** restaurar backup, abrir issue, NÃO prosseguir.

---

## 🖼 PASSO 5 — RE-UPLOAD IMAGENS DAS CATEGORIAS (2 min, opcional)

Em `/adm-a7f9c2b4/editor-home` ou `/configuracoes-loja`:
- **Climatizadores**: foto SX040/SX120 fundo claro ~600×600
- **Spinning**: foto Sixxis Life fundo claro ~600×600

⚠️ Pode pular se fallback Lucide do MOB-3 (Wind/Bike/Fan) estiver suficiente.

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
- [ ] Reduz altura ao scrollar (~95px scrolled)
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

### Script de DB falhou
Restaurar backup (PASSO 1).

### Deploy quebrou prod
```bash
git revert HEAD --no-edit
git push origin main
```

### Mobile com bug crítico no iPhone
Reverter só o merge mobile:
```bash
git log --oneline -10
git revert -m 1 0dee5dd --no-edit  # hash do merge mobile
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
- [x] Branches polimento-* deletadas no remote (já feito nesta sessão)
