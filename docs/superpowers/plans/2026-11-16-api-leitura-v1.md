# API de Leitura v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar em `/api/v1` uma API server-to-server, somente leitura, autenticada e auditável, cobrindo os 49 models Prisma de negócio da Loja e as métricas Site do brief.

**Architecture:** Um único Route Handler catch-all delega para um pipeline comum (request-id, auth, scopes, rate limit, auditoria, RFC 9457) e para registries explícitos de recursos e métricas. Cada recurso define `select` e serializer allowlist, filtros, cursores, campos/expansões e metadados usados também para gerar OpenAPI/docs, sem `select *` ou serialização genérica de rows Prisma.

**Tech Stack:** Next.js 16.4 Route Handlers, TypeScript, Prisma 7/MariaDB, Zod 4, Upstash Ratelimit/Redis, Vitest 4; `ajv@8` e `yaml` somente como devDependencies justificadas.

**Spec:** `/home/pzxx1010/.openclaw/workspace/main/apis-leitura/BRIEF-API-LEITURA-v1.md`

## Global Constraints

- Somente `GET`, `HEAD` e `OPTIONS`; qualquer `POST/PUT/PATCH/DELETE` sob `/api/v1` responde 405 e nunca chama Prisma de negócio.
- Migração somente aditiva; nenhuma remoção/renomeação de tabela, coluna ou índice.
- Base `/api/v1`; JSON UTF-8; datas ISO UTC; dinheiro BRL como decimal string de 2 casas; `Cache-Control: no-store`; sem headers CORS.
- Chave `sxs_live_` com 32 bytes aleatórios; guardar apenas SHA-256; comparação com `timingSafeEqual`; `read:all` não implica `read:pii` nem `read:mensagens`.
- Lista: cursor estável, `limit=100`/máximo 500, id como desempate; `expand` profundidade 1; `fields` allowlist; recursos volumosos exigem janela.
- Nunca expor senha/hash/token/secret/API key, QR Pix, token de cartão, payload cru de gateway ou hash identificador, mesmo com todos os scopes.
- Reusar Zod e Upstash instalados. Sem dependência runtime nova; adicionar apenas `ajv@8` (contrato OpenAPI) e `yaml` (artefato YAML sem drift) em devDependencies.
- Não tocar checkout, WhatsApp ou rotas existentes; `src/proxy.ts` permanece inalterado.

## Review Focus

1. Chave válida com prefixo colidido ou hash malformado nunca autentica e executa sempre uma comparação constante (Task 3).
2. `fields`/`expand` não contornam scopes nem reintroduzem PII/segredos em relações (Tasks 4–8).
3. Cursores com filtro/sort/recurso diferente retornam 400; empate no campo de ordenação não duplica nem pula item (Task 4).
4. Tabela volumosa sem janela, janela invertida ou maior que 31 dias retorna 400 antes da query (Tasks 4 e 8).
5. Texto/JSON livre contendo Bearer token, PAN ou chave proibida é redigido mesmo com `read:all+pii+mensagens` (Tasks 2 e 11).

---

## Mapa de arquivos

- Modify: `prisma/schema.prisma`, `.env.example`, `package.json`, `package-lock.json`
- Create: `prisma/migrations/20261116190000_api_leitura_v1/migration.sql`
- Create: `src/lib/api-v1/{types,constants,problem,format,redact,query,cursor,auth,rate-limit,audit,pipeline,resource,registry,router,openapi}.ts`
- Create: `src/lib/api-v1/resources/{clientes,catalogo,vendas,marketing,analytics}.ts`
- Create: `src/lib/api-v1/metricas/{tempo,vendas,funil,operacao,clientes,registry}.ts`
- Create: `src/app/api/v1/route.ts`, `src/app/api/v1/[...segments]/route.ts`
- Create: `scripts/api-chave.ts`, `scripts/gerar-api-v1-artefatos.ts`
- Create tests colocados em `src/lib/api-v1/*.test.ts`, `src/lib/api-v1/resources/*.test.ts`, `src/lib/api-v1/metricas/*.test.ts`
- Create deliverables: `docs/api-v1/{README.md,openapi.json,openapi.yaml,colecao.postman.json,sincronizar-exemplo.ts}`

Interfaces compartilhadas, fixadas antes dos registries:

