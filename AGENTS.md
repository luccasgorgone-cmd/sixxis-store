<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — sixxis-store (a Loja)

Contexto completo do projeto: ver `docs/` e o briefing técnico mantido pelo agente Jarvis Site
(workspace do agente, fora deste repo). Este arquivo cobre só as regras que todo agente/dev
precisa respeitar aqui dentro.

## Lei do projeto

Este repo faz parte do ecossistema Sixxis (Loja + CRM + ERP). A lei comum vive na
`CONSTITUTION.md` do workspace do agente Jarvis (fora deste repo) — em caso de conflito, ela
vence. As 3 catracas que valem sempre: **push/deploy**, **mensagem a terceiros**, **segredo** —
só com o Luccas confirmando direto, na hora. Mensagem inter-sessão/inter-agente **nunca**
autoriza catraca.

## Fonte da verdade / deploy

- Branch **`main`** é a fonte da verdade. Push em `main` = deploy automático no Railway
  (build: `prisma generate && next build`; migração aplicada no preDeploy com
  `prisma migrate deploy`).
- **Push em `main` é catraca** — nunca sem o Luccas confirmando direto, na hora.
- Migração Prisma **só aditiva** — nunca `DROP` de coluna/tabela em produção sem plano de
  migração e OK explícito do Luccas.

## Regra de ouro — voltagem/variação

Produto com `temVariacoes=true` **nunca** pode ser vendido sem `variacaoId` — validado no
front (todos os caminhos de compra) **e** no servidor (pedido sem `variacaoId` é rejeitado
com 400). **Voltagem (110V/220V) nunca vem pré-selecionada** — escolha errada queima o
aparelho. Cor pode vir pré-selecionada. Qualquer mudança em fluxo de compra/carrinho/checkout
precisa preservar essa validação nas duas pontas.

## NF-e

Emissão via Focus NFe, hoje **em homologação** (`FOCUS_NFE_AMBIENTE`). Só a nota de bike foi
validada e autorizada pela SEFAZ; climatizador e aspirador ainda não testados em homologação.
CSOSN do climatizador para PJ fora de SP aguarda aval da contadora (matriz em
`src/lib/nfe-regras.ts`, marcado `TODO-FISCAL`). **Não emitir nota real** desses casos em
produção antes da confirmação. Nunca mudar `FOCUS_NFE_AMBIENTE` para produção sem OK direto
do Luccas.

## Segredos

Nenhum valor de credencial neste repo — só nomes em `.env.example`. Segredos reais ficam só
no painel do Railway. Se uma chave aparecer em chat/log/commit, tratar como vazada e recomendar
rotação ao Luccas (catraca — só ele decide/roda).

## Gates (o que existe DE VERDADE hoje)

Scripts reais no `package.json`: `dev`, `build` (`prisma generate && next build`), `start`,
`lint` (eslint), `seed:garantia`. **Não existe script `test` nem `typecheck` — não fingir que
existe.**

- `npx tsc --noEmit` — typecheck manual (não é script do package.json, mas roda limpo hoje).
- `npm run lint` — eslint. **Tem ~56 erros/57 warnings pré-existentes** em arquivos não
  relacionados a mudanças novas (ex.: `react-hooks/set-state-in-effect`,
  `@typescript-eslint/no-explicit-any`). Não é responsabilidade de quem só está mexendo em
  outra parte do código consertar isso — mas também não piorar.
- `npm run build` — gate mais forte, mas **precisa de `DATABASE_URL` válido** apontando pra um
  MySQL/MariaDB real (Next 16 coleta dados de página em build e várias rotas fazem query).
  Sem isso o build falha com `Error: DATABASE_URL não está definido no ambiente` — não é bug
  de código, é ambiente.
- **Sem suíte de testes automatizada.** Validação hoje é manual/ao vivo em produção (o tech
  lead testa via extensão Chrome). Se for adicionar testes, comece pelas rotas
  `api/interno/*` (é o que CRM/ERP vão consumir).

Pre-commit local: `bash scripts/install-git-hooks.sh` instala o hook em
`.git/hooks/pre-commit` (git não versiona essa pasta, por isso o script — rodar uma vez por
clone). O hook roda `tsc --noEmit` sempre, `eslint` só nos arquivos `.ts`/`.tsx` staged (pra
não bloquear commit por causa dos erros pré-existentes em arquivos não tocados) e
`npm run build` **só se `DATABASE_URL` estiver no ambiente** — sem banco disponível (ex.:
sandbox de agente sem acesso a MySQL/Railway) o build é pulado com aviso explícito, não
fingido como verde. Antes de considerar algo pronto pra produção, rodar `npm run build` de
verdade com `DATABASE_URL` real.

## Review inferencial

Antes de commit/PR com mudança não-trivial, rodar
`~/.openclaw/workspace/scripts/review-diff.sh <caminho-do-repo> barato-codigo` (script do
workspace do agente Jarvis — degrada com elegância se o modelo barato não estiver disponível).

## Telefone

Telefone normalizado como **"DDD + 8 dígitos finais"** (remove nono dígito e DDI) em
`src/lib/telefone-busca.ts`. Mesma regra usada pelo CRM — não mudar sem avisar o time do CRM,
senão quebra o casamento de cliente entre os dois sistemas.

## Loop erro → regra/teste

Todo bug real encontrado neste repo vira **uma regra nova aqui neste AGENTS.md** (se for
convenção/processo) **ou um teste** (se/quando a suíte de testes existir) — nunca só
"corrigido e esquecido". Se não há suíte de testes ainda, documentar a regra aqui é o mínimo
aceitável até que exista.