```ts
type ApiScope = 'read:all'|'read:clientes'|'read:catalogo'|'read:pedidos'|'read:marketing'|'read:analytics'|'read:auditoria'|'read:configuracoes'|'read:financeiro'|'read:pii'|'read:mensagens'
type ApiIdentity = { id:string; nome:string; prefixo:string; scopes:ReadonlySet<ApiScope>; expiraEm:Date|null }
type ApiContext = { requestId:string; identity:ApiIdentity|null; ip:string; startedAt:number; rateLimit:RateLimitResult }
type ListQuery = { limit:number; cursor?:string; sort:string; ids?:string[]; fields?:string[]; expand?:string[]; criadoDesde?:Date; criadoAte?:Date; atualizadoDesde?:Date; atualizadoAte?:Date; status?:string[]; q?:string; filters:Record<string,string[]> }
type ResourceDefinition<T> = { slug:string; model:string; scope:ApiScope; fields:readonly FieldDefinition[]; expands:readonly ExpandDefinition[]; querySchema:ZodType; list(ctx:ApiContext,q:ListQuery):Promise<T[]>; detail(ctx:ApiContext,id:string,expand:string[]):Promise<T|null>; serialize(row:T,ctx:ApiContext,fields?:string[]):Record<string,unknown>; countAndLastUpdate(ctx:ApiContext):Promise<{count:number;ultimaAtualizacao:string|null}> }
type MetricDefinition<T> = { slug:string; scope:'read:analytics'|'read:financeiro'; query(ctx:ApiContext,p:MetricParams):Promise<T>; schema:Record<string,unknown> }
```

`read:all` satisfaz scopes de domínio/financeiro/auditoria/configuração, mas nunca os scopes aditivos `read:pii` e `read:mensagens`. Todo selector Prisma e todo serializer lista campos nominalmente; `fields` só reduz a allowlist depois da serialização, e `id` permanece sempre.

## Matriz de cobertura dos models

O schema real da base `4fbc3fa` contém **49**, não 42, models. “Todos os campos” abaixo significa todos os escalares do schema listados no `select` e no serializer, exceto as exclusões explícitas; relações só entram via `expand`, profundidade 1, máximo 3 relações e máximo 50 filhos por relação.

| Model → recurso | Scope | Sync/janela | Expands | Exclusões/guardas permanentes |
|---|---|---|---|---|
| Cliente → `clientes` | clientes | `updatedAt` novo | enderecos,pedidos,pontos,cashback | `senha`; PII em nome/email/docs/telefone |
| Endereco → `enderecos` | clientes | `createdAt/updatedAt` novos | cliente,pedidos | endereço inteiro mascarado sem PII |
| Produto → `produtos` | catalogo | `updatedAt` novo | variacoes,avaliacoes,destaques,freteRegras | custos exigem financeiro |
| Pedido → `pedidos` | pedidos | `updatedAt` novo | cliente,endereco,itens,pagamentos,garantias | `idempotencyKey`, lock; atribuição/IP/NF URLs exigem PII; custos exigem financeiro |
| GarantiaEstendida → `garantias-estendidas` | pedidos | `updatedAt` | pedido,produto | `acionamentos` passa redator recursivo |
| Pagamento → `pagamentos` | pedidos | `updatedAt`, 31d | pedido,tentativaMultiMetodo | `rawResponse`, QR Pix; payer PII; `valor` centavos→BRL |
| TentativaMultiMetodo → `tentativas-multimetodo` | pedidos | `updatedAt`, 31d | pedido,pagamentos | `proximaAcao` (token), erro/detalhe redigidos |
| ItemPedido → `itens-pedido` | pedidos | timestamps novos | pedido,produto | custo exige financeiro |
| Carrinho → `carrinhos` | pedidos | `createdAt`; reconciliação | cliente,itens | sessionId exige PII |
| ItemCarrinho → `itens-carrinho` | pedidos | timestamps novos | carrinho,produto | nenhum segredo |
| Avaliacao → `avaliacoes` | catalogo | `updatedAt` | cliente,produto,fotos | emailAutor/cliente PII |
| AvaliacaoFoto → `avaliacoes-fotos` | catalogo | `createdAt` imutável | avaliacao | URL allowlisted |
| Banner → `banners` | catalogo | `updatedAt` novo | — | nenhum segredo |
| Configuracao → `configuracoes` | configuracoes | `updatedAt` | — | só chaves públicas conhecidas; omitir `admin_*`, `newsletter_*` e desconhecidas |
| FormaPagamento → `formas-pagamento` | catalogo | `updatedAt` | — | nenhum segredo |
| Cupom → `cupons` | pedidos | `updatedAt` | usos | código/valores; nenhum segredo |
| CupomUso → `cupons-usos` | pedidos | `usadoEm` imutável | cupom,cliente | email/nome PII |
| HistoricoPontos → `historico-pontos` | clientes | `createdAt` imutável | cliente | nenhum segredo |
| ListaEspera → `lista-espera` | marketing | `updatedAt` novo | produto | email PII |
| PontosCliente → `pontos-clientes` | clientes | `updatedAt` | cliente | nenhum segredo |
| ProdutoDestaque → `produtos-destaques` | catalogo | `createdAt` imutável | produto | nenhum segredo |
| VariacaoProduto → `variacoes-produto` | catalogo | `updatedAt` novo | produto | dinheiro string |
| FreteRegra → `frete-regras` | catalogo | `atualizadoEm` | produto | dinheiro string |
| EmailTemplate → `email-templates` | configuracoes | `updatedAt` | — | corpo/assunto redigidos; não exige mensagens por ser template |
| CookieConsent → `cookies-consentimentos` | analytics | `createdAt`, 31d | — | sessionId/IP/UA PII |
| EventoAnalitico → `eventos-analiticos` | analytics | `createdAt`, 31d | — | legado/deprecated; dados redigidos |
| ClienteInsight → `clientes-insights` | analytics | `ultimaVisita`, 31d | — | sessionId/userId PII; strings JSON redigidas |
| AvaliacaoParceiro → `avaliacoes-parceiros` | catalogo | `updatedAt` | — | nome/cargo PII |
| CashbackTransacao → `cashback-transacoes` | clientes | `updatedAt` novo | cliente | dinheiro string |
| BloqueioFraude → `bloqueios-fraude` | auditoria | `createdAt`, 31d | cliente | motivo/criadoPor redigidos; cliente PII |
| Campanha → `campanhas` | marketing | `updatedAt` | whatsappNumero,destinatarios | mensagem/copy/WhatsApp exigem mensagens |
| NivelFidelidade → `niveis-fidelidade` | clientes | timestamps novos | — | gasto em BRL; cashbackPc percentual |
| CampanhaDestinatario → `campanhas-destinatarios` | marketing | `updatedAt` novo, 31d | campanha,cliente | nome/email/telefone PII; erro redigido |
| WhatsappNumero → `whatsapp-numeros` | configuracoes | `updatedAt` | campanhas | nunca `instanceId`,`apiUrl`,`apiKey`,`qrCode`; número PII |
| EnvioLog → `envios-logs` | marketing | `createdAt`, 31d | — | destinatário PII; erro redigido |
| LunaConversa → `luna-conversas` | mensagens | `updatedAt`, 31d | mensagens | sessão/IP/UA/cliente PII |
| LunaMensagem → `luna-mensagens` | mensagens | `createdAt`, 31d | conversa | conteúdo livre redigido; PII mascarada sem PII |
| SessaoVisitante → `sessoes-visitantes` | analytics | `updatedAt`, 31d | eventos | sessão/user/IP/UA/click ids PII |
| EventoTracking → `eventos-tracking` | analytics | `createdAt`, 31d | sessao | `dados` redigido; valor BRL string |
| RelatorioVendaHora → `relatorios-venda-hora` | analytics | `updatedAt`, 366d | — | receita BRL string |
| TentativaLogin → `tentativas-login` | auditoria | `createdAt`, 31d | — | IP/UA PII |
| BloqueioIp → `bloqueios-ip` | auditoria | `updatedAt` novo, 31d | — | IP PII; motivo redigido |
| PopupInicial → `popup-inicial` | catalogo | `updatedAt` | — | nenhum segredo |
| AuditLog → `auditoria` | auditoria | `createdAt`, 31d | — | IP/UA PII; metadata redigida recursivamente |
| Presenca → `presencas` | analytics | `ultimoPing`, 24h | — | sessaoId PII |
| CarrinhoCliente → `carrinhos-clientes` | pedidos | `atualizadoEm`, 31d | cliente | itens redigidos; cliente PII |
| TrafegoBruto → `trafego-bruto` | analytics | `dia`, 31d | — | `visitorHash` nunca exposto |
| SolicitacaoParceiro → `solicitacoes-parceiros` | marketing | `updatedAt` novo | — | dados pessoais/empresa PII; mensagem exige mensagens |
| MensagemContato → `mensagens-contato` | mensagens | `updatedAt` novo, 31d | — | contato PII; mensagem redigida |

Models novos `ApiChaveLeitura` e `ApiAuditoriaLeitura` são infraestrutura da própria API, não recursos de negócio: ficam fora do registry; `/me` expõe apenas metadados seguros da chave. Models imutáveis sem `updatedAt` sincronizam por `criadoDesde`/cursor e reconciliação periódica de IDs. Como não há soft-delete/tombstones no schema, remoções são detectadas por reconciliação completa agendada; `incluirExcluidos` é rejeitado como não suportado, não fingido.

## Tarefas

### Task 1: Persistência aditiva e índices de sincronização

**Files:** Modify `prisma/schema.prisma`; Create `prisma/migrations/20261116190000_api_leitura_v1/migration.sql`; Test `src/lib/api-v1/schema-contract.test.ts`

**Interfaces:** Produz `ApiChaveLeitura { id,nome,prefixo,hash,escopos Json,criadoEm,expiraEm,revogadoEm,ultimoUsoEm,ultimoIp }` e `ApiAuditoriaLeitura { id,chaveId?,prefixo?,requestId,rota,queryKeys Json?,status,duracaoMs,ip?,criadoEm }`. `hash` é `CHAR(64)` unique; chave→auditorias tem FK nullable e índices em prefixo, expiração/revogação, requestId e criadoEm.

- [ ] **RED:** testar que os dois models/campos/índices existem, que nenhum SQL contém `DROP|RENAME|DELETE|TRUNCATE`, e que os models mutáveis marcados “novo” na matriz ganharam timestamp/index.
- [ ] Run: `npm test -- src/lib/api-v1/schema-contract.test.ts` → FAIL por models ausentes.
- [ ] **GREEN:** escrever schema + SQL manual aditivo. Colunas de timestamp em tabelas existentes usam `DEFAULT CURRENT_TIMESTAMP(3)` para backfill seguro; índices em todo relógio usado por `atualizadoDesde`/janela.
- [ ] Run: `npx prisma format && npx prisma validate && npm test -- src/lib/api-v1/schema-contract.test.ts` → PASS.
- [ ] Commit: `git add prisma src/lib/api-v1/schema-contract.test.ts && git commit -m "feat(api-v1): add additive auth and sync schema"`

### Task 2: Contratos, envelopes, formatação e redaction

**Files:** Create `src/lib/api-v1/{types,constants,problem,format,redact}.ts`; Test `src/lib/api-v1/core.test.ts`

**Interfaces:** `problem(status,title,detail,requestId,type?) -> Response`; `listEnvelope(data,page,requestId)` e `itemEnvelope`; `money(value,fromCents=false)->string|null`; `iso(Date)->string`; `redactValue(value,{allowPii,allowMessages})->unknown`; máscaras determinísticas para email/telefone/CPF/CNPJ/nome/endereço/IP/IDs correlacionáveis.

- [ ] **RED:** afirmar RFC 9457/content-type/requestId; `Decimal('12.5') -> "12.50"`; centavos `123450 -> "1234.50"`; datas UTC; máscaras; redação recursiva de chaves proibidas, `Bearer`, PAN 13–19 dígitos e tokens de alta confiança, inclusive dentro de texto/JSON livre.
- [ ] Run: `npm test -- src/lib/api-v1/core.test.ts` → FAIL por imports ausentes.
- [ ] **GREEN:** implementar funções puras sem fallback que serialize `bigint`, `Decimal` ou `Date` cru; lista inclui `count`, `hasMore`, `nextCursor`, `generatedAt`, `apiVersion=1.0.0`; item inclui metadados do brief.
- [ ] Run: `npm test -- src/lib/api-v1/core.test.ts` → PASS.
- [ ] Commit: `git add src/lib/api-v1 && git commit -m "feat(api-v1): add response and redaction contracts"`

### Task 3: Autenticação, scopes, rate limit, auditoria e CLI de chave

**Files:** Create `src/lib/api-v1/{auth,rate-limit,audit,pipeline}.ts`, `scripts/api-chave.ts`, `src/lib/api-v1/auth.test.ts`, `src/lib/api-v1/pipeline.test.ts`, `src/lib/api-v1/api-key-cli.test.ts`; Modify `src/lib/ratelimit.ts`, `.env.example`, `package.json`

**Interfaces:** `hashApiKey(raw)->Buffer`; `authenticateBearer(req,deps)->Promise<ApiIdentity>`; `hasScope(identity,required)`; `withApiV1(handler,options)(Request)->Promise<Response>`; `rateLimitApiKey(id,600,'1 m')`; `auditRequest({identity,requestId,path,queryKeys,status,durationMs,ip})`. Formato raw: `sxs_live_` + 43 chars base64url; prefixo persistido = primeiros 20 chars.

- [ ] **RED:** cobrir 401 ausente/malformada/desconhecida/revogada/expirada; colisão de prefixo; digest DB inválido; dummy comparison em miss; 403 scope; `read:all` sem PII/mensagens; 600/min headers e 429/Retry-After; Upstash ausente/erro em produção → 503; auditoria sem query values/key; lastUsed/IP; CLI nunca lista hash/raw.
- [ ] Run: `npm test -- src/lib/api-v1/auth.test.ts src/lib/api-v1/pipeline.test.ts src/lib/api-v1/api-key-cli.test.ts` → FAIL.
- [ ] **GREEN:** consultar candidatos por prefixo, SHA-256 de tamanho fixo e `timingSafeEqual` contra candidato ou digest dummy; validar `escopos` via Zod. Estender o Upstash já existente com limiter `api-leitura` configurável por `API_V1_RATE_LIMIT_PER_MINUTE` (default 600), fail-closed em produção. Auditoria espera insert best-effort, nunca loga payload.
- [ ] CLI: `npm run api:chave -- criar --nome <nome> --escopos a,b [--expira-em ISO] [--output path]`, `listar`, `revogar --id|--prefixo`; `--output` cria modo `0600`, criação mostra raw uma única vez, listagem mostra só metadados.
- [ ] Run: `npm test -- src/lib/api-v1/auth.test.ts src/lib/api-v1/pipeline.test.ts src/lib/api-v1/api-key-cli.test.ts` → PASS.
- [ ] Commit: `git add src/lib/ratelimit.ts src/lib/api-v1 scripts package*.json .env.example && git commit -m "feat(api-v1): secure keys scopes limits and audit"`

### Task 4: Query engine, cursor estável, fields, expand e registry

**Files:** Create `src/lib/api-v1/{query,cursor,resource,registry}.ts`, `src/lib/api-v1/resource.test.ts`

**Interfaces:** `parseListQuery(url,definition)->ListQuery`; cursor base64url Zod `{v:1,resource,sort,value,id,filterHash}`; `buildSeekWhere`; `executeList(def,ctx,q)` busca `limit+1`; `projectFields`; `parseExpand` rejeita ponto/profundidade >1 e >3 relações. `ids` máximo 100, `q` máximo 200 chars, query timeout default 10s.

- [ ] **RED:** defaults/limites; parâmetro/campo/relação/sort desconhecido 400; cursor adulterado ou de outro filtro 400; dois itens com mesmo timestamp paginam por id sem duplicar/pular; `updatedSince` usa limite inclusivo + cursor; janela obrigatória ausente/invertida/>31d bloqueia antes do adapter; timeout vira 503.
- [ ] Run: `npm test -- src/lib/api-v1/resource.test.ts` → FAIL.
- [ ] **GREEN:** normalizar hash SHA-256 de filtros/sort/fields/expand; `orderBy=[{campo:dir},{id:dir}]`; expansões to-many `take:51` e retornam `_meta.hasMore` sem segundo nível; sparse fieldset nunca remove id nem adiciona campo.
- [ ] Run: `npm test -- src/lib/api-v1/resource.test.ts` → PASS.
- [ ] Commit: `git add src/lib/api-v1 && git commit -m "feat(api-v1): add safe resource query engine"`

### Task 5: Recursos de clientes e catálogo

**Files:** Create `src/lib/api-v1/resources/{clientes,catalogo}.ts`, tests homônimos

**Interfaces:** `clientes.ts` registra Cliente, Endereco, HistoricoPontos, PontosCliente, CashbackTransacao e NivelFidelidade; `catalogo.ts` registra Produto, Avaliacao, AvaliacaoFoto, Banner, Configuracao, FormaPagamento, ProdutoDestaque, VariacaoProduto, FreteRegra, EmailTemplate, AvaliacaoParceiro e PopupInicial (18 models). Selectors/serializers escrevem nominalmente todos os escalares não excluídos; filtros naturais: cliente/email/docs/bloqueado; produto/categoria/sku/slug/modelo/ativo; UF/produto; nota/aprovada; seção; chave segura de configuração.

- [ ] **RED:** fixture com sentinela em cada campo permitido e proibido prova cobertura; scopes/PII/custos; dinheiro/dimensões; expands passam serializer filho; Configuracao retorna somente set seguro (`loja_*`, `seo_*`, `social_*`, `cor_*`, `bg_*`, URLs/juros/cashback/fidelidade/agente visuais) e rejeita segredo/unknown.
- [ ] Run: `npm test -- src/lib/api-v1/resources/clientes.test.ts src/lib/api-v1/resources/catalogo.test.ts` → FAIL.
- [ ] **GREEN:** implementar 18 definitions sem spread de row e sem `include: true`; documentar enums `Cashback.tipo/status`, `Popup.frequencia` e flags de frete.
- [ ] Run: mesmo comando → PASS.
- [ ] Commit: `git add src/lib/api-v1/resources && git commit -m "feat(api-v1): expose customer and catalog resources"`

### Task 6: Recursos de vendas, marketing e mensagens

**Files:** Create `src/lib/api-v1/resources/{vendas,marketing}.ts`, tests homônimos

**Interfaces:** `vendas.ts` registra Pedido, GarantiaEstendida, Pagamento, TentativaMultiMetodo, ItemPedido, Carrinho, ItemCarrinho, Cupom, CupomUso e CarrinhoCliente; `marketing.ts` registra ListaEspera, Campanha, CampanhaDestinatario, WhatsappNumero, EnvioLog, LunaConversa, LunaMensagem, SolicitacaoParceiro e MensagemContato (19 models). Filtros: pedido/cliente/produto/variação/status/pagamento/UF/cidade/cupom/click-id; carrinho/status/etapa; campanha/tipo/status/canal; destinatário; conversa/status; datas naturais.

- [ ] **RED:** fixtures cobrem todo campo; `Pedido.idempotencyKey`, lock, `Pagamento.rawResponse`/QR, `Tentativa.proximaAcao`, credenciais WhatsApp nunca aparecem com scopes totais; conteúdos só com mensagens; PII/custos financeiros; `Pagamento.valor` convertido de centavos.
- [ ] Run: `npm test -- src/lib/api-v1/resources/vendas.test.ts src/lib/api-v1/resources/marketing.test.ts` → FAIL.
- [ ] **GREEN:** implementar definitions e enum catalog completo: Pedido/MP/NFe/multimétodo/estorno/carrinho, Campanha/Destinatario/WhatsApp/Luna, parceiro/contato. Valores legados em caixa diferente são descritos; valor desconhecido continua string e entra no audit de rollout.
- [ ] Run: mesmo comando → PASS.
- [ ] Commit: `git add src/lib/api-v1/resources && git commit -m "feat(api-v1): expose commerce and messaging resources"`

### Task 7: Recursos analíticos/auditoria e janelas obrigatórias

**Files:** Create `src/lib/api-v1/resources/analytics.ts`, `src/lib/api-v1/resources/analytics.test.ts`

**Interfaces:** Registrar CookieConsent, EventoAnalitico, ClienteInsight, SessaoVisitante, EventoTracking, RelatorioVendaHora, TentativaLogin, BloqueioIp, AuditLog, Presenca, TrafegoBruto e BloqueioFraude (12 models); `TrafegoBruto` usa `dia` YYYY-MM-DD, `Presenca` máximo 24h, `RelatorioVendaHora` máximo 366d, demais volumosos 31d/limit máximo 200.

- [ ] **RED:** cada recurso rejeita full scan; filtra tipo/session/produto/UTM/dispositivo/browser/OS/ação/sucesso; visitorHash nunca sai; JSON/texto passa redator; PII condicional; models deprecated aparecem com `deprecated: true` no catálogo.
- [ ] Run: `npm test -- src/lib/api-v1/resources/analytics.test.ts` → FAIL.
- [ ] **GREEN:** implementar definitions, counts/última atualização e selects indexáveis; nunca fazer busca textual sem janela.
- [ ] Run: mesmo comando → PASS.
- [ ] Commit: `git add src/lib/api-v1/resources && git commit -m "feat(api-v1): expose bounded analytics resources"`

### Task 8: Métricas Site com fórmulas explícitas

**Files:** Create `src/lib/api-v1/metricas/{tempo,vendas,funil,operacao,clientes,registry}.ts`, tests correspondentes

**Interfaces:** endpoints `metricas/vendas`, `funil`, `carrinhos`, `cupons-cashback-fidelidade`, `frete`, `avaliacoes`, `estoque-catalogo`, `clientes`; query obrigatória `de`, `ate`, `agrupar=dia|semana|mes`, máximo 366 dias; bucket em `America/Sao_Paulo`, semana começa segunda.

- [ ] **RED:** testar limites BRT e fórmulas: pedidos pagos = status pago/enviado/entregue; receita bruta = Σ(itens.precoUnitario×qtd)+garantias; receita líquida comercial = Σ(Pedido.total); lucro líquido conhecido = total−mpTaxaReal−custoFreteReal−Σ(custoUnitario×qtd), `null` se algum custo falta; ticket = receita líquida/pedidos pagos.
- [ ] **RED:** vendas quebram por status MP, método real, produto/variação, UF/cidade e atribuição. Origem liga `EventoTracking.purchase.dados.transaction_id` a Pedido/SessaoVisitante; sem ligação = `nao_atribuida`; gclid/gbraid/wbraid/fbc formam canais de click-id.
- [ ] **RED:** funil = sessões distintas → `view_item` → `add_to_cart` → `begin_checkout` → outcome `submit` → `purchase`; comercial = checkout inativo ≥1h sem purchase nem outcome técnico; técnico = sem purchase com `rejected|api_error|brick_error`; dados dependem de consentimento e são rotulados `tracked`.
- [ ] **RED:** cupons (usos/desconto/receita), cashback (crédito/débito/saldo), fidelidade por faixas, frete (seleção `add_shipping_info`, valor/prazo/transportadora; cotações ofertadas não persistidas), avaliações, estoque/catálogo, novos vs recorrentes (primeiro pedido pago) e LTV = Σ pedidos pagos histórico por cliente/quantidade de clientes compradores.
- [ ] Run: `npm test -- src/lib/api-v1/metricas` → FAIL.
- [ ] **GREEN:** implementar agregações com selects controlados/queries agrupadas, sem N+1; todos valores monetários string; cada payload inclui `definicoes`, `timezone` e `periodo`.
- [ ] Run: `npm test -- src/lib/api-v1/metricas` → PASS.
- [ ] Commit: `git add src/lib/api-v1/metricas && git commit -m "feat(api-v1): add documented store metrics"`

### Task 9: Router, health, me, meta e política HTTP

**Files:** Create `src/lib/api-v1/router.ts`, `src/app/api/v1/route.ts`, `src/app/api/v1/[...segments]/route.ts`, `src/lib/api-v1/router.test.ts`

**Interfaces:** `routeApiV1(req,segments,deps)->Response`; rotas públicas somente `health`, `openapi.json`, `docs`; autenticadas: `me`, `meta/recursos`, recursos e métricas. Root retorna catálogo de links sem dados. Exports explícitos GET/HEAD/OPTIONS e handlers 405 para POST/PUT/PATCH/DELETE.

- [ ] **RED:** `health={status,version,commit,time}` e 503 se DB falha; `me` sem hash/IP e com scopes/expiração/limite; meta retorna somente recursos autorizados, fields/types/enums/expands/count/ultimaAtualizacao; item 404; todas respostas têm request-id/no-store/no CORS; HEAD sem body; OPTIONS 204 `Allow`; métodos de escrita 405 e zero chamadas Prisma.
- [ ] Run: `npm test -- src/lib/api-v1/router.test.ts` → FAIL.
- [ ] **GREEN:** dispatcher explícito (nunca resolver nome de model vindo da URL); counts de meta com concorrência 4 e timeout; commit usa `RAILWAY_GIT_COMMIT_SHA`/`VERCEL_GIT_COMMIT_SHA` ou `unknown`.
- [ ] Run: mesmo comando → PASS.
- [ ] Commit: `git add src/app/api/v1 src/lib/api-v1/router* && git commit -m "feat(api-v1): add versioned read-only routes"`

### Task 10: OpenAPI, entregáveis, anti-leak, gates e rollout

**Files:** Create `src/lib/api-v1/openapi.ts`, `scripts/gerar-api-v1-artefatos.ts`, `docs/api-v1/*`, `src/lib/api-v1/{openapi-contract,anti-leak,read-only}.test.ts`; Modify `package.json`, `package-lock.json`

**Interfaces:** `buildOpenApi(registry,metrics)->OpenAPI 3.1`; `npm run api:v1:docs` gera JSON, YAML e Postman deterministicamente. Docs HTML usa Scalar standalone via CDN apontando para `/api/v1/openapi.json` (sem runtime dependency); sync example pagina até `hasMore=false`, persiste watermark `atualizadoDesde` e deduplica por id.

- [ ] **RED:** Ajv 2020 valida envelopes reais principais (clientes/produtos/pedidos/eventos + todas métricas) contra schemas da spec; cada registry entry tem paths list/detail, parâmetros, scopes, enums/exemplos; artifacts regenerados não têm diff; Postman tem `{{baseUrl}}`/`{{token}}` e todas rotas.
- [ ] **RED:** anti-leak percorre lista/detalhe/todos expands de **49 recursos**, 8 métricas, meta/me com fixture cheia e scopes totais; falha por nomes proibidos e padrões de segredo/PAN. Read-only chama POST/PUT/PATCH/DELETE em root, recurso, item, métrica e desconhecida e exige 405/zero mutations.
- [ ] Run: `npm test -- src/lib/api-v1/openapi-contract.test.ts src/lib/api-v1/anti-leak.test.ts src/lib/api-v1/read-only.test.ts` → FAIL.
- [ ] **GREEN:** escrever OpenAPI 3.1 e README PT-BR com autenticação/scopes, cursor/sync, erros/rate limit, os 49 recursos/campos, enums, métricas/fórmulas/limitações, curl por padrão de endpoint, versionamento/changelog; gerar YAML/Postman e exemplo TS. Não inserir dado real.
- [ ] Run: `npm run api:v1:docs && git diff --exit-code docs/api-v1 && npx prisma generate && npx tsc --noEmit && npm test` → PASS.
- [ ] Run lint focal: `npx eslint src/lib/api-v1 src/app/api/v1 scripts/api-chave.ts scripts/gerar-api-v1-artefatos.ts` → PASS; depois `npm run lint` e registrar separadamente baseline global legado se persistir.
- [ ] Run build com DB real: `DATABASE_URL="$DATABASE_URL" npm run build` → PASS; rodar `~/.openclaw/workspace/scripts/review-diff.sh "$PWD" barato-codigo` e revisão independente `differential-review` focada em secret/PII/auth/IDOR/DoS.
- [ ] Commit: `git add . && git commit -m "docs(api-v1): publish contract and integration kit"`
- [ ] Rollout autorizado somente após gates: conferir Upstash no Railway; `git push`/PR/merge; preDeploy aplica migration aditiva. Criar chave sem eco: `npm run api:chave -- criar --nome luccas-programa-externo --escopos read:all,read:pii,read:mensagens --output /home/pzxx1010/.openclaw/workspace/main/apis-leitura/site-api-chave.txt`; conferir `0600` sem ler valor.
- [ ] Smoke produção com chave via arquivo/SecretRef: health, me, 49 listas + um detalhe existente, 8 métricas, 401 sem chave, 403 scope reduzido, 405 escrita; revisar logs por config/500 e headers. Copiar 4 entregáveis para `.../apis-leitura/site/`.
- [ ] Receipt ao `main`: URL, endpoints, arquivos, PR/commit/deploy, contagens/gates/smoke, security findings, exclusões justificadas, rollback `git revert <merge>` + redeploy (migration permanece aditiva/inócua), pendências; `STATUS: COMPLETO|PARCIAL`.

## Self-review contra as 9 seções do brief

1. **Princípios:** Tasks 2, 5–7 e 10 fixam read-only, 49/49 models, serializers allowlist, proibições absolutas, no-store/CORS off. Nenhum model de negócio ficou fora.
2. **Base/formato:** Tasks 2, 4 e 9 cobrem `/api/v1`, envelopes/meta/request-id, UTC, dinheiro string, RFC 9457 e códigos 400/401/403/404/429/500/503.
3. **Auth/scopes:** Tasks 1 e 3 cobrem prefixo, SHA-256/timing-safe/dummy compare, múltiplas chaves, expiração/revogação/rotação, PII/mensagens e CLI. A chave de produção só nasce pós-deploy em arquivo `0600`.
4. **Endpoints:** Tasks 4–7 cobrem cursor/filtros naturais/q/fields/expand, sync incremental/índices, janelas e reconciliação de remoções. Decisão: sem inventar tombstone; hard deletes exigem full-ID reconciliation documentada.
5. **Transversais/KPIs:** Tasks 8–10 cobrem health/OpenAPI/docs/meta/me e 8 famílias de métricas com fórmulas/BRT. Gap de dado honesto: tentativas de cotação ofertadas não são persistidas; `add_shipping_info` mede seleção, e o README não a chama de oferta.
6. **Robustez:** Tasks 3, 4 e 9 cobrem 600/min configurável, timeout, limites anti-DoS, selects/expands controlados, auditoria sanitizada e sem mudança em fluxos atuais. ETag fica fora da v1 por ser desejável, não obrigatório, e conflito com `no-store`; decisão registrada no changelog.
7. **Testes:** Tasks 3, 4 e 10 cobrem auth/scopes/máscaras, paginação/sync, 49-resource anti-leak, 405, OpenAPI/Ajv e gates reais.
8. **Entregáveis:** Task 10 gera JSON+YAML, README/dicionário/fórmulas/curls, Postman e sync TS, com teste de drift e cópia final.
9. **Processo:** worktree/branch/base conferidos (`feat/api-leitura-v1`, `4fbc3fa`); Task 10 inclui review independente, PR/CI/deploy, chave, smoke, cópia, receipt e rollback.

**Preflight/YAGNI:** Zod, Prisma, Web Crypto/Node crypto e Upstash já resolvem validação, persistência, hashing e rate limit. Não será criado framework genérico fora do registry necessário. `ajv@8` e `yaml` são as únicas dependências novas e apenas de desenvolvimento; Scalar é carregado no endpoint de docs sem pacote runtime. Não usar o Ajv transitivo de ESLint/Prisma, pois não é contrato estável do projeto.

**Decisões que requerem concordância antes de executar:** (a) classificação tratada como Architectural por introduzir subsistema público autenticado, apesar do brief chamar Bounded; este plano é o gate; (b) adicionar timestamps apenas aos models mutáveis marcados na matriz, sem reescrever os imutáveis; (c) manter tabelas técnicas da API fora do catálogo; (d) mascarar também nome/IP/identificadores correlacionáveis sem `read:pii`; (e) ETag adiado.

Plano revisado: interfaces consistentes, todas as cinco condições de Review Focus têm teste proprietário, 49 models aparecem exatamente uma vez na matriz, e cada tarefa termina em RED→GREEN→commit verificável.
